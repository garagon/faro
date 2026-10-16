import type { Destination } from './types.ts';
export default {
  code: 'NI',
  emergency: {
    source: 'https://www.mapanicaragua.com/numeros-de-emergencias-otros/',
    agency: 'INTUR · Instituto Nicaragüense de Turismo',
    numbers: [
      {
        number: '128',
        // INTUR's list names Cruz Blanca for 128; other official travel advice says "ambulance".
        label: ['Ambulancia', 'Ambulance', 'Ambulância'],
      },
      {
        number: '115',
        label: ['Bomberos', 'Fire department', 'Bombeiros'],
      },
      {
        number: '118',
        label: ['Policía', 'Police', 'Polícia'],
      },
    ],
    note: [
      'Lista de INTUR para visitantes. No detalla cobertura por región ni por operador móvil.',
      'INTUR list for visitors. It does not detail coverage by region or mobile carrier.',
      'Lista do INTUR para visitantes. Não detalha a cobertura por região nem por operadora de celular.',
    ],
    reviewedAt: '2026-10-14',
  },
  civilProtection: {
    name: 'SINAPRED',
    url: 'https://www.sinapred.gob.ni/',
    reviewedAt: '2026-10-13',
  },
  weatherAgency: {
    name: 'INETER · Meteorología',
    url: 'https://servmet.ineter.gob.ni/Pronostico/',
    reviewedAt: '2026-10-13',
  },
  seismicAgency: {
    name: 'INETER · Actividad sísmica reciente',
    url: 'https://mapserveride.ineter.gob.ni/IDE-VisorSismos/',
    reviewedAt: '2026-10-13',
  },
  region: {
    bounds: {
      south: 10,
      north: 15.5,
      west: -88,
      east: -82,
    },
    view: {
      lat: 12.8,
      lng: -85,
      zoom: 6,
    },
    scope: [
      'Nicaragua con las islas del Maíz y zonas cercanas de Honduras, El Salvador y Costa Rica.',
      'Nicaragua including the Corn Islands, plus nearby parts of Honduras, El Salvador and Costa Rica.',
      'Nicarágua com as Ilhas do Milho e áreas próximas de Honduras, El Salvador e Costa Rica.',
    ],
  },
  resources: [
    {
      name: 'INETER · CATAC',
      category: [
        'Tsunami · centro regional',
        'Tsunami · regional centre',
        'Tsunami · centro regional',
      ],
      description: [
        'Centro de INETER que envía mensajes técnicos sobre sismos y tsunamis a instituciones de América Central. No es una alerta para el público; sigue a SINAPRED.',
        'INETER centre that sends technical earthquake and tsunami messages to Central American institutions. It is not a public alert; follow SINAPRED.',
        'Centro do INETER que envia mensagens técnicas sobre terremotos e tsunamis a instituições da América Central. Não é um alerta para o público; siga o SINAPRED.',
      ],
      url: 'https://catac.ineter.gob.ni/',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'INETER · Mapas de amenazas',
      category: [
        'Mapas oficiales · amenazas',
        'Official maps · hazards',
        'Mapas oficiais · ameaças',
      ],
      description: [
        'Mapas municipales de amenaza y vulnerabilidad ante sismos, volcanes y tsunamis. No son rutas de evacuación ni zonas seguras.',
        'Municipal hazard and vulnerability maps for earthquakes, volcanoes and tsunamis. They are not evacuation routes or safe zones.',
        'Mapas municipais de ameaça e vulnerabilidade a terremotos, vulcões e tsunamis. Não são rotas de evacuação nem zonas seguras.',
      ],
      url: 'https://www.ineter.gob.ni/geoportales/vulnerabilidades-amenazas/index.html',
      reviewedAt: '2026-10-13',
    },
    {
      name: 'INETER · Volcanes',
      category: ['Volcanes · cámaras web', 'Volcanoes · webcams', 'Vulcões · webcams'],
      description: [
        'Cámaras de INETER en volcanes activos. Algunas imágenes pueden no estar actualizadas; no son una alerta.',
        'INETER cameras on active volcanoes. Some images may be out of date; they are not an alert.',
        'Câmeras do INETER em vulcões ativos. Algumas imagens podem estar desatualizadas; não são um alerta.',
      ],
      url: 'https://www.ineter.gob.ni/volcanes-en-nicaragua/',
      reviewedAt: '2026-10-13',
    },
  ],
} satisfies Destination;
