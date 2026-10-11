import { writeLocal, removeLocal } from './browserStorage.ts';
export type Preferences = {
  version: 1;
  language: 'es' | 'en';
  destination: string;
  nationality: string;
  savedAt: number;
  name?: string;
  phone?: string;
  email?: string;
};
export const PREFERENCES_KEY = 'faro-preferences-v1';
export function validProfilePhone(phone: string) {
  const value = phone.trim();
  const digits = value.replace(/\D/g, '');
  return (
    value === '' ||
    (value.length <= 40 &&
      /^\+?[\d ().-]+$/.test(value) &&
      digits.length >= 7 &&
      digits.length <= 15)
  );
}
export function validProfileEmail(email: string) {
  const value = email.trim();
  return value === '' || (value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

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
    p.savedAt > now ||
    (p.name !== undefined &&
      (typeof p.name !== 'string' || p.name.length > 80 || /[\r\n]/.test(p.name))) ||
    (p.phone !== undefined &&
      (typeof p.phone !== 'string' || p.phone.length > 40 || !validProfilePhone(p.phone))) ||
    (p.email !== undefined &&
      (typeof p.email !== 'string' || p.email.length > 254 || !validProfileEmail(p.email)))
  )
    return null;
  // Copy only expected fields. Never restore GPS or arbitrary extra attributes.
  return {
    version: 1,
    language: p.language!,
    destination: p.destination!,
    nationality: p.nationality!,
    savedAt: p.savedAt,
    ...(p.name !== undefined ? { name: p.name.trim() } : {}),
    ...(p.phone !== undefined ? { phone: p.phone.trim() } : {}),
    ...(p.email !== undefined ? { email: p.email.trim() } : {}),
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
