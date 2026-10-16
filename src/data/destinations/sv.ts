import type { Destination } from './types.ts';
export default {
  code: 'SV',
  emergency: {
    source: 'https://travel.gc.ca/assistance/embassies-consulates/el-salvador',
    agency: 'Gobierno de Canadá · travel.gc.ca',
    numbers: [
      {
        number: '911',
        label: ['Emergencias', 'Emergencies', 'Emergências'],
      },
      {
        number: '132',
        label: ['Emergencias médicas', 'Medical emergencies', 'Emergências médicas'],
      },
    ],
    note: [
      'En una emergencia médica, marca 132, o marca 911 y pide un operador del 132.',
      'For a medical emergency, dial 132, or dial 911 and ask for a 132 operator.',
      'Em uma emergência médica, disque 132, ou disque 911 e peça um atendente do 132.',
    ],
    reviewedAt: '2026-10-13',
  },
  civilProtection: {
    name: 'Dirección General de Protección Civil',
    url: 'https://www.proteccioncivil.gob.sv/',
    reviewedAt: '2026-10-13',
  },
  weatherAgency: {
    name: 'MARN · Observatorio de Amenazas',
    url: 'https://www.snet.gob.sv/ver/meteorologia/informes+especiales/',
    reviewedAt: '2026-10-13',
  },
  seismicAgency: {
    name: 'MARN · Observatorio de Amenazas',
    url: 'https://www.snet.gob.sv/ver/sismologia/',
    reviewedAt: '2026-10-13',
  },
  region: {
    bounds: {
      south: 12,
      north: 15,
      west: -91,
      east: -87,
    },
    view: {
      lat: 13.7,
      lng: -88.9,
      zoom: 7,
    },
    scope: [
      'El Salvador y alrededores. Incluye zonas de Guatemala, Honduras, Nicaragua y el Pacífico.',
      'El Salvador and surrounding area. Includes parts of Guatemala, Honduras, Nicaragua and the Pacific.',
      'El Salvador e arredores. Inclui áreas da Guatemala, de Honduras, da Nicarágua e do Pacífico.',
    ],
  },
  resources: [
    {
      name: 'Protección Civil · Avisos',
      category: [
        'Protección civil · avisos oficiales',
        'Civil protection · official notices',
        'Proteção civil · avisos oficiais',
      ],
      description: [
        'Alertas y avisos oficiales por zona. Revisa la fecha y el área de cada aviso.',
        'Official alerts and notices by area. Check the date and area of each notice.',
        'Alertas e avisos oficiais por área. Confira a data e a área de cada aviso.',
      ],
      url: 'https://www.proteccioncivil.gob.sv/category/avisos/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'MARN · Mapa de amenaza por tsunami',
      category: ['Tsunami · mapa de amenaza', 'Tsunami · hazard map', 'Tsunami · mapa de ameaça'],
      description: [
        'Mapa modelado de la costa. No muestra rutas de evacuación ni zonas seguras; sigue las indicaciones locales.',
        'Modelled map of the coast. It does not show evacuation routes or safe areas; follow local instructions.',
        'Mapa modelado da costa. Não mostra rotas de evacuação nem áreas seguras; siga as orientações locais.',
      ],
      url: 'https://www.snet.gob.sv/ver/oceanografia/amenaza/mapa+de+amenaza+por+tsunami/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'MARN · Vulcanología',
      category: ['Volcanes · vigilancia', 'Volcanoes · monitoring', 'Vulcões · monitoramento'],
      description: [
        'Vigilancia e informes volcánicos del MARN. Para avisos, consulta también a Protección Civil.',
        'MARN volcano monitoring and reports. For alerts, also check Civil Protection.',
        'Monitoramento e relatórios vulcânicos do MARN. Para avisos, consulte também a Proteção Civil.',
      ],
      url: 'https://www.snet.gob.sv/ver/vulcanologia/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'Cruz Roja Salvadoreña',
      category: [
        'Cruz Roja · sociedad nacional',
        'Red Cross · national society',
        'Cruz Vermelha · sociedade nacional',
      ],
      description: [
        'Sitio institucional. No confirma servicios disponibles ni albergues abiertos.',
        'Institutional site. It does not confirm available services or open shelters.',
        'Site institucional. Não confirma serviços disponíveis nem abrigos abertos.',
      ],
      url: 'https://cruzrojasal.org.sv/',
      reviewedAt: '2026-10-13',
    },
  ],
} satisfies Destination;
