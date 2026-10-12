import type { Destination } from './types.ts';
export default {
  code: 'CL',
  emergency: {
    source: 'https://www.consulado.gob.cl/emergencias-en-chile',
    agency: 'Ministerio de Relaciones Exteriores de Chile',
    numbers: [
      {
        number: '131',
        label: ['Ambulancia', 'Ambulance'],
      },
      {
        number: '132',
        label: ['Bomberos', 'Fire department'],
      },
      {
        number: '133',
        label: ['Carabineros', 'Police'],
      },
    ],
    reviewedAt: '2026-10-11',
  },
  civilProtection: {
    name: 'SENAPRED',
    url: 'https://www.senapred.gov.cl/',
    reviewedAt: '2026-10-12',
  },
  seismicAgency: {
    name: 'Centro Sismológico Nacional · Universidad de Chile',
    url: 'https://www.sismologia.cl/',
    reviewedAt: '2026-10-12',
  },
  region: {
    bounds: {
      south: -57,
      north: -16,
      west: -77,
      east: -65,
    },
    view: {
      lat: -36.5,
      lng: -71,
      zoom: 4,
    },
    scope: [
      'Chile continental y alrededores. Para islas, desplaza el mapa.',
      'Mainland Chile and surrounding area. Pan the map for islands.',
    ],
  },
  resources: [
    {
      name: 'SENAPRED · Chile Preparado',
      category: ['Protección civil · mapas oficiales', 'Civil protection · official maps'],
      description: [
        'Consulta amenazas, planos de evacuación y puntos de encuentro para localidades de Chile.',
        'Consult hazards, evacuation maps and assembly points for locations in Chile.',
      ],
      url: 'https://www.senapred.cl/visor-preparado/',
      reviewedAt: '2026-10-11',
    },
    {
      name: 'SENAPRED · Planos de evacuación',
      category: ['Evacuación por tsunami', 'Tsunami evacuation'],
      description: [
        'Planos oficiales por localidad. Comprueba la versión y sigue las indicaciones locales.',
        'Official local maps. Check the version and follow local instructions.',
      ],
      url: 'https://senapred.cl/planos-de-evacuacion/',
      reviewedAt: '2026-10-11',
    },
  ],
  evacuation: {
    name: 'SENAPRED · Planos de evacuación',
    url: 'https://senapred.cl/planos-de-evacuacion/',
    reviewedAt: '2026-10-11',
  },
} satisfies Destination;
