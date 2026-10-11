import { writeLocal, removeLocal } from './browserStorage.ts';
export type Preferences = {
  version: 1;
  language: 'es' | 'en';
  destination: string;
  nationality: string;
  savedAt: number;
};
export const PREFERENCES_KEY = 'faro-preferences-v1';
export function parsePreferences(
  raw: unknown,
  codes: readonly string[],
  now = Date.now(),
): Preferences | null {
  const p = raw as Partial<Preferences> | null;
  if (
    !p ||
    p.version !== 1 ||
    !['es', 'en'].includes(p.language ?? '') ||
    !codes.includes(p.destination ?? '') ||
    !(p.nationality === '' || codes.includes(p.nationality ?? '')) ||
    typeof p.savedAt !== 'number' ||
    !Number.isFinite(p.savedAt) ||
    p.savedAt <= 0 ||
    p.savedAt > now
  )
    return null;
  // Copy only expected fields. Never restore GPS or arbitrary extra attributes.
  return {
    version: 1,
    language: p.language!,
    destination: p.destination!,
    nationality: p.nationality!,
    savedAt: p.savedAt,
  };
}
export function readPreferences(codes: readonly string[]): Preferences | null {
  try {
    return parsePreferences(JSON.parse(localStorage.getItem(PREFERENCES_KEY) || 'null'), codes);
  } catch {
    return null;
  }
}
export function storePreferences(
  value: Preferences,
  codes: readonly string[],
  storage: Pick<Storage, 'setItem' | 'getItem'> = localStorage,
) {
  const valid = parsePreferences(value, codes);
  if (!valid || !codes.includes(valid.nationality)) throw Error('Nationality required');
  writeLocal(PREFERENCES_KEY, JSON.stringify(valid), storage);
  return valid;
}
export function forgetPreferences(storage: Pick<Storage, 'removeItem' | 'getItem'> = localStorage) {
  removeLocal(PREFERENCES_KEY, storage);
}
