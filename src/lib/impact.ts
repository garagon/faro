import type { UsgsImpact } from './domain.ts';
import { langIndex, type Lang, type Localized } from './i18n.ts';

type Level = NonNullable<UsgsImpact['alert']>;
const pager: Record<Level, Localized> = {
  green: ['Verde', 'Green', 'Verde'],
  yellow: ['Amarilla', 'Yellow', 'Amarelo'],
  orange: ['Naranja', 'Orange', 'Laranja'],
  red: ['Roja', 'Red', 'Vermelho'],
};
export function pagerLabel(level: Level, lang: Lang) {
  return pager[level][langIndex(lang)];
}

// Perceived shaking words from the USGS ShakeMap / DYFI intensity legend.
const shaking: Localized[] = [
  ['No sentido', 'Not felt', 'Não sentido'],
  ['Débil', 'Weak', 'Fraco'],
  ['Débil', 'Weak', 'Fraco'],
  ['Leve', 'Light', 'Leve'],
  ['Moderado', 'Moderate', 'Moderado'],
  ['Fuerte', 'Strong', 'Forte'],
  ['Muy fuerte', 'Very strong', 'Muito forte'],
  ['Severo', 'Severe', 'Severo'],
  ['Violento', 'Violent', 'Violento'],
  ['Extremo', 'Extreme', 'Extremo'],
];
const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
/** Modified Mercalli value as published, rounded for its Roman numeral, e.g. "VI · Strong". */
export function intensityLabel(value: number, lang: Lang) {
  const level = Math.min(12, Math.max(1, Math.round(value)));
  const words = shaking[Math.min(level, 10) - 1][langIndex(lang)];
  return `${roman[level - 1]} · ${words}`;
}

/** EMSC "I felt it" form for an event page; null when the page is not an EMSC event page. */
export function emscFeltLink(url: string) {
  try {
    const u = new URL(url);
    const id = u.searchParams.get('id');
    if (
      u.protocol !== 'https:' ||
      u.hostname !== 'www.emsc-csem.org' ||
      u.pathname !== '/Earthquake_information/earthquake.php' ||
      !id ||
      !/^\d{1,12}$/.test(id)
    )
      return null;
    return `https://www.emsc-csem.org/Earthquake_information/post/?id=${id}`;
  } catch {
    return null;
  }
}

/** Section of a USGS event page. Only an earthquake.usgs.gov event page is extended. */
export function usgsEventLink(url: string, section: 'shakemap' | 'pager' | 'dyfi' | 'tellus') {
  try {
    const u = new URL(url);
    if (
      u.protocol !== 'https:' ||
      u.hostname !== 'earthquake.usgs.gov' ||
      !/^\/earthquakes\/eventpage\/[\w-]+\/?$/.test(u.pathname)
    )
      return null;
    return `${u.origin}${u.pathname.replace(/\/$/, '')}/${section}`;
  } catch {
    return null;
  }
}
