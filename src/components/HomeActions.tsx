import { CrossIcon, MessageSquareTextIcon, PhoneIcon } from 'lucide-react';
import { emergencyFor } from '../lib/emergency.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { ActionTile, ActionTiles, CallButton, List, ListRow } from '../ui/index.ts';

type Props = {
  lang: Lang;
  country: string;
  onEmergency: () => void;
  /** "What to do now": the emergency screen opened on its first steps. */
  onSteps: () => void;
  onStatus: () => void;
};

/** The call: the country's main number, or the way to choose a country when there is none. */
export function HomeCall(p: Pick<Props, 'lang' | 'country' | 'onEmergency'>) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt),
    i = langIndex(p.lang);
  const primary = emergencyFor(p.country)?.numbers[0];
  return primary ? (
    <CallButton
      number={primary.number}
      label={t(
        `Llamar al ${primary.number}`,
        `Call ${primary.number}`,
        `Ligar para ${primary.number}`,
      )}
      note={primary.label[i]}
    />
  ) : (
    <List>
      <ListRow
        lead={<PhoneIcon className="size-5 text-muted-foreground" aria-hidden="true" />}
        title={t('Teléfonos de emergencia', 'Emergency numbers', 'Telefones de emergência')}
        // "Choose a country" only when none is chosen; a chosen country without verified numbers
        // says so, like Emergencia and Ayuda.
        meta={
          p.country === 'WORLD'
            ? t(
                'Elige el país donde estás',
                'Choose the country you are in',
                'Escolha o país onde você está',
              )
            : t(
                'Sin números verificados aquí: pregunta en tu alojamiento',
                'No verified numbers here: ask where you are staying',
                'Sem números verificados aqui: pergunte na hospedagem',
              )
        }
        onClick={p.onEmergency}
      />
    </List>
  );
}

/**
 * The two things to do after calling, as large tiles: know what to do, and tell people. The
 * embassy is on Emergencia and in Ayuda; it is not an emergency action.
 */
export default function HomeActions(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt);
  return (
    <ActionTiles label={t('Acciones', 'Actions', 'Ações')}>
      <ActionTile icon={<CrossIcon aria-hidden="true" />} onClick={p.onSteps}>
        {t('Qué hacer ahora', 'What to do now', 'O que fazer agora')}
      </ActionTile>
      {/* The same name as the Avisar tab ("Check in" in English). */}
      <ActionTile icon={<MessageSquareTextIcon aria-hidden="true" />} onClick={p.onStatus}>
        {t('Avisar cómo estoy', 'Check in', 'Avisar como estou')}
      </ActionTile>
    </ActionTiles>
  );
}
