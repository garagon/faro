// Personal data stays in this origin's browser storage. No network fallback.
export function writeLocal(
  key: string,
  value: string,
  storage: Pick<Storage, 'setItem' | 'getItem'> = localStorage,
) {
  storage.setItem(key, value);
  if (storage.getItem(key) !== value) throw Error('Browser did not retain the saved data');
}
export function removeLocal(
  key: string,
  storage: Pick<Storage, 'removeItem' | 'getItem'> = localStorage,
) {
  storage.removeItem(key);
  if (storage.getItem(key) !== null) throw Error('Browser did not remove the saved data');
}

/** Public official copies kept for offline use: earthquakes, national warnings, SINAPROC, NOAA. */
const OFFICIAL_COPY = /^faro-(igc-v1|emsc-v1|usgs-v1|national-[A-Z]{2}|sinaproc|tsunami)$/;
export const OFFICIAL_COPY_DAYS = 7;
/**
 * Deletes kept official copies that are older than a week or unreadable, as PRIVACY.md states.
 * Returns the keys removed.
 */
export function pruneOfficialCopies(
  now = Date.now(),
  storage: Pick<Storage, 'length' | 'key' | 'getItem' | 'removeItem'> = localStorage,
) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && OFFICIAL_COPY.test(key)) keys.push(key);
  }
  return keys.filter((key) => {
    let fetched = NaN;
    try {
      fetched = Number(JSON.parse(storage.getItem(key) || 'null')?.fetched);
    } catch {
      // Unreadable copies are removed.
    }
    const old =
      !Number.isFinite(fetched) || fetched > now || now - fetched > OFFICIAL_COPY_DAYS * 86400000;
    if (old) storage.removeItem(key);
    return old;
  });
}
