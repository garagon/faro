import { type Lang } from './i18n.ts';
/**
 * When a source was last checked: the time alone if it was today, otherwise with the date,
 * so data from yesterday never reads as current.
 */
export function checkedLabel(at: number, now: number, lang: Lang) {
  const sameDay = new Date(at).toDateString() === new Date(now).toDateString();
  return new Intl.DateTimeFormat(lang, {
    ...(sameDay ? {} : { day: 'numeric', month: 'short' }),
    hour: '2-digit',
    minute: '2-digit',
  }).format(at);
}

/**
 * For sentences: "las 21:01" today, "el 13 oct, 21:01" on other days. English and Portuguese get
 * no article: Portuguese contracts it with the preposition ("às", "desde as"), so its sentences
 * use "desde" or a colon before the time.
 */
export function atLabel(at: number, now: number, lang: Lang) {
  const sameDay = new Date(at).toDateString() === new Date(now).toDateString();
  const text = checkedLabel(at, now, lang);
  return lang === 'es' ? (sameDay ? `las ${text}` : `el ${text}`) : text;
}
