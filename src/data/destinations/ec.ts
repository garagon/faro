import type { Destination } from './types.ts';
export default {
  code: 'EC',
  emergency: {
    source: 'https://www.ecu911.gob.ec/gestion-de-la-atencion-de-emergencias/',
    agency: 'ECU 911',
    numbers: [
      {
        number: '911',
        label: ['Emergencias · ECU 911', 'Emergencies · ECU 911'],
      },
    ],
    reviewedAt: '2026-10-12',
  },
  civilProtection: {
    name: 'Secretaría Nacional de Gestión de Riesgos',
    url: 'https://www.gestionderiesgos.gob.ec/',
    reviewedAt: '2026-10-12',
  },
  seismicAgency: {
    name: 'Instituto Geofísico · Escuela Politécnica Nacional',
    url: 'https://www2.igepn.edu.ec/mapa-ultimos-sismos',
    reviewedAt: '2026-10-12',
  },
  region: {
    bounds: {
      south: -6,
      north: 3,
      west: -93,
      east: -74,
    },
    view: {
      lat: -1.5,
      lng: -82,
      zoom: 5,
    },
    scope: ['Ecuador, Galápagos y alrededores', 'Ecuador, Galapagos and surrounding area'],
  },
  resources: [],
} satisfies Destination;
