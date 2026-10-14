/**
 * Everyday names and abbreviations people type for their country, beyond the official ES/EN/PT
 * names and the ISO code. Lowercase, without accents; one string of words per country.
 */
export const countryAliases: Record<string, string> = {
  US: 'usa eeuu ee uu eua estados unidos de america estados unidos da america united states of america america',
  GB: 'uk gb inglaterra england gran bretana gra bretanha great britain britain escocia scotland gales pais de gales wales reino unido',
  NL: 'holanda holland paises bajos paises baixos',
  KR: 'corea del sur south korea corea coreia do sul coreia',
  KP: 'corea del norte north korea',
  AE: 'uae emiratos arabes emirados arabes dubai',
  RU: 'rusia russia',
  CN: 'china prc',
  TW: 'taiwan',
  CZ: 'chequia czechia republica checa czech republic tchequia republica tcheca',
  DE: 'alemania germany deutschland alemanha',
  CH: 'suiza switzerland schweiz suica',
  BR: 'brasil brazil',
  AR: 'argentina',
  MX: 'mexico',
  DO: 'republica dominicana dominicana rd',
  CR: 'costa rica tica',
  CA: 'canada',
  ES: 'espana spain espanha',
  IT: 'italia italy',
  FR: 'francia france franca',
  PT: 'portugal',
  CO: 'colombia',
  VE: 'venezuela',
};

/** True when the query is exactly one of the country's aliases (used to rank it first). */
export function isExactAlias(code: string, query: string) {
  const words = countryAliases[code];
  if (!words || !query) return false;
  return words.split(/\s+/).includes(query) || ` ${words} `.includes(` ${query} `);
}
