import { useCallback, useEffect, useRef, useState } from 'react';
import type { CatalogSnapshot, CatalogReader } from '../catalogs/types.ts';
import { createFeedTracker, type FeedUpdate } from '../lib/feedUpdates.ts';
export function useCatalogFeed(reader: CatalogReader) {
  const [feed, setFeed] = useState<CatalogSnapshot>({ events: [], generated: 0, fetched: 0 });
  const [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false),
    [online, setOnline] = useState(navigator.onLine);
  const [now, setNow] = useState(Date.now()),
    [next, setNext] = useState(Date.now()),
    [checked, setChecked] = useState(0);
  const [updates, setUpdates] = useState<FeedUpdate[]>([]);
  const tracker = useRef(createFeedTracker()),
    controller = useRef<AbortController | null>(null),
    mounted = useRef(false),
    due = useRef(0);
  const refresh = useCallback(async () => {
    if (controller.current || !navigator.onLine) return;
    const ac = new AbortController();
    controller.current = ac;
    setBusy(true);
    const timeout = setTimeout(() => ac.abort(), 20000);
    try {
      const data = await reader.read(ac.signal);
      if (!mounted.current || ac.signal.aborted) return;
      const receivedAt = Date.now();
      setUpdates(tracker.current.observe(data.events, receivedAt));
      setFeed(data);
      setChecked(receivedAt);
      setFailed(false);
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      clearTimeout(timeout);
      controller.current = null;
      if (mounted.current) {
        setBusy(false);
        const finished = Date.now();
        setNow(finished);
        due.current = finished + 60000;
        setNext(due.current);
      }
    }
  }, [reader]);
  useEffect(() => {
    mounted.current = true;
    try {
      const cached = reader.cached?.();
      if (cached) setFeed(cached);
    } catch {}
    const initial = setTimeout(() => void refresh(), 0);
    const tick = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= due.current && document.visibilityState === 'visible' && navigator.onLine)
        void refresh();
    }, 1000);
    const resume = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine && document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('online', resume);
    window.addEventListener('offline', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      mounted.current = false;
      clearTimeout(initial);
      clearInterval(tick);
      controller.current?.abort();
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [refresh, reader]);
  return { ...feed, busy, failed, online, now, next, checked, updates, refresh };
}
