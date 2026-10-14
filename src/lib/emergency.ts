import { destinationFor } from '../data/destinations/index.ts';
import type { Localized } from './i18n.ts';
export type { EmergencyDirectory } from '../data/destinations/types.ts';
export type EmergencyNumber = { number: string; label: Localized };
// Puerto Rico, the US Virgin Islands, Guam, American Samoa and the Northern Mariana Islands
// answer 911 like the states.
const usTerritories = new Set(['PR', 'VI', 'GU', 'AS', 'MP']);
export function emergencyFor(country: string) {
  return destinationFor(usTerritories.has(country) ? 'US' : country)?.emergency;
}
