import { emergencyFor } from './emergency.ts';
import type { HotelPlan, Lang } from './resources.ts';
import { langIndex, pick } from './i18n.ts';
// Who a traveler or a professional on assignment may need to reach. Stored keys stay stable.
export const contactKinds = {
  family: ['Familia o amistad', 'Family or friend', 'Família ou amigos'],
  hotel: ['Recepción del alojamiento', 'Accommodation reception', 'Recepção da hospedagem'],
  insurance: [
    'Seguro o asistencia al viajero',
    'Insurance or travel assistance',
    'Seguro ou assistência ao viajante',
  ],
  consulate: ['Consulado o embajada', 'Consulate or embassy', 'Consulado ou embaixada'],
  work: ['Empresa o empleador', 'Employer', 'Empresa ou empregador'],
  team: ['Coordinación del equipo', 'Team coordinator', 'Coordenação da equipe'],
  transport: ['Transporte o conductor', 'Driver or transport', 'Transporte ou motorista'],
  other: ['Otro contacto', 'Other contact', 'Outro contato'],
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
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const names = new Intl.DisplayNames([lang], { type: 'region' });
  const emergency = emergencyFor(country);
  const local = contacts.filter((c) => c.country === country);
  return [
    t('FARO · FICHA DEL VIAJE', 'FARO · TRAVEL CARD', 'FARO · FICHA DA VIAGEM'),
    names.of(country) || country,
    `${t('Exportada', 'Exported', 'Exportada')}: ${new Date().toISOString()}`,
    t(
      'Datos personales. Guarda esta ficha de forma privada.',
      'Personal data. Keep this card private.',
      'Dados pessoais. Guarde esta ficha de forma privada.',
    ),
    '',
    t('EMERGENCIAS LOCALES', 'LOCAL EMERGENCIES', 'EMERGÊNCIAS LOCAIS'),
    emergency
      ? emergency.numbers.map((n) => `${n.number} · ${n.label[langIndex(lang)]}`).join('\n')
      : t('Sin números verificados.', 'No verified numbers.', 'Sem números verificados.'),
    emergency?.source || '',
    t(
      'Números cortos para llamar dentro del país, no desde el extranjero.',
      'Short numbers for calls within the country, not from abroad.',
      'Números curtos para ligar dentro do país, não do exterior.',
    ),
    '',
    t('CONTACTOS DEL VIAJE', 'TRAVEL CONTACTS', 'CONTATOS DA VIAGEM'),
    ...local.map(
      (c) =>
        `${contactKinds[c.kind][langIndex(lang)]} · ${c.name}\n${c.phone}${c.note ? '\n' + c.note : ''}`,
    ),
    '',
    plan?.country === country
      ? [
          t(
            'PLAN PERSONAL DEL HOTEL · SIN VERIFICAR',
            'PERSONAL HOTEL PLAN · UNVERIFIED',
            'PLANO PESSOAL DO HOTEL · NÃO VERIFICADO',
          ),
          plan.name,
          plan.meeting,
          plan.notes,
          t(
            'Confirma ruta y punto de encuentro con recepción.',
            'Confirm route and assembly point with reception.',
            'Confirme a rota e o ponto de encontro com a recepção.',
          ),
        ].join('\n')
      : '',
  ]
    .filter((v) => v !== undefined)
    .join('\n');
}
