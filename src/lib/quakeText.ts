import { countryCodes } from './regions.ts';
import { displayPlace, type Quake } from './domain.ts';
import { pick, type Lang } from './i18n.ts';
import { checkedLabel } from './time.ts';

/*
 * How an earthquake is written everywhere it appears (the earthquake list, "Latest earthquakes",
 * "Latest earthquake" on Emergencia and the earthquake sheet): one time format and one place name.
 * Faro has no gazetteer: a place is only the region the catalogue published, translated when it
 * is one of the known patterns, never a distance to a town the catalogue did not give.
 */

const HOUR = 3600000;
// Numbers and their units never break ("26 min", "16 oct").
const keep = (text: string) => text.replace(/(\d) /g, '$1 ');

/** How long ago, in one wording: "hace 26 min", "hace 3 h", "hace 2 días". */
export function quakeAge(time: number, now: number, lang: Lang) {
  const minutes = Math.floor(Math.max(0, now - time) / 60000);
  if (minutes < 1) return pick(lang, 'hace menos de 1 min', 'under 1 min ago', 'há menos de 1 min');
  if (minutes < 60)
    return keep(pick(lang, `hace ${minutes} min`, `${minutes} min ago`, `há ${minutes} min`));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return keep(pick(lang, `hace ${hours} h`, `${hours} h ago`, `há ${hours} h`));
  const days = Math.floor(hours / 24);
  return keep(
    days === 1
      ? pick(lang, 'hace 1 día', '1 day ago', 'há 1 dia')
      : pick(lang, `hace ${days} días`, `${days} days ago`, `há ${days} dias`),
  );
}

/** The clock time of the earthquake: alone if it was the same day, otherwise with the date. */
function clock(time: number, now: number, lang: Lang, zone: 'local' | 'utc') {
  if (zone === 'local') return checkedLabel(time, now, lang);
  const day = (n: number) => new Date(n).toISOString().slice(0, 10);
  return `${new Intl.DateTimeFormat(lang, {
    ...(day(time) === day(now) ? {} : { day: 'numeric', month: 'short' }),
    hour: lang === 'en' ? 'numeric' : '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(time)} UTC`;
}

/**
 * When an earthquake happened, the same everywhere: the clock time and, within a day, how long
 * ago ("07:03 · hace 26 min"); older ones by date and time ("14 oct, 21:01"). `utc` is for the
 * list's time-zone filter.
 */
export function quakeTime(time: number, now: number, lang: Lang, zone: 'local' | 'utc' = 'local') {
  const at = clock(time, now, lang, zone);
  return keep(now - time < 24 * HOUR ? `${at} · ${quakeAge(time, now, lang)}` : at);
}

/** The full date and time, for a tooltip or an accessible name. */
export function quakeDate(time: number, lang: Lang, zone: 'local' | 'utc' = 'local') {
  const text = new Intl.DateTimeFormat(lang, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(zone === 'utc' ? { timeZone: 'UTC' } : {}),
  }).format(time);
  return zone === 'utc' ? `${text} UTC` : text;
}

// Portuguese: the preposition "em" with the country's article ("no Panamá", "na Colômbia", "em
// Honduras"). "de" contracts the same way ("do Panamá"). A country not listed keeps a neutral form.
const PT_IN: Record<string, 'no' | 'na' | 'nos' | 'nas' | 'em'> = Object.fromEntries(
  Object.entries({
    no: 'PA MX PE EC CL BR PY UY CA JP IR AF KG NP PK VN',
    na: 'AR CO CR GT NI VE BO DO JM ID GR TR IT CN IN NZ PG RU AL RO FR PL ZA ES',
    nos: 'US',
    nas: 'PH',
    em: 'HN SV CU PR PT TW CY TO VU FJ MM HT',
  }).flatMap(([prep, codes]) => codes.split(' ').map((code) => [code, prep])),
) as Record<string, 'no' | 'na' | 'nos' | 'nas' | 'em'>;
const PT_OF = { no: 'do', na: 'da', nos: 'dos', nas: 'das', em: 'de' } as const;
const PT_WITH = { no: 'o ', na: 'a ', nos: 'os ', nas: 'as ', em: '' } as const;
// Spanish keeps the article for a few names ("al sur de la República Dominicana").
const ES_ARTICLE: Record<string, string> = { DO: 'la ' };

/** A title with its place: "51 sismos en Panamá", "51 terremotos no Panamá". */
export function withPlace(text: string, code: string, name: string, lang: Lang) {
  const pt = PT_IN[code];
  return pick(
    lang,
    `${text} en ${name}`,
    `${text} in ${name}`,
    pt ? `${text} ${pt} ${name}` : `${text} · ${name}`,
  );
}

type Area = {
  code?: string;
  /** The name on its own, and after "of" ("de Panamá", "do Panamá", "del mar Caribe"). */
  names: Record<Lang, string>;
  of: Record<Lang, string>;
};

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

