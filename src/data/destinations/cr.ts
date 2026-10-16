import type { Destination } from './types.ts';
export default {
  code: 'CR',
  emergency: {
    source: 'https://www.911.go.cr/',
    agency: 'Sistema de Emergencias 9-1-1',
    numbers: [
      {
        number: '911',
        label: ['Emergencias', 'Emergencies', 'Emergências'],
      },
    ],
    reviewedAt: '2026-10-14',
  },
  civilProtection: {
    name: 'Comisión Nacional de Emergencias',
    url: 'https://www.cne.go.cr/',
    reviewedAt: '2026-10-12',
  },
  weatherAgency: {
    name: 'IMN',
    url: 'https://www.imn.ac.cr/web/imn/avisos-meteorologicos',
    reviewedAt: '2026-10-13',
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
    scope: [
      'Costa Rica y alrededores',
      'Costa Rica and surrounding area',
      'Costa Rica e arredores',
    ],
  },
  resources: [],
} satisfies Destination;
