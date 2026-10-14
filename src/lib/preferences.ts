import { writeLocal, removeLocal } from './browserStorage.ts';
import { isLang, type Lang } from './i18n.ts';
export type Preferences = {
  version: 1;
  language: Lang;
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
    !isLang(p.language) ||
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
  // Every field but the destination is optional: a traveler may save a name before a nationality.
  const valid = parsePreferences(value, codes);
  if (!valid) throw Error('Invalid profile');
  writeLocal(PREFERENCES_KEY, JSON.stringify(valid), storage);
  return valid;
}
export function forgetPreferences(storage: Pick<Storage, 'removeItem' | 'getItem'> = localStorage) {
  removeLocal(PREFERENCES_KEY, storage);
}

/**
 * Saved choice first, then the profile, then the browser language: Spanish and Portuguese
 * browsers get their language, any other gets English.
 */
export function readSiteLanguage(
  profileLanguage?: Lang,
  storage?: Pick<Storage, 'getItem'>,
  browserLanguages: readonly string[] = typeof navigator === 'undefined'
    ? []
    : navigator.languages?.length
      ? navigator.languages
      : [navigator.language],
): Lang {
  try {
    const saved = (storage ?? localStorage).getItem('faro-lang');
    if (isLang(saved)) return saved;
  } catch {
    /* The site still works when browser storage is unavailable. */
  }
  if (profileLanguage) return profileLanguage;
  const first = browserLanguages.find(Boolean)?.toLowerCase() ?? '';
  return first.startsWith('es') ? 'es' : first.startsWith('pt') ? 'pt' : 'en';
}
