import { emergencyFor } from './emergency.ts';
import type { HotelPlan, Lang } from './resources.ts';
// Who a traveler or a professional on assignment may need to reach. Stored keys stay stable.
export const contactKinds = {
  family: ['Familia o amistad', 'Family or friend'],
  hotel: ['Recepción del alojamiento', 'Accommodation reception'],
  insurance: ['Seguro o asistencia al viajero', 'Insurance or travel assistance'],
  consulate: ['Consulado o embajada', 'Consulate or embassy'],
  work: ['Empresa o empleador', 'Employer'],
  team: ['Coordinación del equipo', 'Team coordinator'],
  transport: ['Transporte o conductor', 'Driver or transport'],
  other: ['Otro contacto', 'Other contact'],
} as const;
export const contactGroups = {
  personal: ['family', 'hotel', 'insurance', 'consulate'],
  work: ['work', 'team', 'transport'],
} as const satisfies Record<string, readonly ContactKind[]>;
export type ContactKind = keyof typeof contactKinds;
export type TravelContact = {
  id: string;
  kind: ContactKind;
  name: string;
  phone: string;
  note: string;
  country: string;
};
// Only permit phone characters. Never turn arbitrary stored input into a URL.
export function phoneHref(phone: string) {
  if (!/^[+\d\s().-]+$/.test(phone)) return null;
  const clean = phone.replace(/[\s().-]/g, '');
  return /^\+?\d{4,15}$/.test(clean) ? `tel:${clean}` : null;
}
export function validContact(v: unknown): v is TravelContact {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    ['id', 'name', 'phone', 'note', 'country'].every(
      (k) => typeof r[k] === 'string' && (r[k] as string).length <= 400,
    ) &&
    typeof r.kind === 'string' &&
    Object.hasOwn(contactKinds, r.kind) &&
    !!phoneHref(r.phone as string) &&
    !!(r.name as string).trim() &&
    /^[A-Z]{2}$/.test(r.country as string)
  );
}
export function readContacts(): TravelContact[] {
  try {
    const rows = JSON.parse(localStorage.getItem('faro-contacts-v1') || '[]');
    return Array.isArray(rows) ? rows.filter(validContact).slice(0, 30) : [];
  } catch {
    return [];
  }
}
export function travelCard(
  country: string,
  lang: Lang,
  contacts: TravelContact[],
  plan: HotelPlan | null,
) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const names = new Intl.DisplayNames([lang], { type: 'region' });
  const emergency = emergencyFor(country);
  const local = contacts.filter((c) => c.country === country);
  return [
    t('FARO · FICHA DEL VIAJE', 'FARO · TRAVEL CARD'),
    names.of(country) || country,
    `${t('Exportada', 'Exported')}: ${new Date().toISOString()}`,
    t(
      'Datos personales. Guarda esta ficha de forma privada.',
      'Personal data. Keep this card private.',
    ),
    '',
    t('EMERGENCIAS LOCALES', 'LOCAL EMERGENCIES'),
    emergency
      ? emergency.numbers.map((n) => `${n.number} · ${n.label[lang === 'es' ? 0 : 1]}`).join('\n')
      : t('Sin números verificados.', 'No verified numbers.'),
    emergency?.source || '',
    t(
      'Números cortos para llamar dentro del país, no desde el extranjero.',
      'Short numbers for calls within the country, not from abroad.',
    ),
    '',
    t('CONTACTOS DEL VIAJE', 'TRAVEL CONTACTS'),
    ...local.map(
      (c) =>
        `${contactKinds[c.kind][lang === 'es' ? 0 : 1]} · ${c.name}\n${c.phone}${c.note ? '\n' + c.note : ''}`,
    ),
    '',
    plan?.country === country
      ? [
          t('PLAN PERSONAL DEL HOTEL · SIN VERIFICAR', 'PERSONAL HOTEL PLAN · UNVERIFIED'),
          plan.name,
          plan.meeting,
          plan.notes,
          t(
            'Confirma ruta y punto de encuentro con recepción.',
            'Confirm route and assembly point with reception.',
          ),
        ].join('\n')
      : '',
  ]
    .filter((v) => v !== undefined)
    .join('\n');
}
