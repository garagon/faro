import { displayPlace } from './domain.ts';
export const contextLabels = {
  earthquake: ['Por el sismo', 'About the earthquake'],
  evacuation: ['Por una evacuación', 'About an evacuation'],
  update: ['Una actualización del viaje', 'A travel update'],
} as const;
export const connectionLabels = {
  available: ['Puedo recibir mensajes', 'I can receive messages'],
  limited: ['Tengo señal intermitente', 'My signal is intermittent'],
  battery: ['Me queda poca batería', 'My battery is low'],
} as const;
export type MessageContext = keyof typeof contextLabels;
export type Connection = keyof typeof connectionLabels;
export type EventReference = {
  source: 'IGC' | 'USGS';
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
export const statusLabels: Record<TravelerStatus, [string, string]> = {
  ok: ['Estoy bien', "I'm OK"],
  moving: ['Me estoy trasladando', "I'm on the move"],
  help: ['Necesito ayuda', 'I need help'],
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
        ['IGC', 'USGS'].includes(v.event.source) &&
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
export function checkInTime(at: number, lang: 'es' | 'en', zone?: string) {
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
function deadlineLabel(record: CheckIn, lang: 'es' | 'en', zone?: string) {
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
export function checkInMessage(record: CheckIn, lang: 'es' | 'en', zone?: string) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const status = statusLabels[record.status][lang === 'es' ? 0 : 1];
  const sentence = (value: string) =>
    /[.!?…]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`;
  const reason =
    record.context === 'earthquake'
      ? t('Les escribo por el sismo.', "I'm checking in about the earthquake.")
      : record.context === 'evacuation'
        ? t('Les escribo por una evacuación.', "I'm checking in about an evacuation.")
        : record.context === 'update'
          ? t('Les cuento cómo va mi viaje.', "Here's an update on my trip.")
          : '';
  const location = [
    record.place ? sentence(`${t('Estoy en', "I'm at")} ${record.place}`) : '',
    record.companions ? sentence(`${t('Estoy con', "I'm with")} ${record.companions}`) : '',
    record.status === 'moving' && record.destination
      ? sentence(`${t('Me dirijo a', "I'm heading to")} ${record.destination}`)
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  return [
    [record.name ? `${t('Soy', 'This is')} ${record.name}.` : '', `${status}.`, reason]
      .filter(Boolean)
      .join(' '),
    location,
    record.status === 'help' && record.needs ? sentence(record.needs) : '',
    [
      record.connection ? `${connectionLabels[record.connection][lang === 'es' ? 0 : 1]}.` : '',
      record.nextAt
        ? `${t('Volveré a escribir a más tardar a las', "I'll check in again by")} ${deadlineLabel(record, lang, zone)}.`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
    record.note,
    record.phone ? `${t('Mi teléfono', 'My phone')}: ${record.phone}` : '',
    record.email ? `${t('Mi correo', 'My email')}: ${record.email}` : '',
    record.contact ? `${t('Si no respondo', 'If I do not reply')}: ${record.contact}` : '',
    record.status === 'help'
      ? t('Por favor, respondan para coordinar la ayuda.', 'Please reply so we can arrange help.')
      : record.context
        ? t(
            'Por favor, confirmen que recibieron este mensaje.',
            'Please let me know you received this message.',
          )
        : '',
    record.context === 'earthquake' && record.event
      ? `${t('Reporte de referencia', 'Reference report')}: ${record.event.source} · ${record.event.mag === null ? t('magnitud no informada', 'magnitude not reported') : `M ${record.event.mag.toFixed(1)}`} · ${displayPlace(record.event.place)} · ${checkInTime(record.event.time, lang, zone)}. ${t('Es un dato del catálogo, no una medida de cómo me afectó.', 'This is a catalogue record, not a measure of how I was affected.')}`
      : '',
    `${t('Actualizado', 'Updated')}: ${checkInTime(record.at, lang, zone)}`,
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
