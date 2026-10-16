/**
 * Interface languages: Spanish, English and Brazilian Portuguese. Official texts keep the
 * language they were published in; the interface around them follows the person's choice.
 */
export type Lang = 'es' | 'en' | 'pt';
export const LANGS: readonly Lang[] = ['es', 'en', 'pt'];

/** Spanish, English and Portuguese text, in that order. */
export type Localized = [string, string, string];

/** Position of the language in a `Localized` tuple. */
export const langIndex = (lang: Lang): 0 | 1 | 2 => (lang === 'es' ? 0 : lang === 'en' ? 1 : 2);

/** The text for the interface language. */
export const pick = (lang: Lang, es: string, en: string, pt: string) =>
  lang === 'es' ? es : lang === 'en' ? en : pt;

/** BCP 47 tag for `<html lang>` and for the person's messages. */
export const langTag = (lang: Lang) => (lang === 'pt' ? 'pt-BR' : lang);

export const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (LANGS as readonly string[]).includes(value);
