import type { Localized } from './destinations/types.ts';

export type FamilyLink = {
  id: string;
  /** "Agency · service", in each language. */
  name: Localized;
  /** One caption line before the site's name: what the service does, in a few words. */
  description: Localized;
  url: Localized;
  reviewedAt: string;
  /** Destinations where the service applies; omitted means worldwide. */
  countries?: readonly string[];
};

// Official services to restore contact after a disaster. Faro never submits searches or data.
export const familyLinks: readonly FamilyLink[] = [
  {
    id: 'icrc-rfl',
    name: [
      'CICR · Restablecimiento del Contacto entre Familiares',
      'ICRC · Restoring Family Links',
      'CICV · Restabelecimento de Laços Familiares',
    ],
    description: ['Busca a familiares', 'Find family members', 'Busque familiares'],
    // The service site has no Portuguese version; the ICRC's Portuguese page explains it and
    // links to its Central Tracing Agency and online tracing.
    url: [
      'https://familylinks.icrc.org/es',
      'https://familylinks.icrc.org/',
      'https://www.icrc.org/pt/acoes/restabelecimento-dos-lacos-familiares',
    ],
    reviewedAt: '2026-10-14',
  },
  {
    id: 'ifrc-directory',
    name: [
      'IFRC · Directorio de Sociedades Nacionales',
      'IFRC · National Societies directory',
      'IFRC · Diretório das Sociedades Nacionais',
    ],
    description: [
      'Cruz Roja de cada país',
      'Red Cross in each country',
      'Cruz Vermelha de cada país',
    ],
    url: [
      'https://www.ifrc.org/national-societies-directory',
      'https://www.ifrc.org/national-societies-directory',
      'https://www.ifrc.org/national-societies-directory',
    ],
    reviewedAt: '2026-10-13',
  },
  {
    id: 'redcross-us',
    name: [
      'Cruz Roja Americana · Contactar y localizar a seres queridos',
      'American Red Cross · Contact and locate loved ones',
      'Cruz Vermelha Americana · Contatar e localizar entes queridos',
    ],
    description: [
      'Tras un desastre en EE.\u00a0UU.',
      'After a disaster in the U.S.',
      'Após um desastre nos EUA',
    ],
    url: [
      'https://www.redcross.org/get-help/disaster-relief-and-recovery-services/contact-and-locate-loved-ones.html',
      'https://www.redcross.org/get-help/disaster-relief-and-recovery-services/contact-and-locate-loved-ones.html',
      'https://www.redcross.org/get-help/disaster-relief-and-recovery-services/contact-and-locate-loved-ones.html',
    ],
    reviewedAt: '2026-10-13',
    countries: ['US', 'PR', 'VI', 'GU', 'AS', 'MP'],
  },
];

export function familyLinksFor(country: string) {
  return familyLinks.filter((l) => !l.countries || l.countries.includes(country));
}
