import type { Localized } from './destinations/types.ts';

export type FamilyLink = {
  id: string;
  /** "Agency · service", in each language. */
  name: Localized;
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
    description: [
      'Servicio gratuito del CICR y las Sociedades Nacionales para quienes perdieron contacto con familiares por un conflicto o desastre.',
      'Free ICRC service, with National Societies, for people who lost contact with family in a conflict or disaster.',
      'Serviço gratuito do CICV e das Sociedades Nacionais para quem perdeu contato com familiares por causa de um conflito ou desastre.',
    ],
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
      'Contacto y sitio web de la Cruz Roja o la Media Luna Roja de cada país. No confirma servicios disponibles.',
      'Contact details and website of the Red Cross or Red Crescent in each country. It does not confirm available services.',
      'Contato e site da Cruz Vermelha ou do Crescente Vermelho de cada país. Não confirma serviços disponíveis.',
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
      'Ayuda para localizar a seres queridos tras un desastre en EE. UU. y sus territorios, según sus criterios.',
      'Help locating loved ones after a disaster in the U.S. and its territories, subject to its criteria.',
      'Ajuda para localizar entes queridos após um desastre nos EUA e em seus territórios, conforme os critérios da organização.',
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
