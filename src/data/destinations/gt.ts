import type { Destination } from './types.ts';
export default {
  code: 'GT',
  emergency: {
    source: 'https://conred.gob.gt/numeros-de-emergencia/',
    agency: 'SE-CONRED',
    numbers: [
      {
        number: '110',
        label: ['Policía · PNC', 'Police · PNC', 'Polícia · PNC'],
      },
      {
        number: '122',
        label: ['Bomberos Voluntarios', 'Volunteer firefighters', 'Bombeiros voluntários'],
      },
      {
        number: '123',
        label: [
          'Bomberos Municipales · Ciudad de Guatemala',
          'Municipal firefighters · Guatemala City',
          'Bombeiros municipais · Cidade da Guatemala',
        ],
      },
      {
        number: '1554',
        label: [
          'Bomberos Departamentales',
          'Departmental firefighters',
          'Bombeiros departamentais',
        ],
      },
      {
        number: '125',
        label: ['Cruz Roja Guatemalteca', 'Guatemalan Red Cross', 'Cruz Vermelha Guatemalteca'],
      },
      {
        number: '119',
        label: [
          'CONRED · emergencias y desastres',
          'CONRED · emergencies and disasters',
          'CONRED · emergências e desastres',
        ],
      },
    ],
    note: [
      'Hay varios cuerpos de bomberos con estaciones propias; la cobertura depende del lugar. El 123 corresponde a la Ciudad de Guatemala.',
      'Several fire services run their own stations; coverage depends on location. 123 serves Guatemala City.',
      'Há vários corpos de bombeiros com estações próprias; a cobertura depende do local. O 123 atende a Cidade da Guatemala.',
    ],
    reviewedAt: '2026-10-13',
  },
  civilProtection: {
    name: 'CONRED',
    url: 'https://conred.gob.gt/',
    reviewedAt: '2026-10-13',
  },
  weatherAgency: {
    name: 'INSIVUMEH',
    url: 'https://insivumeh.gob.gt/boletin-meteorologico-especial/',
    reviewedAt: '2026-10-13',
  },
  seismicAgency: {
    name: 'INSIVUMEH · Red Sismológica Nacional',
    url: 'https://insivumeh.gob.gt/mapa-sismos/',
    reviewedAt: '2026-10-13',
  },
  region: {
    bounds: {
      south: 12,
      north: 18.5,
      west: -93.5,
      east: -87.5,
    },
    view: {
      lat: 15.5,
      lng: -90.25,
      zoom: 6,
    },
    scope: [
      'Guatemala y alrededores. Incluye zonas de México, Belice, Honduras y El Salvador.',
      'Guatemala and surrounding area. Includes parts of Mexico, Belize, Honduras and El Salvador.',
      'Guatemala e arredores. Inclui áreas do México, de Belize, de Honduras e de El Salvador.',
    ],
  },
  resources: [
    {
      name: 'INGUAT · Asistencia al Turista 1500',
      category: ['Turismo · asistencia', 'Tourism · assistance', 'Turismo · assistência'],
      description: [
        'INGUAT publica la línea 1500 de información y asistencia al turista. No sustituye a los números de emergencia.',
        'INGUAT publishes line 1500 for tourist information and assistance. It does not replace emergency numbers.',
        'O INGUAT publica a linha 1500 de informação e assistência ao turista. Ela não substitui os números de emergência.',
      ],
      url: 'https://asistur.gt/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'Cruz Roja Guatemalteca',
      category: [
        'Cruz Roja · sociedad nacional',
        'Red Cross · national society',
        'Cruz Vermelha · sociedade nacional',
      ],
      description: [
        'Sitio oficial de la Cruz Roja Guatemalteca. No confirma albergues abiertos ni ambulancias disponibles.',
        'Official Guatemalan Red Cross website. It does not confirm open shelters or available ambulances.',
        'Site oficial da Cruz Vermelha Guatemalteca. Não confirma abrigos abertos nem ambulâncias disponíveis.',
      ],
      url: 'https://www.cruzroja.gt/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'INSIVUMEH · Boletines de vulcanología',
      category: ['Volcanes · boletines', 'Volcanoes · bulletins', 'Vulcões · boletins'],
      description: [
        'Boletines diarios y especiales sobre volcanes activos. Revisa la fecha y sigue las indicaciones de CONRED.',
        'Daily and special bulletins on active volcanoes. Check the date and follow CONRED instructions.',
        'Boletins diários e especiais sobre vulcões ativos. Confira a data e siga as orientações da CONRED.',
      ],
      url: 'https://insivumeh.gob.gt/vulcanologia-boletines-1/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'CONRED · Avisos y comunicados',
      category: [
        'Protección civil · avisos',
        'Civil protection · notices',
        'Proteção civil · avisos',
      ],
      description: [
        'Avisos oficiales publicados como imágenes. Revisa el número y la fecha de cada aviso.',
        'Official notices published as images. Check the number and date of each notice.',
        'Avisos oficiais publicados como imagens. Confira o número e a data de cada aviso.',
      ],
      url: 'https://conred.gob.gt/avisos-y-comunicados/',
      reviewedAt: '2026-10-13',
    },
  ],
} satisfies Destination;
