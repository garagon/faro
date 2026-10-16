import countries from '../data/countries.json';
import { countryAliases, isExactAlias } from './countryAliases.ts';
import { langTag, pick, type Lang } from './i18n.ts';

export type CountryOption = { code: string; name: string; search: string };

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/**
 * Every country with its name in the interface language. Spanish, English and Portuguese names,
 * the ISO code and everyday aliases always match, whatever the interface language.
 */
export function countryOptions(lang: Lang, includeWorld = false): CountryOption[] {
  const local = new Intl.DisplayNames([langTag(lang)], { type: 'region' }),
    english = new Intl.DisplayNames(['en'], { type: 'region' }),
    portuguese = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
  const list = countries
    .map((c) => ({
      code: c.code,
      name: local.of(c.code) || c.name,
      search: normalize(
        `${c.name} ${english.of(c.code)} ${portuguese.of(c.code)} ${local.of(c.code)} ${c.code} ${countryAliases[c.code] ?? ''}`,
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, langTag(lang)));
  return includeWorld
    ? [
        {
          code: 'WORLD',
          name: pick(lang, 'Todo el mundo', 'Worldwide', 'Mundo inteiro'),
          search: 'todo el mundo worldwide global world mundo inteiro todo o mundo',
        },
        ...list,
      ]
    : list;
}

/** Options containing every typed word; an exact code or alias first, else the current one. */
export function matchCountries(options: CountryOption[], query: string | null, current?: string) {
  const search = normalize(query ?? '');
  return options
    .filter((c) => search.split(/\s+/).every((word) => c.search.includes(word)))
    .sort((a, b) =>
      query === null
        ? Number(b.code === current) - Number(a.code === current)
        : Number(b.code.toLowerCase() === search || isExactAlias(b.code, search)) -
          Number(a.code.toLowerCase() === search || isExactAlias(a.code, search)),
    );
}
