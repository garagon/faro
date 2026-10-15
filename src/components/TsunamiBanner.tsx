import { ageLabel } from '../lib/feedUpdates.ts';
import { atLabel } from '../lib/time.ts';
import type { Bulletin } from '../lib/tsunami.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import { Actions, Badge, OutLink, SafetyNotice, Section, SourceStamp } from '../ui/index.ts';

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
    <div role="alert">
      <Section
        id="fw-tsunami-banner"
        title={
          <>
            Tsunami{' '}
            <Badge level={b.kind === 'threat' ? 3 : 1}>
              {b.kind === 'threat'
                ? t('Mensaje de amenaza', 'Threat message', 'Mensagem de ameaça')
                : t('Mensaje por revisar', 'Message to review', 'Mensagem para revisar')}
            </Badge>
          </>
        }
        aside={`NOAA · ${basin}`}
      >
        {/* The natural-warning step comes first: on a phone it must be read before anything else. */}
        <SafetyNotice>
          {t(
            'Si estás en la costa y sentiste un sismo fuerte o largo, ve a pie a un lugar alto ahora.',
            'If you are on the coast and felt strong or long shaking, go on foot to high ground now.',
            'Se você está na costa e sentiu um terremoto forte ou longo, vá a pé para um lugar alto agora.',
          )}
        </SafetyNotice>
        <p>
          {t(
            'Revisa si el boletín nombra tu costa y sigue a las autoridades locales.',
            'Check whether the bulletin names your coast, and follow local authorities.',
            'Veja se o boletim cita a sua costa e siga as autoridades locais.',
          )}
        </p>
        <SourceStamp issuer={b.place} state={lastData ? 'stale' : undefined}>
          {t('publicado', 'issued', 'publicado')} {ageLabel(b.issued, now, lang)}
          {lastData &&
            t(
              ` · sin actualizar desde ${atLabel(lastData, now, lang)}: puede haber un mensaje más nuevo`,
              ` · not updated since ${atLabel(lastData, now, lang)}: there may be a newer message`,
              ` · sem atualização desde ${atLabel(lastData, now, lang)}: pode haver uma mensagem mais recente`,
            )}
        </SourceStamp>
        <Actions>
          <OutLink href={b.url}>
            {t('Leer el boletín (en inglés)', 'Read the bulletin', 'Ler o boletim (em inglês)')}
          </OutLink>
          <button type="button" onClick={onOpen}>
            {t('Ver todos los boletines', 'See all bulletins', 'Ver todos os boletins')}
          </button>
        </Actions>
      </Section>
    </div>
  );
}
