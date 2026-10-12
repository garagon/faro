import type { Destination } from './types.ts';
export default {
  code: 'AR',
  emergency: {
    source: 'https://www.argentina.gob.ar/tema/emergencias',
    agency: 'Argentina.gob.ar',
    numbers: [
      {
        number: '911',
        label: ['Emergencias', 'Emergencies'],
      },
      {
        number: '100',
        label: ['Bomberos', 'Fire department'],
      },
      {
        number: '103',
        label: ['Defensa Civil', 'Civil defence'],
      },
    ],
    reviewedAt: '2026-10-11',
  },
  civilProtection: {
    name: 'SINAGIR',
    url: 'https://www.argentina.gob.ar/sinagir',
    reviewedAt: '2026-10-12',
  },
  seismicAgency: {
    name: 'INPRES',
    url: 'https://www.inpres.gob.ar/desktop/',
    reviewedAt: '2026-10-12',
  },
  region: {
    bounds: {
      south: -56,
      north: -21,
      west: -74,
      east: -52,
    },
    view: {
      lat: -38,
      lng: -64,
      zoom: 4,
    },
    scope: ['Argentina continental y alrededores', 'Mainland Argentina and surrounding area'],
  },
  resources: [],
} satisfies Destination;
