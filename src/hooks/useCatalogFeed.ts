import { useCallback, useEffect, useRef, useState } from 'react';
import type { CatalogSnapshot, CatalogReader } from '../catalogs/types.ts';
import { createFeedTracker, type FeedUpdate } from '../lib/feedUpdates.ts';
/**
 * Polls a catalog every 60 s while the tab is visible and the catalog is enabled.
 * Disabled catalogs keep their last snapshot but make no requests and do not tick.
 */
export function useCatalogFeed(reader: CatalogReader, enabled = true) {
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
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      ac.abort();
    }, 20000);
    // A request is stale once a newer one started or the effect was cleaned up.
    const current = () => mounted.current && controller.current === ac && !ac.signal.aborted;
    try {
      const data = await reader.read(ac.signal);
      if (!current()) return;
      const receivedAt = Date.now();
      setUpdates(tracker.current.observe(data.events, receivedAt));
      setFeed(data);
      setChecked(receivedAt);
      setFailed(false);
    } catch {
      // A timeout aborts this request on purpose and still counts as a failure.
      if (mounted.current && controller.current === ac && !(ac.signal.aborted && !timedOut))
        setFailed(true);
    } finally {
      clearTimeout(timeout);
      if (controller.current === ac) {
        controller.current = null;
        if (mounted.current) {
          setBusy(false);
          const finished = Date.now();
          setNow(finished);
          due.current = finished + 60000;
          setNext(due.current);
        }
      }
    }
  }, [reader]);
  useEffect(() => {
    mounted.current = true;
    setOnline(navigator.onLine);
    try {
      const cached = reader.cached?.();
      // Never let an older browser cache replace a fresher snapshot already in memory.
      if (cached) setFeed((prev) => (cached.fetched > prev.fetched ? cached : prev));
    } catch {}
    if (!enabled) {
      return () => {
        mounted.current = false;
        controller.current?.abort();
        controller.current = null;
        setBusy(false);
      };
    }
    const initial = setTimeout(() => {
      if (Date.now() >= due.current) void refresh();
    }, 0);
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
      controller.current = null;
      setBusy(false);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [refresh, reader, enabled]);
  return { ...feed, busy, failed, online, now, next, checked, updates, refresh };
}
