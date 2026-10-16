import { consularDirectories } from '../data/consularDirectories.ts';
import type { Localized } from './i18n.ts';
export type Embassy = {
  id: string;
  nation: string;
  country: string;
  name: Localized;
  address: string;
  lat: number;
  lng: number;
  source: string;
  mapSource: string;
  phone?: string;
  emergency?: string;
  emergencySource?: string;
  locationUnconfirmed?: boolean;
  emergencyNote?: Localized;
  reviewedAt: string;
  hours?: Localized;
  note?: Localized;
};
// Addresses checked with the sending states. Coordinates are approximate OSM building centroids, not entrances.
// emergencyNote is specific to each sending state; never reuse one nationality's wording for another.
export const embassies: Embassy[] = [
  {
    id: 'ar-pa',
    nation: 'AR',
    country: 'PA',
    name: [
      'Embajada y sección consular de Argentina',
      'Embassy and consular section of Argentina',
      'Embaixada e setor consular da Argentina',
    ],
    address: 'Calle 50, Edificio Global Bank, piso 24, Panamá',
    lat: 8.9840877,
    lng: -79.5166915,
    source: 'https://epnma.cancilleria.gob.ar/es/contacto-sede',
    mapSource: 'https://www.openstreetmap.org/way/894389293',
    phone: '+5073020003',
    emergency: '+50766161112',
    emergencySource: 'https://epnma.cancilleria.gob.ar/es/emergencia-celular-de-guardia',
    emergencyNote: [
      'Celular de guardia fuera del horario de atención. Solo emergencias graves de ciudadanos argentinos en Panamá: catástrofes, detenciones, accidentes graves, hospitalizaciones o fallecimientos, entre otras. Para otros casos, escribe a la sección consular.',
      'On-call mobile outside public service hours. Only serious emergencies involving Argentine citizens in Panama: disasters, arrests, serious accidents, hospitalization or death, among others. For other matters, email the consular section.',
      'Celular de plantão fora do horário de atendimento. Somente emergências graves de cidadãos argentinos no Panamá: catástrofes, detenções, acidentes graves, internações ou falecimentos, entre outras. Para outros casos, escreva para o setor consular.',
    ],
    reviewedAt: '2026-10-13',
    hours: [
      'Sección consular: lunes a viernes, 08:00–13:00, con cita previa (hora de Panamá).',
      'Consular section: Monday–Friday, 08:00–13:00, by appointment (Panama time).',
      'Setor consular: segunda a sexta, 08:00–13:00, com agendamento prévio (horário do Panamá).',
    ],
  },
  {
    id: 'co-pa',
    nation: 'CO',
    country: 'PA',
    name: ['Embajada de Colombia', 'Embassy of Colombia', 'Embaixada da Colômbia'],
    address: 'Punta Pacífica, Edificio Oceanía, Torre 2000, piso 17, oficina 17C, Panamá',
    lat: 8.9809386,
    lng: -79.5099599,
    source: 'https://panama.embajada.gov.co/acerca/atencion_usuario',
    mapSource: 'https://www.openstreetmap.org/way/785971625',
    reviewedAt: '2026-10-11',
    note: [
      'La sección consular atiende en otra dirección. Consulta la fuente antes de ir.',
      'The consular section is at another address. Check the source before traveling.',
      'O setor consular atende em outro endereço. Consulte a fonte antes de ir.',
    ],
  },
  {
    id: 'us-pa',
    phone: '+5073175000',
    emergency: '+5073175000',
    nation: 'US',
    country: 'PA',
    name: [
      'Embajada de Estados Unidos',
      'Embassy of the United States',
      'Embaixada dos Estados Unidos',
    ],
    address: 'Avenida Demetrio Basilio Lakas, edificio 783, Clayton, Panamá',
    lat: 8.9984337,
    lng: -79.5612701,
    source: 'https://pa.usembassy.gov/contact/',
    mapSource: 'https://www.openstreetmap.org/way/300882164',
    emergencySource: 'https://pa.usembassy.gov/contact/',
    emergencyNote: [
      'Urgencias de ciudadanos estadounidenses, también fuera del horario de oficina: llama y sigue las instrucciones para llamadas de emergencia.',
      'U.S. citizens’ emergencies, including after hours: call and follow the instructions for emergency calls.',
      'Emergências de cidadãos norte-americanos, inclusive fora do horário de expediente: ligue e siga as instruções para chamadas de emergência.',
    ],
    reviewedAt: '2026-10-13',
    note: [
      'Los trámites consulares requieren cita; en una urgencia, llama primero. Cerrada en los feriados de Panamá y de EE. UU.',
      'Consular services require an appointment; in an emergency, call first. Closed on Panamanian and U.S. holidays.',
      'Os serviços consulares exigem agendamento; em uma emergência, ligue primeiro. Fechada nos feriados do Panamá e dos EUA.',
    ],
  },
  {
    id: 'mx-pa',
    nation: 'MX',
    country: 'PA',
    name: ['Embajada de México', 'Embassy of Mexico', 'Embaixada do México'],
    address: 'Av. Samuel Lewis y Calle 58, edificio ADR, piso 10, Obarrio, Panamá',
    lat: 8.986889,
    lng: -79.5184137,
    source: 'https://embamex.sre.gob.mx/panama/index.php/contacto',
    mapSource: 'https://www.openstreetmap.org/way/382503815',
    reviewedAt: '2026-10-11',
  },
  {
    id: 'es-pa',
    locationUnconfirmed: true,
    phone: '+5072071500',
    emergency: '+50764300642',
    nation: 'ES',
    country: 'PA',
    name: ['Embajada de España', 'Embassy of Spain', 'Embaixada da Espanha'],
    address: 'Palacio de España, Plaza Belisario Porras, Av. Perú y Calle 33 A, Panamá',
    lat: 8.9695274,
    lng: -79.5368682,
    source: 'https://www.exteriores.gob.es/Embajadas/panama/es/Embajada/Paginas/Contacto.aspx',
    mapSource: 'https://www.openstreetmap.org/way/157402115',
    emergencyNote: [
      'Urgencias de ciudadanos españoles fuera del horario de oficina.',
      'Spanish citizens’ emergencies outside office hours.',
      'Emergências de cidadãos espanhóis fora do horário de expediente.',
    ],
    reviewedAt: '2026-10-12',
    note: [
      'Existe un traslado provisional anunciado sin fecha: confirma la sede antes de salir.',
      'A temporary move has been announced without a date: confirm the location before leaving.',
      'Foi anunciada uma mudança provisória de endereço, sem data: confirme o local antes de sair.',
    ],
  },
];
export function directionsUrl(e: Embassy, mode: 'walking' | 'driving') {
  const q = new URLSearchParams({
    api: '1',
    destination: `${e.name[0]}, ${e.address}`,
    travelmode: mode,
  });
  return `https://www.google.com/maps/dir/?${q}`;
}

