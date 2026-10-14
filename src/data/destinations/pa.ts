import type { Destination } from './types.ts';
export default {
  code: 'PA',
  emergency: {
    source: 'https://sume911.pa/acerca-de/como-funciona',
    agency: 'SUME',
    numbers: [
      {
        number: '911',
        label: ['Emergencias', 'Emergencies', 'Emergências'],
      },
      // Backups if 911 does not answer, each from the agency's own site or communiqué.
      {
        number: '104',
        label: ['Policía Nacional', 'National Police', 'Polícia Nacional'],
        source: 'https://www.policia.gob.pa/',
      },
      {
        number: '103',
        label: ['Bomberos', 'Fire service', 'Bombeiros'],
        source: 'https://www.bomberos.gob.pa/',
      },
      {
        // Written with the country code so it also connects from a phone with a foreign SIM.
        number: '+507 520-4426',
        label: [
          'SINAPROC · Protección Civil',
          'SINAPROC · Civil protection',
          'SINAPROC · Proteção civil',
        ],
        source: 'https://www.sinaproc.gob.pa/',
      },
    ],
    // Listed on the SINAPROC homepage as "WhatsApp 6998-4809", from any phone, 24 hours.
    whatsapp: {
      number: '+507 6998-4809',
      label: [
        'SINAPROC · WhatsApp, 24 horas',
        'SINAPROC · WhatsApp, 24 hours',
        'SINAPROC · WhatsApp, 24 horas',
      ],
      source: 'https://www.sinaproc.gob.pa/',
    },
    note: [
      'Si la llamada al 911 no entra, prueba la línea de la institución que necesitas.',
      'If a call to 911 does not go through, try the line for the service you need.',
      'Se a ligação para o 911 não completar, tente a linha da instituição de que você precisa.',
    ],
    reviewedAt: '2026-10-14',
  },
  civilProtection: {
    name: 'SINAPROC',
    url: 'https://www.sinaproc.gob.pa/',
    reviewedAt: '2026-10-13',
  },
  weatherAgency: {
    name: 'IMHPA',
    url: 'https://www.imhpa.gob.pa/es/aviso-vigilancia',
    reviewedAt: '2026-10-13',
  },
  seismicAgency: {
    name: 'IGC · Universidad de Panamá',
    url: 'https://sismosgeociencias.up.ac.pa/',
    reviewedAt: '2026-10-13',
  },
  // MOP and IDAAN did not answer when checked, so they are named without a link.
  services: [
    { topic: ['agua', 'water', 'água'], agencies: [{ name: 'IDAAN' }] },
    {
      topic: ['luz', 'power', 'energia elétrica'],
      agencies: [
        { name: 'ENSA', url: 'https://ensa.com.pa/' },
        { name: 'Naturgy', url: 'https://www.naturgy.com.pa/' },
      ],
    },
    { topic: ['carreteras', 'roads', 'estradas'], agencies: [{ name: 'MOP' }] },
    {
      topic: ['salud', 'health', 'saúde'],
      agencies: [{ name: 'MINSA', url: 'https://www.minsa.gob.pa/' }],
    },
  ],
  servicesReviewedAt: '2026-10-14',
  region: {
    bounds: {
      south: 4,
      north: 12,
      west: -85,
      east: -75,
    },
    view: {
      lat: 8.5,
      lng: -80,
      zoom: 6,
    },
    scope: ['Panamá y alrededores', 'Panama and surrounding area', 'Panamá e arredores'],
  },
  // Each URL was opened on the review date. No official tsunami evacuation map for Panama's coasts was
  // found, so no `evacuation` link is set. Descriptions never claim open shelters or available services.
  resources: [
    {
      name: 'SINAPROC · Medidas de prevención',
      category: [
        'Protección civil · niveles de alerta',
        'Civil protection · alert levels',
        'Proteção civil · níveis de alerta',
      ],
      description: [
        'Explica qué significan las alertas verde, amarilla y roja de SINAPROC. No indica qué alerta está vigente: sigue los avisos oficiales.',
        'Explains what SINAPROC’s green, yellow and red alerts mean. It does not show which alert is in effect: follow official notices.',
        'Explica o que significam os alertas verde, amarelo e vermelho do SINAPROC. Não indica qual alerta está em vigor: siga os avisos oficiais.',
      ],
      url: 'https://www.sinaproc.gob.pa/medidas-de-prevencion/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'Autoridad de Turismo de Panamá · Oficinas regionales',
      category: ['Turismo · orientación', 'Tourism · visitor information', 'Turismo · orientação'],
      description: [
        'Teléfonos de oficinas regionales y centros de información en aeropuertos. Orientación turística en horario de oficina; no es una línea de emergencias ni confirma atención tras un desastre.',
        'Phone numbers for regional offices and airport information centers. Tourist guidance during office hours; not an emergency line and does not confirm service after a disaster.',
        'Telefones de escritórios regionais e centros de informação em aeroportos. Orientação turística em horário comercial; não é uma linha de emergência nem confirma atendimento após um desastre.',
      ],
      url: 'https://www.atp.gob.pa/oficinas-regionales/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'Universidad Tecnológica de Panamá',
      category: [
        'Universidad · evacuación en campus',
        'University · campus evacuation',
        'Universidade · evacuação no campus',
      ],
      description: [
        'La FIM publica rutas y puntos de encuentro del Edificio 1. Uso del campus; no confirma acceso ni refugio para turistas.',
        'FIM publishes Building 1 evacuation routes and assembly points. Campus use; tourist access or shelter is not confirmed.',
        'A FIM publica rotas e pontos de encontro do Edifício 1. Uso do campus; não confirma acesso nem abrigo para turistas.',
      ],
      url: 'https://fim.utp.ac.pa/protocolos-de-evacuacion',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'Alcaldía de Panamá · Gestión Social',
      category: [
        'Municipalidad · respuesta local',
        'Municipality · local response',
        'Município · resposta local',
      ],
      description: [
        'Información municipal sobre apoyo social y respuesta a emergencias. Consulta directamente la atención disponible.',
        'Municipal information on social support and emergency response. Check current services directly.',
        'Informações municipais sobre apoio social e resposta a emergências. Consulte diretamente o atendimento disponível.',
      ],
      url: 'https://mupa.gob.pa/mupa-directores/directora-de-gestion-social/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'Alcaldía de Panamá · Resiliencia',
      category: [
        'Municipalidad · gestión de riesgos',
        'Municipality · risk management',
        'Município · gestão de riscos',
      ],
      description: [
        'Plan municipal 2020–2030. Documento de planificación; no es un listado de refugios abiertos.',
        'Municipal plan 2020–2030. Planning document; not a list of open shelters.',
        'Plano municipal 2020–2030. Documento de planejamento; não é uma lista de abrigos abertos.',
      ],
      url: 'https://resiliencia.mupa.gob.pa/wp-content/uploads/2022/08/Plan-de-Gestion-de-Riesgo-2020_Banco-Mundial.pdf',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'Mingob · AMUPA',
      category: [
        'Municipios · coordinación',
        'Municipalities · coordination',
        'Municípios · coordenação',
      ],
      description: [
        'Información oficial sobre preparación de los municipios. No es una convocatoria de voluntariado.',
        'Official information on municipal preparedness. This is not a volunteer opening.',
        'Informações oficiais sobre a preparação dos municípios. Não é uma convocação de voluntários.',
      ],
      url: 'https://www.mingob.gob.pa/mingob-y-amupa-refuerzan-la-gestion-de-riesgos-y-preparacion-de-los-municipios-ante-emergencias/',
      reviewedAt: '2026-10-13',
    },
  ],
} satisfies Destination;
