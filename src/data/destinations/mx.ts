import type { Destination } from './types.ts';
export default {
  code: 'MX',
  emergency: {
    source:
      'https://www.gob.mx/911/articulos/servicio-de-atencion-de-llamadas-de-emergencias-9-1-1?idiom=es',
    agency: 'Gobierno de México · 911',
    numbers: [
      {
        number: '911',
        label: ['Emergencias', 'Emergencies', 'Emergências'],
      },
    ],
    reviewedAt: '2026-10-12',
  },
  civilProtection: {
    name: 'Coordinación Nacional de Protección Civil',
    url: 'https://www.gob.mx/sspc/acciones-y-programas/coordinacion-nacional-de-proteccion-civil-357857',
    reviewedAt: '2026-10-12',
  },
  weatherAgency: {
    name: 'SMN · CONAGUA',
    url: 'https://smn.conagua.gob.mx/es/',
    reviewedAt: '2026-10-13',
  },
  seismicAgency: {
    name: 'Servicio Sismológico Nacional · UNAM',
    url: 'https://www.ssn.unam.mx/sismicidad/ultimos/',
    reviewedAt: '2026-10-12',
  },
  region: {
    bounds: {
      south: 13,
      north: 34,
      west: -119,
      east: -86,
    },
    view: {
      lat: 23.5,
      lng: -102,
      zoom: 5,
    },
    scope: ['México y alrededores', 'Mexico and surrounding area', 'México e arredores'],
  },
  resources: [],
} satisfies Destination;
