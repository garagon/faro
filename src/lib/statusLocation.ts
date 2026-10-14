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
/**
 * Never use the browsed country or nationality as the person's current location.
 * `countryAt` is the land-border lookup (loaded after start); without it, a fix gives no country.
 */
export function statusLocation(
  fix: LocationFix | null,
  savedDestination: string | undefined,
  now: number,
  countryAt?: (point: { lat: number; lng: number }) => string | null,
) {
  if (fix) {
    const country = recentLocation(fix, now) && countryAt ? countryAt(fix) : null;
    return country ? { country, source: 'location' as const } : null;
  }
  return savedDestination && countryCodes.includes(savedDestination)
    ? { country: savedDestination, source: 'trip' as const }
    : null;
}
