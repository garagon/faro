import { destinationFor } from '../data/destinations/index.ts';
export type { EmergencyDirectory } from '../data/destinations/types.ts';
export type EmergencyNumber = { number: string; label: [string, string] };
export function emergencyFor(country: string) {
  return destinationFor(country)?.emergency;
}
