export type TravelerStatus = 'ok' | 'moving' | 'help';
export type CheckIn = {
  id: string;
  status: TravelerStatus;
  name: string;
  place: string;
  note: string;
  contact: string;
  at: number;
  nextAt: number | null;
};
export const statusLabels: Record<TravelerStatus, [string, string]> = {
  ok: ['Estoy bien', "I'm OK"],
  moving: ['Me estoy trasladando', "I'm on the move"],
  help: ['Necesito ayuda', 'I need help'],
};
export function validCheckIn(value: unknown): value is CheckIn {
  const v = value as CheckIn;
  const fields = value as Record<string, unknown>;
  const validTime = (at: number) => Number.isFinite(at) && at > 0 && at <= 8640000000000000;
  return (
    !!v &&
    Object.hasOwn(statusLabels, v.status) &&
    ['id', 'name', 'place', 'note', 'contact'].every(
      (k) => typeof fields[k] === 'string' && (fields[k] as string).length <= 1000,
    ) &&
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
export function checkInMessage(record: CheckIn, lang: 'es' | 'en', zone?: string) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const status = statusLabels[record.status][lang === 'es' ? 0 : 1];
  return [
    `${record.name ? `${t('Soy', 'This is')} ${record.name}. ` : ''}${status}.`,
    record.place ? `${t('Estoy en', "I'm at")} ${record.place}.` : '',
    record.note,
    record.nextAt
      ? `${t('Volveré a escribir antes de', "I'll check in again by")} ${checkInTime(record.nextAt, lang, zone)}.`
      : '',
    record.contact ? `${t('Si no respondo', 'If I do not reply')}: ${record.contact}` : '',
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
