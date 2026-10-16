import { destinationFor } from '../data/destinations/index.ts';
import { healthDirectories } from '../data/healthDirectories.ts';
import { familyLinksFor } from '../data/familyLinks.ts';
import { missionsFor } from '../data/consularMissions.ts';
import { resources } from './resources.ts';

/**
 * When Faro last checked by hand what Ayuda lists for a country (numbers, agencies, offices,
 * directories and links): the oldest and newest review dates, as YYYY-MM-DD. Shown on Fuentes, so
 * the rows themselves carry no dates of Faro's own review. Null when nothing is listed.
 */
export function helpReviewRange(country: string): { from: string; to: string } | null {
  const d = destinationFor(country);
  const dates = [
    d?.emergency?.reviewedAt,
    d?.civilProtection?.reviewedAt,
    d?.weatherAgency?.reviewedAt,
    d?.seismicAgency?.reviewedAt,
    d?.evacuation?.reviewedAt,
    ...(healthDirectories[country] ?? []).map((link) => link.reviewedAt),
    ...familyLinksFor(country).map((link) => link.reviewedAt),
    ...missionsFor(country).map((mission) => mission.reviewedAt),
    ...resources.filter((r) => r.country === country || r.country === '*').map((r) => r.reviewedAt),
  ]
    .filter((date): date is string => !!date && /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return dates.length ? { from: dates[0], to: dates[dates.length - 1] } : null;
}
