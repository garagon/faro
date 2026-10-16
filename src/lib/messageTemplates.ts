import type { Connection, MessageContext, TravelerStatus } from './traveler.ts';
import { langIndex, type Lang, type Localized } from './i18n.ts';
// Suggestions are inserted only after an explicit choice and remain editable.
export const helpTemplates = [
  {
    id: 'call',
    label: ['Que me llamen', 'Call me', 'Me liguem'],
    text: [
      'Por favor, llámenme para coordinar la ayuda.',
      'Please call me so we can arrange help.',
      'Por favor, me liguem para combinarmos a ajuda.',
    ],
  },
  {
    id: 'pickup',
    label: ['Que me recojan', 'Pick me up', 'Venham me buscar'],
    text: [
      'Necesito que me recojan. Confirmen conmigo el lugar antes de salir.',
      'I need someone to pick me up. Confirm the location with me before leaving.',
      'Preciso que alguém venha me buscar. Confirmem comigo o local antes de sair.',
    ],
  },
  {
    id: 'insurance',
    label: ['Contactar al seguro', 'Contact my insurer', 'Falar com o seguro'],
    text: [
      'Necesito ayuda para contactar a mi seguro de viaje.',
      'I need help contacting my travel insurer.',
      'Preciso de ajuda para entrar em contato com meu seguro viagem.',
    ],
  },
] as const;

// Ready-made messages fill the form only after the person picks one. A preset fills only what
// its label states, never overwrites text the person wrote, and every field stays editable.
type Texts = Readonly<Localized>;
export type QuickMessage = {
  id: string;
  label: Texts;
  status: TravelerStatus;
  /** Only presets that state a reason set it; others keep the reason the person chose. */
  context?: MessageContext;
  connection?: Connection;
  note?: Texts;
  needs?: Texts;
  companions?: Texts;
};
export const quickMessages: readonly QuickMessage[] = [
  {
    id: 'safe',
    label: ['Estoy bien, sin heridas', "I'm OK, not injured", 'Estou bem, sem ferimentos'],
    status: 'ok',
    note: ['No tengo heridas.', "I'm not injured.", 'Não tenho ferimentos.'],
  },
  {
    id: 'team',
    label: ['Estoy bien, con mi equipo', "I'm OK, with my team", 'Estou bem, com minha equipe'],
    status: 'ok',
    companions: ['mi equipo de trabajo', 'my team', 'minha equipe de trabalho'],
  },
  {
    id: 'signal',
    label: ['Estoy bien, con poca señal', "I'm OK, poor signal", 'Estou bem, com pouco sinal'],
    status: 'ok',
    // The connection line already says replies may be slow; a note would repeat it.
    connection: 'limited',
  },
  {
    id: 'evacuating',
    label: ['Estoy evacuando', "I'm evacuating", 'Estou em evacuação'],
    status: 'moving',
    context: 'evacuation',
  },
  {
    id: 'medical',
    label: ['Necesito atención médica', 'I need medical care', 'Preciso de atendimento médico'],
    status: 'help',
    needs: ['Necesito atención médica.', 'I need medical care.', 'Preciso de atendimento médico.'],
  },
  {
    id: 'stranded',
    label: [
      'No puedo salir de donde estoy',
      "I can't leave where I am",
      'Não consigo sair de onde estou',
    ],
    status: 'help',
    needs: [
      // From abroad nobody can dial the local emergency number; the embassy can relay.
      'No puedo salir de donde estoy. Si no respondo, llamen a mi embajada o a la línea consular de mi país y pásenles este mensaje.',
      "I can't get out of where I am. If I don't reply, call my embassy or my country's consular line and pass on this message.",
      'Não consigo sair de onde estou. Se eu não responder, liguem para minha embaixada ou para a linha consular do meu país e passem esta mensagem.',
    ],
  },
];
export type QuickFields = {
  status: TravelerStatus | '';
  /** Empty until the person picks a reason; Faro never assumes one. */
  context: MessageContext | '';
  connection: Connection | '';
  note: string;
  needs: string;
  companions: string;
};
const TEXT_FIELDS = ['note', 'needs', 'companions'] as const;
// Named apart from `pick` in i18n.ts: this one reads a preset's optional text in one language.
const presetText = (texts: Texts | undefined, lang: Lang) => (texts ? texts[langIndex(lang)] : '');
/** Applies a preset on top of the current form without discarding text the person wrote. */
export function applyQuickMessage(
  current: QuickFields,
  next: QuickMessage,
  previous: QuickMessage | null,
  lang: Lang,
): QuickFields {
  const result: QuickFields = {
    ...current,
    status: next.status,
    // A reason the previous preset set goes with it; one the person chose stays.
    context:
      next.context ??
      (previous?.context && current.context === previous.context ? '' : current.context),
  };
  for (const field of TEXT_FIELDS) {
    const value = current[field].trim();
    const ownedByPreset = !value || (!!previous && value === presetText(previous[field], lang));
    if (!ownedByPreset) continue;
    result[field] =
      field === 'needs' && next.status !== 'help' ? '' : presetText(next[field], lang);
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
    if (preset[field] && current[field].trim() === presetText(preset[field], from))
      result[field] = presetText(preset[field], to);
  }
  return result;
}
