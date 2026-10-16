import type { Localized } from '../lib/i18n.ts';
// Directories by citizenship, distinct from missions physically located in a destination.
// These links do not assert that a mission exists at a particular address.
export const consularDirectories: Record<
  string,
  { url: string; label: Localized; reviewedAt: string }
> = {
  AR: {
    url: 'https://cancilleria.gob.ar/es/emergencia-consular',
    label: [
      'Celulares de guardia de embajadas y consulados argentinos',
      'On-call phones of Argentine embassies and consulates',
      'Celulares de plantão das embaixadas e consulados argentinos',
    ],
    reviewedAt: '2026-10-13',
  },
  BR: {
    url: 'https://www.gov.br/mre/pt-br/assuntos/portal-consular/reparticoes-consulares-do-brasil/reparticoes-consulares-do-brasil',
    label: [
      'Embajadas y consulados de Brasil',
      'Brazilian embassies and consulates',
      'Embaixadas e consulados do Brasil',
    ],
    reviewedAt: '2026-10-13',
  },
  CL: {
    url: 'https://www.chile.gob.cl/consulados',
    label: ['Consulados de Chile', 'Chilean consulates', 'Consulados do Chile'],
    reviewedAt: '2026-10-12',
  },
  CO: {
    url: 'https://www.cancilleria.gov.co/directorio-institucional',
    label: [
      'Directorio consular de Colombia',
      'Colombia consular directory',
      'Diretório consular da Colômbia',
    ],
    reviewedAt: '2026-10-12',
  },
  MX: {
    url: 'https://portales.sre.gob.mx/directorio/buscar',
    label: [
      'Embajadas y consulados de México',
      'Mexican embassies and consulates',
      'Embaixadas e consulados do México',
    ],
    reviewedAt: '2026-10-12',
  },
  ES: {
    url: 'https://exteriores.gob.es/es/EmbajadasConsulados/Paginas/index.aspx',
    label: [
      'Embajadas y consulados de España',
      'Spanish embassies and consulates',
      'Embaixadas e consulados da Espanha',
    ],
    reviewedAt: '2026-10-12',
  },
  US: {
    url: 'https://www.usembassy.gov/',
    label: [
      'Embajadas y consulados de Estados Unidos',
      'U.S. embassies and consulates',
      'Embaixadas e consulados dos Estados Unidos',
    ],
    reviewedAt: '2026-10-12',
  },
};