export function embassyFor(country: string, nationality: string): Embassy | undefined {
  return embassies.find((e) => e.country === country && e.nation === nationality);
}

export function consularFallback(
  country: string,
  nationality: string,
): { url: string; label: Localized; note?: Localized } | null {
  if (country === 'PA' && nationality === 'CL')
    return {
      url: 'https://www.consulado.gob.cl/emergencia-panama',
      label: [
        'Asistencia a chilenos en Panamá',
        'Assistance for Chileans in Panama',
        'Assistência a chilenos no Panamá',
      ],
      note: [
        'Información de la Cancillería de Chile publicada el 9 oct 2026. Consulta la página para ver sus canales y formularios.',
        'Chile’s foreign ministry information published Oct 9, 2026. See the page for channels and forms.',
        'Informação da Chancelaria do Chile publicada em 9 de outubro de 2026. Consulte a página para ver os canais e formulários.',
      ],
    };
  if (Object.hasOwn(consularDirectories, nationality)) return consularDirectories[nationality];
  if (country === 'CL' && nationality)
    return {
      url: 'https://www.consulado.gob.cl/redes/consulados-extranjeros-en-chile',
      label: [
        'Directorio oficial de consulados en Chile',
        'Official directory of consulates in Chile',
        'Diretório oficial de consulados no Chile',
      ],
    };
  return null;
}
