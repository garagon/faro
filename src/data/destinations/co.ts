import type { Destination } from './types.ts';
export default {
  code: 'CO',
  emergency: {
    source:
      'https://www.policia.gov.co/index.php/noticia/policia-nacional-sensibiliza-comunidad-sobre-uso-las-lineas-emergencia-123-155',
    agency: 'Policía Nacional de Colombia',
    numbers: [
      {
        number: '123',
        label: ['Emergencias', 'Emergencies', 'Emergências'],
      },
    ],
    reviewedAt: '2026-10-11',
  },
  civilProtection: {
    name: 'UNGRD',
    url: 'https://portal.gestiondelriesgo.gov.co/',
    reviewedAt: '2026-10-12',
  },
  weatherAgency: {
    name: 'IDEAM',
    url: 'https://www.ideam.gov.co/nuestra-entidad/servicio-de-pronosticos-y-alertas',
    reviewedAt: '2026-10-13',
  },
  seismicAgency: {
    name: 'Servicio Geológico Colombiano',
    url: 'https://www.sgc.gov.co/sismos',
    reviewedAt: '2026-10-12',
  },
  region: {
    bounds: {
      south: -5,
      north: 14,
      west: -83,
      east: -66,
    },
    view: {
      lat: 4.5,
      lng: -74,
      zoom: 5,
    },
    scope: ['Colombia y alrededores', 'Colombia and surrounding area', 'Colômbia e arredores'],
  },
  resources: [],
} satisfies Destination;
