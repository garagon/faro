import type { Localized } from '../../lib/i18n.ts';
export type { Localized };
export type OfficialLink = { name: string; url: string; reviewedAt: string };
export type EmergencyDirectory = {
  source: string;
  agency: string;
  reviewedAt: string;
  /** The first number is the main emergency line; the rest are backups, each with its own source. */
  numbers: { number: string; label: Localized; source?: string }[];
  /** A text line the agency publishes for any phone; it opens WhatsApp only when tapped. */
  whatsapp?: { number: string; label: Localized; source: string };
  note?: Localized;
};
export type DestinationResource = {
  name: string;
  category: Localized;
  description: Localized;
  url: string;
  reviewedAt: string;
};
export type Destination = {
  code: string;
  emergency?: EmergencyDirectory;
  civilProtection?: OfficialLink;
  seismicAgency?: OfficialLink;
  /** National meteorological service page for current weather warnings (cyclones, rain, floods). */
  weatherAgency?: OfficialLink;
  evacuation?: OfficialLink;
  /**
   * Who reports services Faro has no official feed for (water, power, roads, health). A link
   * appears only where the address was checked; the name alone is still useful.
   */
  services?: { topic: Localized; agencies: { name: string; url?: string }[] }[];
  servicesReviewedAt?: string;
  region: {
    bounds: { south: number; north: number; west: number; east: number };
    view: { lat: number; lng: number; zoom: number };
    scope: Localized;
  };
  resources: DestinationResource[];
};
