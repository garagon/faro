import type { Destination } from './types.ts';
export default {
  code: 'HN',
  emergency: {
    source: 'https://policianacional.gob.hn/',
    agency: 'Policía Nacional de Honduras',
    numbers: [
      {
        number: '911',
        label: [
          'Emergencias · línea única',
          'Emergencies · single line',
          'Emergências · linha única',
        ],
      },
    ],
    reviewedAt: '2026-10-13',
  },
  civilProtection: {
    name: 'COPECO',
    url: 'https://copeco.gob.hn/',
    reviewedAt: '2026-10-13',
  },
  weatherAgency: {
    name: 'CENAOS · COPECO',
    url: 'https://cenaos.copeco.gob.hn/',
    reviewedAt: '2026-10-13',
  },
  seismicAgency: {
    name: 'CENAOS · COPECO',
    url: 'https://cenaos.copeco.gob.hn/sismo.html',
    reviewedAt: '2026-10-13',
  },
  region: {
    bounds: {
      south: 12.5,
      north: 18,
      west: -90,
      east: -82.5,
    },
    view: {
      lat: 15,
      lng: -86.5,
      zoom: 6,
    },
    scope: [
      'Honduras, Islas de la Bahía, Islas del Cisne y países vecinos',
      'Honduras, Bay Islands, Swan Islands and neighboring countries',
      'Honduras, Ilhas da Baía, Ilhas do Cisne e países vizinhos',
    ],
  },
  resources: [
    {
      name: 'Secretaría de Salud de Honduras',
      category: [
        'Salud · avisos oficiales',
        'Health · official notices',
        'Saúde · avisos oficiais',
      ],
      description: [
        'Comunicados y alertas epidemiológicas. No es un directorio de centros ni confirma atención disponible.',
        'Public notices and epidemiological alerts. Not a facility directory; it does not confirm available care.',
        'Comunicados e alertas epidemiológicos. Não é um diretório de unidades de saúde nem confirma atendimento disponível.',
      ],
      url: 'https://www.salud.gob.hn/',
      reviewedAt: '2026-10-13',
    },
  ],
} satisfies Destination;
