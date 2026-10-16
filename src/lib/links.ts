import { type Lang } from './i18n.ts';
/** Hostname shown next to an external link, so people see which site opens before tapping. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Splits catalog names written as "Agency · What it is" into the two parts shown in a row. */
export function splitName(name: string): [string, string] {
  const at = name.indexOf(' · ');
  return at === -1 ? [name, ''] : [name.slice(0, at), name.slice(at + 3)];
}

/** Review dates are stored as YYYY-MM-DD or YYYY-MM; shown as "13 oct 2026" or "octubre de 2024". */
export function reviewDate(value: string, lang: Lang): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value))
    return new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date(value + 'T12:00:00Z'),
    );
  if (/^\d{4}-\d{2}$/.test(value))
    return new Intl.DateTimeFormat(lang, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(value + '-15T12:00:00Z'));
  return value;
}
