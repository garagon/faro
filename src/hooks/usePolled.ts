import { useCallback, useEffect, useRef, useState } from 'react';
import { attemptResult, type Attempt } from '../lib/sourceStatus.ts';

/** A last good answer kept on the device, validated again before it is shown. */
export type Persist<T> = { key: string; revive: (value: unknown) => T | null };
function restore<T>(persist?: Persist<T>): T | null {
  if (!persist) return null;
  try {
    return persist.revive(JSON.parse(localStorage.getItem(persist.key) || 'null'));
  } catch {
    return null;
  }
}

/**
 * Polls a read function while the tab is visible and online. A failure keeps the previous
 * snapshot, sets `failed` and records when it was tried (`failedAt`); it never replaces data with
 * an empty success. With `persist`,
 * the last good answer is stored and restored on a later visit (for example offline), carrying
 * its original retrieval time so it is shown as older data.
 */
export function usePolled<T>(
  read: (signal: AbortSignal) => Promise<T>,
  interval: number,
  enabled = true,
  persist?: Persist<T>,
) {
  const [data, setData] = useState<T | null>(() => (enabled ? restore(persist) : null)),
    [attempt, setAttempt] = useState<Attempt>({ failed: false, failedAt: null }),
    [busy, setBusy] = useState(false),
    // When this device last received a valid answer, for sources without their own time.
    [at, setAt] = useState<number | null>(null);
  const controller = useRef<AbortController | null>(null);
  // A different request (another country or area) must never show the previous answer.
  const lastRead = useRef(read);
  if (lastRead.current !== read) {
    lastRead.current = read;
    setData(enabled ? restore(persist) : null);
    if (attempt.failed) setAttempt({ failed: false, failedAt: null });
    if (at !== null) setAt(null);
  }
  const refresh = useCallback(async () => {
    if (controller.current || !navigator.onLine) return;
    const ac = new AbortController();
    controller.current = ac;
    const timer = setTimeout(() => ac.abort(), 20000);
    setBusy(true);
    try {
      const next = await read(ac.signal);
      if (controller.current !== ac) return;
      const received = Date.now();
      setData(next);
      setAttempt(attemptResult(true, received));
      setAt(received);
      if (persist)
        try {
          localStorage.setItem(persist.key, JSON.stringify(next));
        } catch {
          // Storage blocked or full: the answer is still shown, just not kept.
        }
    } catch {
      if (controller.current === ac) setAttempt(attemptResult(false, Date.now()));
    } finally {
      clearTimeout(timer);
      if (controller.current === ac) {
        controller.current = null;
        setBusy(false);
      }
    }
    // persist changes together with read (both depend on the country).
  }, [read]);
  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, interval);
    const resume = () => {
      if (navigator.onLine && document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      clearInterval(tick);
      controller.current?.abort();
      controller.current = null;
      setBusy(false);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [refresh, interval, enabled]);
  return { data, failed: attempt.failed, failedAt: attempt.failedAt, busy, at, refresh };
}
