import { countryOnLand } from './countryScope.ts';
import { countryCodes } from './regions.ts';

export type LocationFix = { lat: number; lng: number; accuracy: number; at: number };
export function recentLocation(fix: LocationFix | null, now: number) {
  return (
    !!fix &&
    Number.isFinite(fix.at) &&
    fix.at <= now &&
    now - fix.at <= 5 * 60_000 &&
    Number.isFinite(fix.accuracy) &&
    fix.accuracy >= 0 &&
    fix.accuracy <= 10_000
  );
}
/** Never use the browsed country or nationality as the person's current location. */
export function statusLocation(
  fix: LocationFix | null,
  savedDestination: string | undefined,
  now: number,
) {
  if (fix) {
    const country = recentLocation(fix, now) ? countryOnLand(fix) : null;
    return country ? { country, source: 'location' as const } : null;
  }
  return savedDestination && countryCodes.includes(savedDestination)
    ? { country: savedDestination, source: 'trip' as const }
    : null;
}
