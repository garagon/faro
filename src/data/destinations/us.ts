import type { Destination } from './types.ts';
export default {
  code: 'US',
  emergency: {
    source: 'https://www.911.gov/calling-911/',
    agency: 'National 911 Program',
    numbers: [
      {
        number: '911',
        label: ['Policía, bomberos y ambulancia', 'Police, fire and ambulance'],
      },
    ],
    reviewedAt: '2026-10-11',
  },
  civilProtection: {
    name: 'Ready.gov · FEMA',
    url: 'https://www.ready.gov/',
    reviewedAt: '2026-10-12',
  },
  seismicAgency: {
    name: 'USGS',
    url: 'https://earthquake.usgs.gov/earthquakes/map/',
    reviewedAt: '2026-10-12',
  },
  region: {
    bounds: {
      south: 24,
      north: 50,
      west: -126,
      east: -66,
    },
    view: {
      lat: 38,
      lng: -97,
      zoom: 4,
    },
    scope: [
      'Estados Unidos continental. Para Alaska, Hawái o territorios, desplaza el mapa.',
      'Contiguous United States. Pan the map for Alaska, Hawaii or territories.',
    ],
  },
  resources: [
    {
      name: 'NOAA · Tsunami Warning Centers',
      category: ['Boletines de tsunami', 'Tsunami bulletins'],
      description: [
        'Consulta directamente los boletines y el área a la que aplican.',
        'Read official bulletins and their applicable areas directly.',
      ],
      url: 'https://www.tsunami.gov/',
      reviewedAt: '2026-10-11',
    },
  ],
} satisfies Destination;
