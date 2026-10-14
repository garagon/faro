import { ChatCircleTextIcon, FirstAidIcon, PhoneIcon, WavesIcon } from '@phosphor-icons/react';
import { emergencyFor } from '../lib/emergency.ts';
import { telHref } from '../lib/phone.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';

type Props = {
  lang: Lang;
  country: string;
  onEmergency: () => void;
  /** "What to do now": the emergency screen opened on its first steps. */
  onSteps: () => void;
  onStatus: () => void;
};

/** The three things someone in an emergency needs first: call, tell family, know what to do. */
export default function HomeActions({ lang, country, onEmergency, onSteps, onStatus }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    i = langIndex(lang);
  const primary = emergencyFor(country)?.numbers[0];
  return (
    <div
      className="fw-home-actions"
      role="group"
      aria-label={t('Acciones de emergencia', 'Emergency actions', 'Ações de emergência')}
    >
      {primary ? (
        <a className="fw-home-action fw-home-call" href={telHref(primary.number)}>
          <PhoneIcon size={26} weight="fill" aria-hidden="true" />
          <span>
            <strong>
              {t('Llamar al', 'Call', 'Ligar para o')} {primary.number}
            </strong>{' '}
            <small>{primary.label[i]}</small>
          </span>
        </a>
      ) : (
        <button className="fw-home-action fw-home-call" onClick={onEmergency}>
          <PhoneIcon size={26} weight="fill" aria-hidden="true" />
          <span>
            <strong>
              {t('Teléfonos de emergencia', 'Emergency numbers', 'Telefones de emergência')}
            </strong>
            <small>
              {t(
                'Elige el país donde estás',
                'Choose the country you are in',
                'Escolha o país onde você está',
              )}
            </small>
          </span>
        </button>
      )}
      {/* The natural warning, before any official message: the loading screen says it too. It is
          read right after the call; on wide screens it shows as a row under the actions. */}
      <p className="fw-home-coast">
        <WavesIcon size={20} aria-hidden="true" />
        {t(
          'En la costa, si sentiste un sismo fuerte o largo: ve a pie a un lugar alto ya. No esperes una alerta.',
          'On the coast, if you felt strong or long shaking: go on foot to high ground now. Do not wait for an alert.',
          'Na costa, se você sentiu um tremor forte ou longo: vá a pé para um lugar alto já. Não espere um alerta.',
        )}
      </p>
      <button className="fw-home-action" onClick={onStatus}>
        <ChatCircleTextIcon size={26} aria-hidden="true" />
        <span>
          <strong>{t('Avisar cómo estoy', 'Tell people how I am', 'Avisar como estou')}</strong>
          <small>
            {t(
              'Prepara un mensaje y envíalo tú',
              'Prepare a message and send it yourself',
              'Prepare uma mensagem e envie você mesmo',
            )}
          </small>
        </span>
      </button>
      <button className="fw-home-action" onClick={onSteps}>
        <FirstAidIcon size={26} aria-hidden="true" />
        <span>
          <strong>{t('Qué hacer ahora', 'What to do now', 'O que fazer agora')}</strong>
          <small>
            {t(
              'Primeros pasos, números y tu embajada',
              'First steps, numbers and your embassy',
              'Primeiros passos, números e sua embaixada',
            )}
          </small>
        </span>
      </button>
    </div>
  );
}
