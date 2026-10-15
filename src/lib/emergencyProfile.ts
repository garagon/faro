import { writeLocal, removeLocal } from './browserStorage.ts';
import { emergencyFor } from './emergency.ts';
import type { Preferences } from './preferences.ts';
import type { HotelPlan } from './resources.ts';
import { pick, type Lang } from './i18n.ts';

/**
 * Details a traveler may want at hand in an emergency. Every field is optional and stays in
 * this browser. Health details are left out of the shared card unless the person includes them.
 */
export type EmergencyInfo = {
  version: 1;
  contact: { name: string; relation: string; phone: string };
  health: {
    allergies: string;
    conditions: string;
    medications: string;
    bloodType: string;
    share: boolean;
  };
  insurance: { company: string; policy: string; phone: string };
  stay: { address: string; arrival: string; departure: string };
  savedAt: number;
};

export const EMERGENCY_INFO_KEY = 'faro-emergency-info-v1';
export const bloodTypes = ['', 'O+', 'O−', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−'] as const;

export function emptyEmergencyInfo(): EmergencyInfo {
  return {
    version: 1,
    contact: { name: '', relation: '', phone: '' },
    health: { allergies: '', conditions: '', medications: '', bloodType: '', share: false },
    insurance: { company: '', policy: '', phone: '' },
    stay: { address: '', arrival: '', departure: '' },
    savedAt: 0,
  };
}

// Text fields: bounded length and no control characters other than line breaks and tabs.
const text = (v: unknown, max: number) =>
  typeof v === 'string' &&
  v.length <= max &&
  [...v].every((ch) => ch >= ' ' || ch === '\n' || ch === '\t');
const phone = (v: unknown) =>
  typeof v === 'string' && (v === '' || /^\+?[\d\s().-]{4,30}$/.test(v.trim()));
// A real calendar day: the pattern alone accepts 2026-13-45, which later breaks formatting.
const realDay = (v: string) => {
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
const date = (v: unknown) =>
  typeof v === 'string' && (v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && realDay(v)));

/** Accepts only the stored shape; anything else is treated as no saved details. */
export function parseEmergencyInfo(raw: string | null): EmergencyInfo | null {
  try {
    const v = JSON.parse(raw || 'null') as Partial<EmergencyInfo> | null;
    if (!v || v.version !== 1 || typeof v !== 'object') return null;
    const { contact: c, health: h, insurance: i, stay: s } = v;
    if (!c || !h || !i || !s) return null;
    const ok =
      text(c.name, 80) &&
      text(c.relation, 40) &&
      phone(c.phone) &&
      text(h.allergies, 300) &&
      text(h.conditions, 300) &&
      text(h.medications, 300) &&
      (bloodTypes as readonly string[]).includes(h.bloodType as string) &&
      typeof h.share === 'boolean' &&
      text(i.company, 80) &&
      text(i.policy, 60) &&
      phone(i.phone) &&
      text(s.address, 200) &&
      date(s.arrival) &&
      date(s.departure) &&
      Number.isFinite(v.savedAt);
    return ok ? (v as EmergencyInfo) : null;
  } catch {
    return null;
  }
}

export function readEmergencyInfo(): EmergencyInfo | null {
  try {
    return parseEmergencyInfo(localStorage.getItem(EMERGENCY_INFO_KEY));
  } catch {
    return null;
  }
}

export function storeEmergencyInfo(info: EmergencyInfo) {
  writeLocal(EMERGENCY_INFO_KEY, JSON.stringify({ ...info, savedAt: Date.now() }));
}

export function forgetEmergencyInfo() {
  removeLocal(EMERGENCY_INFO_KEY);
}

export function validEmergencyPhone(value: string) {
  return phone(value);
}

/**
 * The shareable card as plain text that reads well in WhatsApp, Telegram, SMS or email:
 * one fact per line, only lines with data.
 */
export function fichaText(
  lang: Lang,
  data: {
    country: string;
    profile: Pick<Preferences, 'name' | 'nationality' | 'phone' | 'email'> | null;
    info: EmergencyInfo;
    plan: Pick<HotelPlan, 'name' | 'meeting'> | null;
  },
): string {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const names = new Intl.DisplayNames([lang], { type: 'region' });
  // Never throws: an unreadable date is left out of the card instead of breaking the screen.
  // Portuguese short months end in a period ("out."), which would double the sentence's final one.
  const day = (iso: string) => {
    const d = new Date(iso + 'T12:00:00Z');
    const month = lang === 'pt' ? 'long' : 'short';
    return iso && !Number.isNaN(d.getTime())
      ? new Intl.DateTimeFormat(lang, { day: 'numeric', month, timeZone: 'UTC' }).format(d)
      : '';
  };
  const join = (...parts: string[]) =>
    parts
      .map((p) => p.trim())
      .filter(Boolean)
      .join(', ');
  const { profile, info, plan, country } = data;
  const name = profile?.name?.trim();
  const place = country && country !== 'WORLD' ? names.of(country) : '';
  const lines: string[] = [
    name
      ? t(
          `Ficha de emergencia de ${name}`,
          `Emergency card for ${name}`,
          `Ficha de emergência de ${name}`,
        )
      : t('Ficha de emergencia', 'Emergency card', 'Ficha de emergência'),
  ];
  const who = join(
    profile?.nationality
      ? t(
          `Nacionalidad: ${names.of(profile.nationality)}`,
          `Nationality: ${names.of(profile.nationality)}`,
          `Nacionalidade: ${names.of(profile.nationality)}`,
        )
      : '',
    place ? t(`de viaje en ${place}`, `traveling in ${place}`, `destino: ${place}`) : '',
  );
  if (who) lines.push(who.charAt(0).toUpperCase() + who.slice(1) + '.');
  const reach = join(
    profile?.phone
      ? t(`Teléfono ${profile.phone}`, `Phone ${profile.phone}`, `Telefone ${profile.phone}`)
      : '',
    profile?.email
      ? t(`correo ${profile.email}`, `email ${profile.email}`, `e-mail ${profile.email}`)
      : '',
  );
  if (reach) lines.push(reach + '.');
  const c = info.contact;
  if (c.name.trim() || c.phone.trim())
    lines.push(
      t('Contacto de emergencia: ', 'Emergency contact: ', 'Contato de emergência: ') +
        join(c.relation.trim() ? `${c.name.trim()} (${c.relation.trim()})` : c.name, c.phone) +
        '.',
    );
  const ins = info.insurance;
  if (ins.company.trim() || ins.policy.trim() || ins.phone.trim())
    lines.push(
      t('Seguro de viaje: ', 'Travel insurance: ', 'Seguro viagem: ') +
        join(
          ins.company,
          ins.policy
            ? t(
                `póliza ${ins.policy.trim()}`,
                `policy ${ins.policy.trim()}`,
                `apólice ${ins.policy.trim()}`,
              )
            : '',
          ins.phone
            ? t(
                `asistencia ${ins.phone.trim()}`,
                `assistance ${ins.phone.trim()}`,
                `assistência ${ins.phone.trim()}`,
              )
            : '',
        ) +
        '.',
    );
  const s = info.stay;
  const dates =
    day(s.arrival) && day(s.departure)
      ? t(
          `del ${day(s.arrival)} al ${day(s.departure)}`,
          `${day(s.arrival)} to ${day(s.departure)}`,
          `de ${day(s.arrival)} a ${day(s.departure)}`,
        )
      : day(s.arrival)
        ? t(`desde el ${day(s.arrival)}`, `from ${day(s.arrival)}`, `a partir de ${day(s.arrival)}`)
        : day(s.departure)
          ? t(
              `hasta el ${day(s.departure)}`,
              `until ${day(s.departure)}`,
              `até ${day(s.departure)}`,
            )
          : '';
  if (plan?.name.trim() || s.address.trim() || dates)
    lines.push(
      t('Alojamiento: ', 'Staying at: ', 'Hospedagem: ') +
        join(plan?.name ?? '', s.address, dates) +
        '.',
    );
  if (plan?.meeting.trim())
    lines.push(
      t('Punto de encuentro: ', 'Meeting point: ', 'Ponto de encontro: ') +
        plan.meeting.trim() +
        '.',
    );
  const h = info.health;
  if (h.share) {
    const health = join(
      h.allergies
        ? t(
            `alergias: ${h.allergies.trim()}`,
            `allergies: ${h.allergies.trim()}`,
            `alergias: ${h.allergies.trim()}`,
          )
        : '',
      h.conditions
        ? t(
            `condiciones: ${h.conditions.trim()}`,
            `conditions: ${h.conditions.trim()}`,
            `condições: ${h.conditions.trim()}`,
          )
        : '',
      h.medications
        ? t(
            `medicamentos: ${h.medications.trim()}`,
            `medication: ${h.medications.trim()}`,
            `medicamentos: ${h.medications.trim()}`,
          )
        : '',
      h.bloodType
        ? t(
            `grupo sanguíneo ${h.bloodType}`,
            `blood type ${h.bloodType}`,
            `tipo sanguíneo ${h.bloodType}`,
          )
        : '',
    );
    if (health) lines.push(t('Salud: ', 'Health: ', 'Saúde: ') + health + '.');
  }
  const local = emergencyFor(country)?.numbers[0];
  if (local && place)
    lines.push(
      t(
        // Someone abroad who dials it reaches their own emergency service: said in the line.
        `Emergencias en ${place}: ${local.number} (desde un teléfono en ${place}).`,
        `Emergency number in ${place}: ${local.number} (from a phone in ${place}).`,
        `Número de emergência · ${place}: ${local.number} (de um telefone no país).`,
      ),
    );
  return lines.join('\n');
}
