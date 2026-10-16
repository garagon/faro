import type { Destination } from './types.ts';
export default {
  code: 'US',
  emergency: {
    source: 'https://www.911.gov/calling-911/',
    agency: 'National 911 Program',
    numbers: [
      {
        number: '911',
        label: [
          'Policía, bomberos y ambulancia',
          'Police, fire and ambulance',
          'Polícia, bombeiros e ambulância',
        ],
      },
    ],
    reviewedAt: '2026-10-11',
  },
  civilProtection: {
    name: 'Ready.gov · FEMA',
    url: 'https://www.ready.gov/',
    reviewedAt: '2026-10-12',
  },
  weatherAgency: {
    name: 'National Weather Service',
    url: 'https://www.weather.gov/alerts',
    reviewedAt: '2026-10-13',
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
      'Parte continental dos Estados Unidos. Para o Alasca, o Havaí ou os territórios, mova o mapa.',
    ],
  },
  resources: [
    {
      name: 'NOAA · Tsunami Warning Centers',
      category: ['Boletines de tsunami', 'Tsunami bulletins', 'Boletins de tsunami'],
      description: [
        'Consulta directamente los boletines y el área a la que aplican.',
        'Read official bulletins and their applicable areas directly.',
        'Consulte diretamente os boletins e a área a que se aplicam.',
      ],
      url: 'https://www.tsunami.gov/',
      reviewedAt: '2026-10-11',
    },
  ],
} satisfies Destination;
