import { embassies, type Embassy } from '../lib/embassies.ts';
import type { Localized } from './destinations/types.ts';
export type Mission = {
  id: string;
  country: string;
  nation: string;
  name: Localized;
  kind: 'embassy' | 'consulate' | 'honorary' | 'office';
  source: string;
  reviewedAt: string;
  sourceDate?: string;
  historical?: boolean;
  address?: string;
  locationUnconfirmed?: boolean;
  city?: string;
  phone?: string;
  emergency?: string;
  emergencyNote?: Localized;
  note?: Localized;
  map?: Embassy;
};
export const euProtection =
  'https://www.eeas.europa.eu/delegations/panama/consular-protection-of-eu-citizens-in-panama_en?s=249';
const euDirectory =
  'https://www.eeas.europa.eu/sites/default/files/documents/2024/Contact%20info%20and%20web%20sites%20of%20EUMS%20in%20Panama%20-%20October%202024.pdf';
export const missionKinds: Record<Mission['kind'], Localized> = {
  embassy: ['Embajada', 'Embassy', 'Embaixada'],
  consulate: [
    'Consulado / sección consular',
    'Consulate / consular section',
    'Consulado / setor consular',
  ],
  honorary: ['Consulado honorario', 'Honorary consulate', 'Consulado honorário'],
  office: ['Oficina diplomática', 'Diplomatic office', 'Escritório diplomático'],
};
const current: Mission[] = [
  {
    id: 'it-pa',
    country: 'PA',
    nation: 'IT',
    kind: 'embassy',
    name: ['Embajada de Italia', 'Embassy of Italy', 'Embaixada da Itália'],
    address: 'PH Plaza 58, piso 6, Calle 58 Este con Ricardo Arango, Obarrio, Panamá',
    phone: '+5072258948',
    source: 'https://ambpanama.esteri.it/es/',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'pl-pa',
    country: 'PA',
    nation: 'PL',
    kind: 'embassy',
    name: [
      'Embajada y sección consular de Polonia',
      'Embassy and consular section of Poland',
      'Embaixada e setor consular da Polônia',
    ],
    address:
      'Av. Balboa y Calle Aquilino de la Guardia, PH BICSA Financial Center, piso 32, oficina 3202, Panamá',
    phone: '+5073680263',
    emergency: '+50769976137',
    emergencyNote: [
      'Para urgencias de ciudadanos polacos fuera del horario de oficina.',
      'For Polish citizens’ emergencies outside office hours.',
      'Para urgências de cidadãos poloneses fora do horário de atendimento.',
    ],
    source: 'https://www.gov.pl/web/panama-es/embajada',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'hu-pa',
    country: 'PA',
    nation: 'HU',
    kind: 'office',
    name: [
      'Oficina de la Embajada de Hungría',
      'Office of the Embassy of Hungary',
      'Escritório da Embaixada da Hungria',
    ],
    address: 'Oceania Business Plaza, Torre 1000, 30-D, Calle Isaac Hanono Missri, Panamá',
    phone: '+50765911580',
    source: 'https://bogota.mfa.gov.hu/es/ciudad-de-panama',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'nl-pa',
    country: 'PA',
    nation: 'NL',
    kind: 'embassy',
    name: [
      'Embajada de los Países Bajos',
      'Embassy of the Netherlands',
      'Embaixada dos Países Baixos',
    ],
    source: 'https://www.nederlandwereldwijd.nl/afspraak-maken/panama',
    reviewedAt: '2026-10-12',
    note: [
      'Algunos trámites se atienden en Costa Rica. Consulta el servicio y la sede antes de ir.',
      'Some services are handled in Costa Rica. Check the service and office before traveling.',
      'Alguns serviços são feitos na Costa Rica. Confira o serviço e o local antes de ir.',
    ],
  },
  {
    id: 'tr-pa',
    country: 'PA',
    nation: 'TR',
    kind: 'embassy',
    name: ['Embajada de Turquía', 'Embassy of Türkiye', 'Embaixada da Turquia'],
    emergency: '+903122922929',
    emergencyNote: [
      'Central consular en Turquía, disponible las 24 horas. Es una llamada internacional.',
      'Consular call centre in Türkiye, available 24 hours. International call.',
      'Central consular na Turquia, disponível 24 horas. É uma ligação internacional.',
    ],
    source: 'https://panama-be.mfa.gov.tr/Mission/About',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'co-pa-consulate',
    country: 'PA',
    nation: 'CO',
    kind: 'consulate',
    name: [
      'Consulado General de Colombia',
      'Consulate General of Colombia',
      'Consulado-Geral da Colômbia',
    ],
    address:
      'Condominio Posada del Rey, planta baja, Paitilla, Vía Italia, frente al Hotel Plaza Paitilla Inn, Panamá',
    source: 'https://panama.consulado.gov.co/acerca/atencion_usuario',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'cl-pa-consulate',
    country: 'PA',
    nation: 'CL',
    kind: 'consulate',
    name: ['Sección Consular de Chile', 'Consular section of Chile', 'Setor consular do Chile'],
    address: 'Torres de Las Américas, piso 7, Torre B, Punta Pacífica, San Francisco, Panamá',
    phone: '+5072031890',
    emergency: '+50766783655',
    source:
      'https://www.consulado.gob.cl/consulados-en-el-exterior/panama/ciudad-de-panama/seccion-consular-de-chile-en-ciudad-de-panama',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'ca-pa',
    country: 'PA',
    nation: 'CA',
    kind: 'embassy',
    name: ['Embajada de Canadá', 'Embassy of Canada', 'Embaixada do Canadá'],
    address: 'Torres de Las Américas, Torre A, piso 11, Punta Pacífica, Panamá',
    phone: '+5072942500',
    source:
      'https://www.international.gc.ca/country-pays/panama/panama_city-ville_de_panama.aspx?lang=eng',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'pe-pa',
    country: 'PA',
    nation: 'PE',
    kind: 'embassy',
    name: ['Embajada del Perú', 'Embassy of Peru', 'Embaixada do Peru'],
    address: 'Torre Global Bank, Calle 50, piso 35, oficina 3502, Panamá',
    phone: '+5072699053',
    emergency: '+50763790869',
    source: 'https://www.gob.pe/institucion/embajada-del-peru-en-panama/sedes',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'de-pa',
    country: 'PA',
    nation: 'DE',
    kind: 'embassy',
    name: ['Embajada de Alemania', 'Embassy of Germany', 'Embaixada da Alemanha'],
    address: 'Calle 53 E, Marbella, World Trade Center, piso 20, Panamá',
    phone: '+5073076300',
    emergency: '+50765173200',
    emergencyNote: [
      'Fuera del horario de atención, hasta medianoche de Panamá. Solo urgencias que no pueden esperar al siguiente día hábil.',
      'Outside office hours, until midnight in Panama. Only emergencies that cannot wait until the next working day.',
      'Fora do horário de atendimento, até a meia-noite (horário do Panamá). Somente urgências que não podem esperar até o próximo dia útil.',
    ],
    source: 'https://panama.diplo.de/pa-es/1339094-1339094',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'fr-pa',
    country: 'PA',
    nation: 'FR',
    kind: 'consulate',
    name: ['Sección Consular de Francia', 'Consular section of France', 'Setor consular da França'],
    address: 'Plaza de Francia, Las Bóvedas, San Felipe, Panamá',
    phone: '+5078338341',
    source:
      'https://lannuaire.service-public.gouv.fr/ambassades/afc1b0d2-0dfb-41de-9e15-633c708b3758',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'ec-pa',
    country: 'PA',
    nation: 'EC',
    kind: 'embassy',
    name: ['Embajada de Ecuador', 'Embassy of Ecuador', 'Embaixada do Equador'],
    emergency: '+50768986511',
    source:
      'https://www.cancilleria.gob.ec/2026/10/10/gobierno-nacional-mantiene-asistencia-consular-en-panama-sin-reportes-de-ecuatorianos-afectados/',
    sourceDate: '2026-10-10',
    reviewedAt: '2026-10-12',
    note: [
      'Canal de asistencia publicado tras el sismo del 9 de octubre. Confirma la sede antes de trasladarte.',
      'Assistance channel published after the October 9 earthquake. Confirm the office before traveling.',
      'Canal de assistência publicado após o terremoto de 9 de outubro. Confirme o local antes de se deslocar.',
    ],
  },
  {
    id: 'jp-pa',
    country: 'PA',
    nation: 'JP',
    kind: 'embassy',
    name: ['Embajada de Japón', 'Embassy of Japan', 'Embaixada do Japão'],
    address: 'Calle 50 y 60E, Obarrio, Panamá',
    phone: '+5072630264',
    source: 'https://www.panama.emb-japan.go.jp/itpr_es/embajada.html',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'cn-pa',
    country: 'PA',
    nation: 'CN',
    kind: 'embassy',
    name: ['Embajada de China', 'Embassy of China', 'Embaixada da China'],
    phone: '+5072653038',
    emergency: '+50766779301',
    source: 'https://pa.china-embassy.gov.cn/esp/',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'gb-pa',
    country: 'PA',
    nation: 'GB',
    kind: 'embassy',
    name: ['Embajada del Reino Unido', 'British Embassy', 'Embaixada do Reino Unido'],
    source: 'https://www.gov.uk/world/organisations/british-embassy-panama-city',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'br-pa',
    country: 'PA',
    nation: 'BR',
    kind: 'embassy',
    name: [
      'Embajada y sector consular de Brasil',
      'Embassy and consular section of Brazil',
      'Embaixada e setor consular do Brasil',
    ],
    address: 'Calle 55-E con Samuel Lewis, Torre Optima, pisos 22 y 23, Obarrio, Panamá',
    phone: '+5072635322',
    emergency: '+50763795616',
    emergencyNote: [
      'Guardia de emergencias (plantão): solo situaciones graves de ciudadanos brasileños, como muerte, accidente, hospitalización, desaparición, detención o violencia doméstica. No es para consultas generales; para trámites, escribe al sector consular.',
      'Emergency duty phone (plantão): serious situations involving Brazilian citizens only, such as death, accident, hospitalization, disappearance, arrest or domestic violence. Not for general inquiries; for consular matters, email the consular section.',
      'Plantão de emergência: somente situações graves envolvendo cidadãos brasileiros, como morte, acidente, hospitalização, desaparecimento, prisão ou violência doméstica. Não é para consultas gerais; para serviços consulares, envie um e-mail ao setor consular.',
    ],
    note: [
      'Lunes a viernes, 09:00–17:00; atención consular de 09:00 a 13:00 (hora de Panamá). Los trámites se solicitan en el sistema e-consular.',
      'Monday–Friday, 09:00–17:00; consular service 09:00–13:00 (Panama time). Services are requested through the e-consular system.',
      'Segunda a sexta, 09:00–17:00; atendimento consular das 09:00 às 13:00 (horário do Panamá). Os serviços são solicitados pelo sistema e-consular.',
    ],
    source: 'https://www.gov.br/mre/pt-br/embaixada-panama/embaixada-do-brasil-no-panama-1',
    reviewedAt: '2026-10-13',
  },
  {
    id: 'bo-pa',
    country: 'PA',
    nation: 'BO',
    kind: 'embassy',
    name: ['Embajada de Bolivia', 'Embassy of Bolivia', 'Embaixada da Bolívia'],
    source: 'https://embajadas.cancilleria.gob.bo/panama/contactos/',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'do-pa',
    country: 'PA',
    nation: 'DO',
    kind: 'embassy',
    name: [
      'Embajada de República Dominicana',
      'Embassy of the Dominican Republic',
      'Embaixada da República Dominicana',
    ],
    source: 'https://pan.mirex.gob.do/contacto/',
    reviewedAt: '2026-10-12',
  },
  {
    id: 'in-pa',
    country: 'PA',
    nation: 'IN',
    kind: 'embassy',
    name: ['Embajada de India', 'Embassy of India', 'Embaixada da Índia'],
    source: 'https://igod.gov.in/int/167/missions_abroad',
    reviewedAt: '2026-10-12',
  },
];
// These are source-index entries, NOT current addresses or emergency phone records.
// Preserve the directory's publication date; do not geocode or route to historic listings.
const euReferences: { nation: string; kind: Mission['kind']; city: string }[] = [
  ...['BE', 'GR', 'PT'].map((nation) => ({
    nation,
    kind: 'embassy' as const,
    city: 'Ciudad de Panamá',
  })),
  ...[
    'AT',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'FI',
    'GR',
    'HU',
    'IE',
    'LV',
    'LT',
    'LU',
    'RO',
    'SK',
    'SI',
  ].map((nation) => ({ nation, kind: 'honorary' as const, city: 'Ciudad de Panamá' })),
  ...['PL', 'ES', 'SE'].map((nation) => ({
    nation,
    kind: 'honorary' as const,
    city: 'Colón (según el directorio / as listed)',
  })),
  ...['FR', 'DE', 'NL', 'ES'].map((nation) => ({
    nation,
    kind: 'honorary' as const,
    city: 'Chiriquí',
  })),
];
// Canada: official Canadian map link. Peru: the Global Bank centroid already sourced for Argentina.
// Brazil: OSM diplomatic node for the embassy (level 22), inside building way 382499499, which also
// holds the Belgian embassy node tagged "Torre Optima (PH SL55)". Approximate, not an entrance.
const missionPoints: Record<string, Pick<Embassy, 'lat' | 'lng' | 'mapSource'>> = {
  'ca-pa': {
    lat: 8.98234,
    lng: -79.509624,
    mapSource: 'https://www.openstreetmap.org/?mlat=8.98234&mlon=-79.509624',
  },
  'pe-pa': {
    lat: 8.9840877,
    lng: -79.5166915,
    mapSource: 'https://www.openstreetmap.org/way/894389293',
  },
  'br-pa': {
    lat: 8.9860282,
    lng: -79.5208315,
    mapSource: 'https://www.openstreetmap.org/node/8508442823',
  },
};
for (const mission of current) {
  const point = missionPoints[mission.id];
  if (point && mission.address && !mission.locationUnconfirmed)
    mission.map = {
      id: mission.id,
      nation: mission.nation,
      country: mission.country,
      name: mission.name,
      address: mission.address,
      source: mission.source,
      reviewedAt: mission.reviewedAt,
      ...point,
    };
}
const joined = (...parts: (Localized | undefined)[]): Localized | undefined => {
  const present = parts.filter((part): part is Localized => !!part);
  return present.length
    ? [
        present.map((part) => part[0]).join(' '),
        present.map((part) => part[1]).join(' '),
        present.map((part) => part[2]).join(' '),
      ]
    : undefined;
};
export const consularMissions: Mission[] = [
  // Each building record carries its own nationality-specific emergency note; missing notes fall back
  // to generic wording that names the mission's nation. Hours are shown with the record's note.
  ...embassies.map((e): Mission => ({
    ...e,
    kind: 'embassy',
    map: e.locationUnconfirmed ? undefined : e,
    note: joined(e.hours, e.note),
  })),
  ...current,
  ...euReferences.map((r): Mission => ({
    ...r,
    id: `eu-${r.nation}-${r.kind}-${r.city}`,
    country: 'PA',
    name: [missionKinds[r.kind][0], missionKinds[r.kind][1], missionKinds[r.kind][2]],
    source: euDirectory,
    sourceDate: '2024-10',
    historical: true,
    reviewedAt: '2026-10-12',
    note: [
      'Referencia del directorio europeo de octubre de 2024. Confirma vigencia, sede y servicios; un consulado honorario tiene funciones limitadas.',
      'Reference from the October 2024 EU directory. Confirm current status, office and services; an honorary consulate has limited functions.',
      'Referência do diretório da União Europeia de outubro de 2024. Confirme vigência, local e serviços; um consulado honorário tem funções limitadas.',
    ],
  })),
];
export function missionsFor(country: string, nation?: string) {
  return consularMissions.filter((m) => m.country === country && (!nation || m.nation === nation));
}
export function missionDirections(mission: Mission, mode: 'walking' | 'driving') {
  if (mission.locationUnconfirmed || !mission.address || mission.historical) return null;
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination: `${mission.name[0]}, ${mission.address}`, travelmode: mode })}`;
}
// Complete official source directories complement the individually transcribed entries.
export const destinationConsularDirectories: Record<
  string,
  { name: string | Localized; url: string; note?: Localized }[]
> = {
  PA: [
    {
      name: [
        'Unión Europea · embajadas y consulados honorarios',
        'European Union · embassies and honorary consulates',
        'União Europeia · embaixadas e consulados honorários',
      ],
      url: euProtection,
      note: [
        'Incluye enlace al listado de octubre de 2024. No confirma atención actual.',
        'Links to the October 2024 list. Does not confirm current services.',
        'Inclui link para a lista de outubro de 2024. Não confirma o atendimento atual.',
      ],
    },
    {
      name: 'Cancillería de Panamá · cuerpo diplomático',
      url: 'https://mire.gob.pa/cuerpo-diplomatico-2/',
      note: [
        'El PDF enlazado por la Cancillería devolvió un error al revisarlo el 12 oct 2026. Consulta al organismo si sigue sin abrir.',
        'The ministry’s linked PDF returned an error when checked Oct 12, 2026. Contact the ministry if it still fails.',
        'O PDF indicado pela Chancelaria deu erro quando foi verificado em 12 de outubro de 2026. Consulte o órgão se continuar sem abrir.',
      ],
    },
  ],
  CL: [
    {
      name: 'Cancillería de Chile · consulados extranjeros',
      url: 'https://www.consulado.gob.cl/redes/consulados-extranjeros-en-chile',
    },
  ],
  CO: [
    {
      name: 'Cancillería de Colombia · misiones acreditadas',
      url: 'https://tramites.cancilleria.gov.co/apostillalegalizacion/directorio/misionesAcreditadas.aspx',
    },
  ],
  PE: [
    {
      name: 'Cancillería del Perú · guía diplomática y consular',
      url: 'https://www.gob.pe/institucion/rree/informes-publicaciones/4735700-lista-del-cuerpo-diplomatico-organismos-internacionales-y-cuerpo-consular',
    },
  ],
  EC: [
    {
      name: 'Cancillería de Ecuador · misiones acreditadas',
      url: 'https://www.cancilleria.gob.ec/2026/06/08/misiones-extrajeras-acreditadas-en-ecuador/',
    },
  ],
  US: [
    {
      name: 'U.S. Department of State · foreign embassies & consulates',
      url: 'https://travel.state.gov/content/travel/en/consularnotification/ConsularNotificationandAccess.html',
    },
  ],
};

export function mappedMissions(country: string, nation: string): Embassy[] {
  return missionsFor(country, nation).flatMap((m) =>
    m.map && !m.historical && !m.locationUnconfirmed ? [m.map] : [],
  );
}
