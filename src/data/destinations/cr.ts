import type { Destination } from './types.ts';
export default {
  code: 'CR',
  emergency: {
    source:
      'https://diccionariousual.poder-judicial.go.cr/index.php/diccionario/sistema-de-emergencias-9-1-1',
    agency: 'Poder Judicial de Costa Rica',
    numbers: [
      {
        number: '911',
        label: ['Emergencias', 'Emergencies'],
      },
    ],
    reviewedAt: '2026-10-12',
  },
  civilProtection: {
    name: 'Comisión Nacional de Emergencias',
    url: 'https://www.cne.go.cr/',
    reviewedAt: '2026-10-12',
  },
  seismicAgency: {
    name: 'Red Sismológica Nacional · Universidad de Costa Rica',
    url: 'https://rsn.ucr.ac.cr/',
    reviewedAt: '2026-10-12',
  },
  region: {
    bounds: {
      south: 5,
      north: 12,
      west: -88,
      east: -82,
    },
    view: {
      lat: 9.5,
      lng: -84,
      zoom: 6,
    },
    scope: ['Costa Rica y alrededores', 'Costa Rica and surrounding area'],
  },
  resources: [],
} satisfies Destination;
