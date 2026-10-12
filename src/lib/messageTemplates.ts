import type { Connection, MessageContext, TravelerStatus } from './traveler.ts';
// Suggestions are inserted only after an explicit choice and remain editable.
export const helpTemplates = [
  {
    id: 'call',
    label: ['Que me llamen', 'Call me'],
    text: ['Por favor, llámame para coordinar la ayuda.', 'Please call me so we can arrange help.'],
  },
  {
    id: 'pickup',
    label: ['Que me recojan', 'Pick me up'],
    text: [
      'Necesito que me recojan. Confirmen conmigo el lugar antes de salir.',
      'I need someone to pick me up. Confirm the location with me before leaving.',
    ],
  },
  {
    id: 'insurance',
    label: ['Contactar al seguro', 'Contact my insurer'],
    text: [
      'Necesito ayuda para contactar a mi seguro de viaje.',
      'I need help contacting my travel insurer.',
    ],
  },
] as const;

// Ready-made messages fill the form only after the person picks one. A preset fills only what
// its label states, never overwrites text the person wrote, and every field stays editable.
type Pair = readonly [string, string];
type Lang = 'es' | 'en';
export type QuickMessage = {
  id: string;
  label: Pair;
  status: TravelerStatus;
  context: MessageContext;
  connection?: Connection;
  note?: Pair;
  needs?: Pair;
  companions?: Pair;
};
export const quickMessages: readonly QuickMessage[] = [
  {
    id: 'safe',
    label: ['Estoy bien, sin heridas', "I'm OK, not injured"],
    status: 'ok',
    context: 'earthquake',
    note: ['No tengo heridas.', "I'm not injured."],
  },
  {
    id: 'team',
    label: ['Estoy bien, con mi equipo', "I'm OK, with my team"],
    status: 'ok',
    context: 'earthquake',
    companions: ['mi equipo de trabajo', 'my team'],
  },
  {
    id: 'signal',
    label: ['Estoy bien, con poca señal', "I'm OK, poor signal"],
    status: 'ok',
    context: 'earthquake',
    connection: 'limited',
    note: ['Puede que tarde en responder.', 'I may be slow to reply.'],
  },
  {
    id: 'evacuating',
    label: ['Estoy evacuando', "I'm evacuating"],
    status: 'moving',
    context: 'evacuation',
  },
  {
    id: 'medical',
    label: ['Necesito atención médica', 'I need medical care'],
    status: 'help',
    context: 'earthquake',
    needs: ['Necesito atención médica.', 'I need medical care.'],
  },
  {
    id: 'stranded',
    label: ['No puedo salir de donde estoy', "I can't leave where I am"],
    status: 'help',
    context: 'earthquake',
    needs: [
      'No puedo salir del lugar donde estoy. Por favor, avisen a los servicios de emergencia.',
      "I can't leave where I am. Please alert emergency services.",
    ],
  },
];
export type QuickFields = {
  status: TravelerStatus | '';
  context: MessageContext;
  connection: Connection | '';
  note: string;
  needs: string;
  companions: string;
};
const TEXT_FIELDS = ['note', 'needs', 'companions'] as const;
const pick = (pair: Pair | undefined, lang: Lang) => (pair ? pair[lang === 'es' ? 0 : 1] : '');
/** Applies a preset on top of the current form without discarding text the person wrote. */
export function applyQuickMessage(
  current: QuickFields,
  next: QuickMessage,
  previous: QuickMessage | null,
  lang: Lang,
): QuickFields {
  const result: QuickFields = { ...current, status: next.status, context: next.context };
  for (const field of TEXT_FIELDS) {
    const value = current[field].trim();
    const ownedByPreset = !value || (!!previous && value === pick(previous[field], lang));
    if (!ownedByPreset) continue;
    result[field] = field === 'needs' && next.status !== 'help' ? '' : pick(next[field], lang);
  }
  if (next.connection) result.connection = next.connection;
  else if (previous?.connection && current.connection === previous.connection)
    result.connection = '';
  return result;
}
/** Keeps preset text in the message language when that language changes. */
export function translateQuickMessage(
  current: QuickFields,
  preset: QuickMessage,
  from: Lang,
  to: Lang,
): QuickFields {
  const result = { ...current };
  for (const field of TEXT_FIELDS) {
    if (preset[field] && current[field].trim() === pick(preset[field], from))
      result[field] = pick(preset[field], to);
  }
  return result;
}