// Names catalogues use that differ from the standard English name.
const ALIASES: Record<string, string> = {
  turkey: 'TR',
  myanmar: 'MM',
  burma: 'MM',
  'czech republic': 'CZ',
  macedonia: 'MK',
  'ivory coast': 'CI',
  'n.z.': 'NZ',
  'p.n.g.': 'PG',
  'east timor': 'TL',
  usa: 'US',
};
// Seas and areas that are not countries but appear in the regions around the launch countries.
const AREAS: Record<string, Area> = {
  'central america': {
    names: { es: 'Centroamérica', en: 'Central America', pt: 'América Central' },
    of: { es: 'de Centroamérica', en: 'of Central America', pt: 'da América Central' },
  },
  'caribbean sea': {
    names: { es: 'Mar Caribe', en: 'Caribbean Sea', pt: 'Mar do Caribe' },
    of: { es: 'del mar Caribe', en: 'of the Caribbean Sea', pt: 'do mar do Caribe' },
  },
};
const displayNames: Partial<Record<Lang, Intl.DisplayNames>> = {};
// "Myanmar (Burma)" reads "Myanmar".
const regionName = (code: string, lang: Lang) =>
  (
    (displayNames[lang] ??= new Intl.DisplayNames([lang], { type: 'region' })).of(code) ?? code
  ).replace(/\s*\(.*\)$/, '');
let byName: Map<string, string> | null = null;
function codeFor(name: string) {
  if (!byName) {
    byName = new Map(Object.entries(ALIASES));
    for (const code of countryCodes) {
      const english = regionName(code, 'en');
      if (english !== code) byName.set(fold(english), code);
    }
  }
  return byName.get(fold(name));
}
function area(text: string): Area | undefined {
  const known = AREAS[fold(text)];
  if (known) return known;
  const code = codeFor(text);
  if (!code) return undefined;
  const names = {
    es: regionName(code, 'es'),
    en: regionName(code, 'en'),
    pt: regionName(code, 'pt'),
  };
  return {
    code,
    names,
    of: {
      es: `de ${ES_ARTICLE[code] ?? ''}${names.es}`,
      en: `of ${names.en}`,
      pt: `${PT_OF[PT_IN[code] ?? 'em']} ${names.pt}`,
    },
  };
}
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type Side = 'north' | 'south' | 'east' | 'west';
const SIDES: Record<string, Side> = {
  north: 'north',
  n: 'north',
  south: 'south',
  s: 'south',
  east: 'east',
  e: 'east',
  west: 'west',
  w: 'west',
};
const sideWord = (side: Side, lang: Lang) =>
  ({
    north: pick(lang, 'norte', 'north', 'norte'),
    south: pick(lang, 'sur', 'south', 'sul'),
    east: pick(lang, 'este', 'east', 'leste'),
    west: pick(lang, 'oeste', 'west', 'oeste'),
  })[side];
// Words that make a "Place, Country" name English text rather than a proper name.
const ENGLISH =
  /\b(region|northern|southern|eastern|western|central|offshore|off|near|coast|of|islands?|isl|is|sea|gulf|peninsula|border|ridge|rise|strait|bay|north|south|east|west|the|and)\b/i;

