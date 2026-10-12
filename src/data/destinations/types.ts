export type Localized = [string, string];
export type OfficialLink = { name: string; url: string; reviewedAt: string };
export type EmergencyDirectory = {
  source: string;
  agency: string;
  reviewedAt: string;
  numbers: { number: string; label: Localized }[];
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
  evacuation?: OfficialLink;
  region: {
    bounds: { south: number; north: number; west: number; east: number };
    view: { lat: number; lng: number; zoom: number };
    scope: Localized;
  };
  resources: DestinationResource[];
};
