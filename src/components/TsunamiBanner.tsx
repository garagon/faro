import { WarningIcon } from '@phosphor-icons/react';
import { ExternalLink } from './Ui.tsx';
import { ageLabel } from '../lib/feedUpdates.ts';
import { atLabel } from '../lib/time.ts';
import type { Bulletin } from '../lib/tsunami.ts';
import { pick, type Lang } from '../lib/i18n.ts';

type Props = {
  lang: Lang;
  now: number;
  bulletin: Bulletin;
  /** When the bulletins were last read, if not just now (offline, failing or a kept copy). */
  lastData?: number;
  /** Opens the tsunami bulletins page. */
  onOpen: () => void;
};

/**
 * A recent NOAA/PTWC threat (or unreadable) message that no later message has closed. Shown at
 * the top of the home and the emergency screen. It names the ocean basin and never says whether
 * it applies to a given coast; the natural warning step comes from the cited first-minute guidance.
 */
export default function TsunamiBanner({ lang, now, bulletin: b, lastData, onOpen }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const basin =
    b.basin === 'Pacific'
      ? t('Pacífico', 'Pacific', 'Pacífico')
      : t('Caribe', 'Caribbean', 'Caribe');
  return (
    <section className="fw-tsunami-banner" role="alert" aria-labelledby="fw-tsunami-banner-title">
      <WarningIcon size={24} weight="fill" aria-hidden="true" />
      <div>
        <h2 id="fw-tsunami-banner-title">
          {b.kind === 'threat'
            ? t(
                `Mensaje de amenaza de tsunami de NOAA · ${basin}`,
                `NOAA tsunami threat message · ${basin}`,
                `Mensagem de ameaça de tsunami da NOAA · ${basin}`,
              )
            : t(
                `Mensaje de tsunami de NOAA por revisar · ${basin}`,
                `NOAA tsunami message to review · ${basin}`,
                `Mensagem de tsunami da NOAA para revisar · ${basin}`,
              )}
        </h2>
        {/* The natural-warning step comes first: on a phone it must be read before anything else. */}
        <p className="fw-tsunami-banner-action">
          {t(
            'Si estás en la costa y sentiste un sismo fuerte o largo, ve a pie a un lugar alto ahora.',
            'If you are on the coast and felt strong or long shaking, go on foot to high ground now.',
            'Se você está na costa e sentiu um terremoto forte ou longo, vá a pé para um lugar alto agora.',
          )}
        </p>
        <p>
          {t(
            'Revisa si el boletín nombra tu costa y sigue a las autoridades locales.',
            'Check whether the bulletin names your coast, and follow local authorities.',
            'Veja se o boletim cita a sua costa e siga as autoridades locais.',
          )}
        </p>
        <p className="fw-tsunami-banner-meta">
          {b.place} · {t('publicado', 'issued', 'publicado')} {ageLabel(b.issued, now, lang)}
        </p>
        {lastData && (
          <p className="fw-tsunami-banner-meta">
            {t(
              `Sin actualizar desde ${atLabel(lastData, now, lang)}: puede haber un mensaje más nuevo.`,
              `Not updated since ${atLabel(lastData, now, lang)}: there may be a newer message.`,
              `Sem atualização desde ${atLabel(lastData, now, lang)}: pode haver uma mensagem mais recente.`,
            )}
          </p>
        )}
        <div className="fw-tsunami-banner-actions">
          <ExternalLink href={b.url}>
            {t('Leer el boletín (en inglés)', 'Read the bulletin', 'Ler o boletim (em inglês)')}
          </ExternalLink>
          <button className="fw-link-button" onClick={onOpen}>
            {t('Ver todos los boletines', 'See all bulletins', 'Ver todos os boletins')}
          </button>
        </div>
      </div>
    </section>
  );
}
