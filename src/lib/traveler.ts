import { displayPlace, type CatalogId } from './domain.ts';
import { langIndex, pick, type Lang, type Localized } from './i18n.ts';
export const contextLabels = {
  earthquake: ['Sismo', 'Earthquake', 'Terremoto'],
  storm: ['Huracán o tormenta', 'Hurricane or storm', 'Furacão ou tempestade'],
  flood: ['Inundación', 'Flooding', 'Inundação'],
  evacuation: ['Evacuación', 'Evacuation', 'Evacuação'],
  emergency: ['Otra emergencia', 'Other emergency', 'Outra emergência'],
  update: ['Actualización del viaje', 'Travel update', 'Atualização da viagem'],
} as const;
export const connectionLabels = {
  available: ['Puedo recibir mensajes', 'I can receive messages', 'Posso receber mensagens'],
  limited: [
    'Tengo señal intermitente',
    'My signal is intermittent',
    'Estou com sinal intermitente',
  ],
  battery: ['Me queda poca batería', 'My battery is low', 'Estou com pouca bateria'],
} as const;
export type MessageContext = keyof typeof contextLabels;
// Opening sentence for each reason; the person chooses it, Faro never infers it.
const reasons: Record<MessageContext, Localized> = {
  earthquake: [
    'Les escribo por el sismo.',
    "I'm checking in about the earthquake.",
    'Estou escrevendo por causa do terremoto.',
  ],
  storm: [
    'Les escribo por el huracán o la tormenta.',
    "I'm checking in about the hurricane or storm.",
    'Estou escrevendo por causa do furacão ou da tempestade.',
  ],
  flood: [
    'Les escribo por la inundación.',
    "I'm checking in about the flooding.",
    'Estou escrevendo por causa da inundação.',
  ],
  evacuation: [
    'Les escribo por una evacuación.',
    "I'm checking in about an evacuation.",
    'Estou escrevendo por causa de uma evacuação.',
  ],
  emergency: [
    'Les escribo por la emergencia.',
    "I'm checking in about the emergency.",
    'Estou escrevendo por causa da emergência.',
  ],
  update: [
    'Les cuento cómo va mi viaje.',
    "Here's an update on my trip.",
    'Passando para dar notícias da minha viagem.',
  ],
};
export type Connection = keyof typeof connectionLabels;
// In the message, each connection state says what it means for the people reading it.
const connectionSentences: Record<Connection, Localized> = {
  available: ['Puedo recibir mensajes.', 'I can receive messages.', 'Posso receber mensagens.'],
  limited: [
    'Tengo señal intermitente: puede que tarde en responder.',
    'My signal comes and goes, so I may be slow to reply.',
    'Estou com sinal intermitente: posso demorar para responder.',
  ],
  battery: [
    'Me queda poca batería: puede que no responda.',
    'My battery is low, so I may not reply.',
    'Estou com pouca bateria: talvez eu não responda.',
  ],
};
// Reasons that are an emergency, as opposed to a travel update.
const EMERGENCY_CONTEXTS: readonly string[] = [
  'earthquake',
  'storm',
  'flood',
  'evacuation',
  'emergency',
];
export type EventReference = {
  source: CatalogId;
  place: string;
  mag: number | null;
  time: number;
};
export type TravelerStatus = 'ok' | 'moving' | 'help';
export type CheckIn = {
  id: string;
  status: TravelerStatus;
  name: string;
  place: string;
  note: string;
  contact: string;
  phone?: string;
  email?: string;
  at: number;
  nextAt: number | null;
  context?: MessageContext;
  destination?: string;
  companions?: string;
  needs?: string;
  connection?: Connection | '';
  event?: EventReference | null;
};
export const statusLabels: Record<TravelerStatus, Localized> = {
  ok: ['Estoy bien', "I'm OK", 'Estou bem'],
  moving: ['Me estoy trasladando', "I'm on the move", 'Estou me deslocando'],
  help: ['Necesito ayuda', 'I need help', 'Preciso de ajuda'],
};
export function validCheckIn(value: unknown): value is CheckIn {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as CheckIn;
  const fields = value as Record<string, unknown>;
  const validTime = (at: number) => Number.isFinite(at) && at > 0 && at <= 8640000000000000;
  return (
    !!v &&
    Object.hasOwn(statusLabels, v.status) &&
    ['id', 'name', 'place', 'note', 'contact'].every(
      (k) => typeof fields[k] === 'string' && (fields[k] as string).length <= 1000,
    ) &&
    (v.context === undefined || Object.hasOwn(contextLabels, v.context)) &&
    (v.connection === undefined ||
      v.connection === '' ||
      Object.hasOwn(connectionLabels, v.connection)) &&
    ['destination', 'companions', 'needs', 'phone', 'email'].every(
      (k) =>
        fields[k] === undefined ||
        (typeof fields[k] === 'string' && (fields[k] as string).length <= 1000),
    ) &&
    (v.event == null ||
      (typeof v.event === 'object' &&
        ['IGC', 'USGS', 'EMSC'].includes(v.event.source) &&
        typeof v.event.place === 'string' &&
        v.event.place.length <= 1000 &&
        (v.event.mag === null ||
          (Number.isFinite(v.event.mag) && v.event.mag >= -2 && v.event.mag <= 10)) &&
        validTime(v.event.time))) &&
    validTime(v.at) &&
    (v.nextAt === null || (validTime(v.nextAt) && v.nextAt > v.at))
  );
}
export function readCheckIns(): CheckIn[] {
  try {
    const data = JSON.parse(localStorage.getItem('faro-checkins-v1') || '[]');
    return Array.isArray(data) ? data.filter(validCheckIn).slice(0, 10) : [];
  } catch {
    return [];
  }
}
export function checkInDue(record: CheckIn | undefined, now: number) {
  return !!record && record.nextAt !== null && now >= record.nextAt;
}
export function checkInTime(at: number, lang: Lang, zone?: string) {
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
    timeZone: zone,
  }).format(at);
}
function deadlineLabel(record: CheckIn, lang: Lang, zone?: string) {
  if (!record.nextAt) return '';
  const day = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: zone,
  });
  const time = new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
    timeZone: zone,
  }).format(record.nextAt);
  return day.format(record.at) === day.format(record.nextAt)
    ? time
    : `${time} (${new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: zone }).format(record.nextAt)})`;
}
export function checkInMessage(record: CheckIn, lang: Lang, zone?: string) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const status = statusLabels[record.status][langIndex(lang)];
  const sentence = (value: string) =>
    /[.!?…]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`;
  const reason = record.context ? reasons[record.context][langIndex(lang)] : '';
  const emergency = !!record.context && EMERGENCY_CONTEXTS.includes(record.context);
  const location = [
    record.place ? sentence(`${t('Estoy en', "I'm at", 'Onde estou:')} ${record.place}`) : '',
    record.companions
      ? sentence(`${t('Estoy con', "I'm with", 'Estou com')} ${record.companions}`)
      : '',
    record.status === 'moving' && record.destination
      ? sentence(`${t('Me dirijo a', "I'm heading to", 'Estou indo para:')} ${record.destination}`)
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  return [
    [record.name ? `${t('Soy', 'This is', 'Aqui é')} ${record.name}.` : '', `${status}.`, reason]
      .filter(Boolean)
      .join(' '),
    location,
    record.note,
    record.status === 'help' && record.needs ? sentence(record.needs) : '',
    [
      record.connection ? connectionSentences[record.connection][langIndex(lang)] : '',
      // Red Cross "Safe and Well" wording: say when you will write again, or that you will, so
      // even a bare "I'm OK" tells the family what comes next.
      record.nextAt
        ? `${t('Volveré a escribir a más tardar a las', "I'll write again by", 'Volto a escrever até as')} ${deadlineLabel(record, lang, zone)}.`
        : emergency || record.status !== 'help'
          ? t(
              'Volveré a escribir cuando pueda.',
              "I'll write again when I can.",
              'Volto a escrever quando puder.',
            )
          : '',
    ]
      .filter(Boolean)
      .join(' '),
    record.phone ? `${t('Mi teléfono', 'My phone', 'Meu telefone')}: ${record.phone}` : '',
    record.email ? `${t('Mi correo', 'My email', 'Meu e-mail')}: ${record.email}` : '',
    record.contact
      ? sentence(
          `${t('Si no respondo, contacten a', "If I don't reply, contact", 'Se eu não responder, falem com')} ${record.contact}`,
        )
      : '',
    // FCC/FEMA guidance: texts get through when calls do not, and calls congest the network.
    record.status === 'help'
      ? t(
          'Respondan apenas lo vean para coordinar la ayuda.',
          'Please reply as soon as you see this so we can arrange help.',
          'Respondam assim que virem esta mensagem para combinarmos a ajuda.',
        )
      : emergency || record.status === 'moving'
        ? t(
            'Si pueden, respondan con un mensaje de texto. No hace falta llamar: las líneas pueden estar saturadas.',
            'If you can, reply by text. No need to call: phone lines may be busy.',
            'Se puderem, respondam por mensagem de texto. Não precisa ligar: as linhas podem estar congestionadas.',
          )
        : '',
    // The official record, as context: the person's own status is stated above.
    record.context === 'earthquake' && record.event
      ? `${t(`Como referencia, el sismo según ${record.event.source}`, `For reference, the earthquake as reported by ${record.event.source}`, `Como referência, o terremoto segundo o ${record.event.source}`)}: ${record.event.mag === null ? t('magnitud no informada', 'magnitude not reported', 'magnitude não informada') : `${t('magnitud', 'magnitude', 'magnitude')} ${record.event.mag.toFixed(1)}`}, ${displayPlace(record.event.place)}, ${checkInTime(record.event.time, lang, zone)}.`
      : '',
    `${t('Actualizado', 'Updated', 'Atualizado')}: ${checkInTime(record.at, lang, zone)}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
// A prior saved report is never a newly prepared message. Time also invalidates sharing.
export function canShareCheckIn(record: CheckIn | null, dirty: boolean, now: number) {
  return (
    !!record &&
    !dirty &&
    now >= record.at &&
    now - record.at < 15 * 60000 &&
    !checkInDue(record, now)
  );
}
