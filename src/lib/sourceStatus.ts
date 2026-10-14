/**
 * The state of one official source for the sources page. A source that answered long ago, or
 * while the device is offline, is "old data", never "working".
 */
export type SourceState = 'ok' | 'partial' | 'stale' | 'failed' | 'checking' | 'offline' | 'idle';

export function sourceState(s: {
  /** When the data was retrieved, on this device's clock; null if never. */
  checked: number | null;
  failed: boolean;
  partial?: boolean;
  /** The adapter served its previous copy. */
  stale?: boolean;
  online: boolean;
  now: number;
  /** Older than this counts as old data (a few polling cycles). */
  maxAge: number;
  /** Not polled now (another earthquake catalogue is selected). */
  idle?: boolean;
}): SourceState {
  if (s.idle) return 'idle';
  if (!s.checked) return s.failed ? 'failed' : s.online ? 'checking' : 'offline';
  if (s.failed) return 'failed';
  if (!s.online || s.stale || s.now - s.checked > s.maxAge) return 'stale';
  return s.partial ? 'partial' : 'ok';
}
