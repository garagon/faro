import type { Destination } from './types.ts';
export default {
  code: 'DO',
  emergency: {
    source:
      'https://presidencia.gob.do/noticias/presidente-abinader-lleva-el-sistema-911-montecristi-y-fortalece-la-respuesta-emergencias',
    agency: 'Presidencia de la República Dominicana',
    numbers: [
      {
        number: '911',
        label: [
          'Emergencias · Sistema 9-1-1 · cobertura parcial',
          'Emergencies · 9-1-1 system · partial coverage',
          'Emergências · Sistema 9-1-1 · cobertura parcial',
        ],
      },
    ],
    note: [
      'El 9-1-1 no cubre todo el país: en julio de 2026 operaba en 27 provincias (94,64 % de la población). La fuente no lista cuáles. Confirma con tu alojamiento o las autoridades locales.',
      'The 9-1-1 system does not cover the whole country: in July 2026 it operated in 27 provinces (94.64% of the population). The source does not list which. Check with your accommodation or local authorities.',
      'O 9-1-1 não cobre o país todo: em julho de 2026, funcionava em 27 províncias (94,64% da população). A fonte não lista quais. Confirme com sua hospedagem ou com as autoridades locais.',
    ],
    reviewedAt: '2026-10-13',
  },
  civilProtection: {
    name: 'COE · Centro de Operaciones de Emergencias',
    url: 'https://www.coe.gob.do/',
    reviewedAt: '2026-10-13',
  },
  weatherAgency: {
    name: 'INDOMET',
    url: 'https://indomet.gob.do/pronostico/informes-marino/informe-del-tiempo/',
    reviewedAt: '2026-10-13',
  },
  seismicAgency: {
    name: 'Centro Nacional de Sismología · UASD',
    url: 'https://sismologico.uasd.edu.do/',
    reviewedAt: '2026-10-13',
  },
  region: {
    bounds: {
      south: 16.5,
      north: 20.5,
      west: -74.6,
      east: -67.6,
    },
    view: {
      lat: 18.8,
      lng: -70.2,
      zoom: 6,
    },
    scope: [
      'República Dominicana y alrededores. Incluye Haití, que comparte la isla.',
      'Dominican Republic and surrounding area. Includes Haiti, which shares the island.',
      'República Dominicana e arredores. Inclui o Haiti, que divide a mesma ilha.',
    ],
  },
  resources: [
    {
      name: 'Defensa Civil · Qué hacer en caso de terremoto',
      category: [
        'Protección civil · preparación',
        'Civil protection · preparedness',
        'Proteção civil · preparação',
      ],
      description: [
        'Guías oficiales en PDF para personas, familias e instituciones. En español.',
        'Official PDF guides for individuals, families and institutions. In Spanish.',
        'Guias oficiais em PDF para pessoas, famílias e instituições. Em espanhol.',
      ],
      url: 'https://defensacivil.gob.do/publicaciones/herramientas-de-preparacion/category/terremoto',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'POLITUR · Asistencia y Protección al Turista',
      category: [
        'Policía turística · asistencia',
        'Tourist police · assistance',
        'Polícia turística · assistência',
      ],
      description: [
        'Servicio oficial para turistas, sobre todo en polos turísticos. Revisa requisitos y canales de contacto en la página.',
        'Official service for tourists, mainly in tourist areas. Check requirements and contact channels on the page.',
        'Serviço oficial para turistas, sobretudo em polos turísticos. Confira requisitos e canais de contato na página.',
      ],
      url: 'https://politur.gob.do/todos-los-servicios/asistencia-y-proteccion-al-turista',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'INDOMET · Información sobre tsunamis',
      category: ['Meteorología · tsunamis', 'Meteorology · tsunamis', 'Meteorologia · tsunamis'],
      description: [
        'Información general sobre tsunamis y medidas preventivas. No es un mapa de evacuación ni una alerta activa.',
        'General information on tsunamis and preventive measures. Not an evacuation map or an active alert.',
        'Informações gerais sobre tsunamis e medidas preventivas. Não é um mapa de evacuação nem um alerta ativo.',
      ],
      url: 'https://indomet.gob.do/publicaciones/climatologia/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'Cruz Roja Dominicana',
      category: [
        'Cruz Roja · sociedad nacional',
        'Red Cross · national society',
        'Cruz Vermelha · sociedade nacional',
      ],
      description: [
        'Información institucional y de contacto. No confirma servicios disponibles en tu zona.',
        'Institutional and contact information. It does not confirm services available in your area.',
        'Informações institucionais e de contato. Não confirma serviços disponíveis na sua área.',
      ],
      url: 'https://cruzroja.org.do/',
      reviewedAt: '2026-10-13',
    },
  ],
} satisfies Destination;