/** A published region as text in `lang`, or null when Faro does not know its pattern. */
function translate(text: string, lang: Lang, home?: string): string | null {
  let m: RegExpMatchArray | null;
  // USGS: "42 km SSW of David, Panama". The distance is the agency's, with its unit.
  if ((m = text.match(/^(\d+(?:\.\d+)?) ?km ([NSEW]{1,3}) of (.+)$/i))) {
    const dir = m[2].toUpperCase();
    const rest = translate(m[3], lang, home) || translate(m[3], lang) || m[3];
    const local = dir.replace(/W/g, 'O');
    return keep(
      pick(
        lang,
        `${m[1]} km al ${local} de ${rest}`,
        `${m[1]} km ${dir} of ${rest}`,
        `${m[1]} km a ${local} de ${rest}`,
      ),
    );
  }
  const whole = area(text);
  if (whole) return home && whole.code === home ? '' : whole.names[lang];
  // "South of Panama"
  if ((m = text.match(/^(north|south|east|west) of (?:the )?(.+)$/i))) {
    const a = area(m[2]);
    if (!a) return null;
    const side = SIDES[m[1].toLowerCase()];
    return pick(
      lang,
      `Al ${sideWord(side, lang)} ${a.of[lang]}`,
      `${capital(side)} ${a.of[lang]}`,
      `${side === 'east' || side === 'west' ? 'A' : 'Ao'} ${sideWord(side, lang)} ${a.of[lang]}`,
    );
  }
  // "Northern Colombia", "Central Peru"
  if ((m = text.match(/^(northern|southern|eastern|western|central) (.+)$/i))) {
    const a = area(m[2]);
    if (!a) return null;
    const part = m[1].toLowerCase();
    if (lang === 'en') return `${capital(part)} ${a.names.en}`;
    const word =
      part === 'central'
        ? pick(lang, 'centro', 'central', 'centro')
        : sideWord(part.replace(/ern$/, '') as Side, lang);
    return `${capital(word)} ${a.of[lang]}`;
  }
  // "Near Coast Of Nicaragua", "Off West Coast Of Colombia", "Offshore El Salvador"
  const coast = text.match(
    /^(near|off)(?: the)?(?: (north|south|east|west|[nsew])\.?)? coast of (?:the )?(.+)$/i,
  );
  const offshore = text.match(/^offshore (.+)$/i);
  if (coast || offshore) {
    const how = coast ? coast[1].toLowerCase() : 'off';
    const sideName = coast?.[2];
    const target = coast ? coast[3] : offshore![1];
    const side = sideName ? SIDES[sideName.toLowerCase()] : undefined;
    const shore = side
      ? pick(
          lang,
          `costa ${sideWord(side, lang)}`,
          `${sideWord(side, lang)} coast`,
          `costa ${sideWord(side, lang)}`,
        )
      : pick(lang, 'costa', 'coast', 'costa');
    const lead =
      how === 'near'
        ? pick(lang, `Cerca de la ${shore}`, `Near the ${shore}`, `Perto da ${shore}`)
        : pick(lang, `Frente a la ${shore}`, `Off the ${shore}`, `Ao largo da ${shore}`);
    const a = area(target);
    if (a) return `${lead} ${a.of[lang]}`;
    // "Offshore Chiapas, Mexico": a named place on a known country's coast.
    const within = target.match(/^(.+), ([^,]+)$/);
    const country = within && !ENGLISH.test(within[1]) ? area(within[2]) : undefined;
    if (!within || !country) return null;
    return `${lead} ${pick(lang, 'de', 'of', 'de')} ${within[1]}, ${country.names[lang]}`;
  }
  // "Panama-Costa Rica Border Region"
  if ((m = text.match(/^(.+) border region$/i))) {
    const name = m[1];
    for (let i = name.indexOf('-'); i > 0; i = name.indexOf('-', i + 1)) {
      const a = area(name.slice(0, i)),
        b = area(name.slice(i + 1));
      if (a && b) {
        // Inside one of the two countries, the other one: "Frontera con Costa Rica".
        const other = home && a.code === home ? b : home && b.code === home ? a : undefined;
        if (other)
          return pick(
            lang,
            `Frontera con ${(other.code && ES_ARTICLE[other.code]) ?? ''}${other.names.es}`,
            `${other.names.en} border`,
            `Fronteira com ${other.code ? PT_WITH[PT_IN[other.code] ?? 'em'] : ''}${other.names.pt}`,
          );
        const pair = `${a.names[lang]}–${b.names[lang]}`;
        return pick(lang, `Frontera ${pair}`, `${pair} border region`, `Fronteira ${pair}`);
      }
    }
    return null;
  }
  // "Puerto Rico Region"
  if ((m = text.match(/^(.+) region$/i))) {
    const a = area(m[1]);
    if (!a) return null;
    return pick(lang, `Región ${a.of[lang]}`, `${a.names.en} region`, `Região ${a.of[lang]}`);
  }
  // "Antofagasta, Chile": the place stays as published, the country is translated. Inside the
  // country being viewed, the place alone.
  if ((m = text.match(/^(.+), ([^,]+)$/)) && !ENGLISH.test(m[1])) {
    const a = area(m[2]);
    if (!a) return null;
    return home && a.code === home ? m[1] : `${m[1]}, ${a.names[lang]}`;
  }
  return null;
}

export type QuakeRegion = {
  text: string;
  /** The language the text is written in, for the `lang` attribute when it is not the reader's. */
  lang: Lang;
};

/**
 * The region an earthquake's catalogue published, in the reader's language when Faro knows the
 * pattern ("PANAMA" and "Panama" read "Panamá"; "South Of Panama", "Al sur de Panamá").
 * Otherwise the published text, with its language. With `home` (the country on screen), a
 * region that is just that country returns null: the list title names it once.
 */
export function quakeRegion(
  q: Pick<Quake, 'place' | 'source'>,
  lang: Lang,
  home?: string,
): QuakeRegion | null {
  const text = displayPlace(q.place);
  if (!text) return null;
  // IGC publishes in Spanish ("31 km al Sur de Punta Burica, Chiriquí"): kept as published.
  if (q.source === 'IGC') return { text, lang: 'es' };
  const local = translate(text, lang, home);
  if (local === '') return null;
  return local === null ? { text, lang: 'en' } : { text: local, lang };
}
