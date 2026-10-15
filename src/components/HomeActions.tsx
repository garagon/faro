import { ChatCircleTextIcon, FirstAidIcon, FlagIcon, PhoneIcon } from '@phosphor-icons/react';
import { emergencyFor } from '../lib/emergency.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { CallButton, List, ListRow, RowIcon, SafetyNotice } from '../ui/index.ts';

type Props = {
  lang: Lang;
  country: string;
  onEmergency: () => void;
  /** "What to do now": the emergency screen opened on its first steps. */
  onSteps: () => void;
  onStatus: () => void;
  /** The person's embassy, in Local help; the nationality is asked there once. */
  onEmbassy: () => void;
  /** The saved nationality, as a country name, when there is one. */
  nationalityName?: string;
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
        lead={<RowIcon icon={<PhoneIcon size={20} />} />}
        title={t('Teléfonos de emergencia', 'Emergency numbers', 'Telefones de emergência')}
        meta={t(
          'Elige el país donde estás',
          'Choose the country you are in',
          'Escolha o país onde você está',
        )}
        onClick={p.onEmergency}
      />
    </List>
  );
}

/** Tell family, know what to do, the embassy, and the natural tsunami warning. */
export default function HomeActions(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt);
  return (
    <div className="f-stack">
      <List label={t('Acciones', 'Actions', 'Ações')}>
        <ListRow
          lead={<RowIcon icon={<ChatCircleTextIcon size={20} />} />}
          title={t('Avisar cómo estoy', 'Tell people how I am', 'Avisar como estou')}
          meta={t(
            'Prepara un mensaje y envíalo tú',
            'Prepare a message, send it yourself',
            'Prepare uma mensagem e envie',
          )}
          onClick={p.onStatus}
        />
        <ListRow
          lead={<RowIcon icon={<FirstAidIcon size={20} />} />}
          title={t('Qué hacer ahora', 'What to do now', 'O que fazer agora')}
          meta={t(
            'Primeros pasos y otros números',
            'First steps and other numbers',
            'Primeiros passos e outros números',
          )}
          onClick={p.onSteps}
        />
        <ListRow
          lead={<RowIcon icon={<FlagIcon size={20} />} />}
          title={t('Tu embajada', 'Your embassy', 'Sua embaixada')}
          meta={
            p.nationalityName ??
            t('Elige tu nacionalidad', 'Choose your nationality', 'Escolha sua nacionalidade')
          }
          onClick={p.onEmbassy}
        />
      </List>
      {/* The natural warning, before any official message: the loading screen says it too. */}
      <SafetyNotice>
        {t(
          'En la costa, si sentiste un sismo fuerte o largo: ve a pie a un lugar alto ya. No esperes una alerta.',
          'On the coast, if you felt strong or long shaking: go on foot to high ground now. Do not wait for an alert.',
          'Na costa, se você sentiu um tremor forte ou longo: vá a pé para um lugar alto já. Não espere um alerta.',
        )}
      </SafetyNotice>
    </div>
  );
}
