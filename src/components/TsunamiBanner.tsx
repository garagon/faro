import { ageLabel } from '../lib/feedUpdates.ts';
import { readablePlace, type Bulletin, type TsunamiNotice } from '../lib/tsunami.ts';
import { lineStamp, type SourceLine } from '../lib/sourceStatus.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { Actions, Badge, OutLink, SafetyNotice, Section, SourceStamp } from '../ui/index.ts';

type Props = {
  lang: Lang;
  now: number;
  bulletin: Bulletin;
  /** NOAA's message type and Faro's level for it, as on the Situación row and the Tsunami tab. */
  notice: TsunamiNotice;
  /** NOAA's state when the bulletins are not current (failing, offline or a kept copy). */
  source?: { state: SourceLine; text: string };
  /** Opens the tsunami bulletins page. */
  onOpen: () => void;
};

/**
 * A recent NOAA/PTWC threat (or unreadable) message that no later message has closed. Shown at
 * the top of the home and the emergency screen. It names the ocean basin and never says whether
 * it applies to a given coast; the natural warning step comes from the cited first-minute guidance.
 */
export default function TsunamiBanner({ lang, now, bulletin: b, notice, source, onOpen }: Props) {
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
            Tsunami <Badge level={notice.level}>{notice.label[langIndex(lang)]}</Badge>
          </>
        }
        aside={`NOAA · ${basin}`}
      >
        {/* The natural-warning step comes first: on a phone it must be read before anything else.
            While the banner is shown it is the screen's only coast instruction, so it carries
            the whole of it. */}
        <SafetyNotice>
          {t(
            'Si estás en la costa y sentiste un sismo fuerte o largo, ve a pie a un lugar alto ahora. No esperes una alerta.',
            'If you are on the coast and felt strong or long shaking, go on foot to high ground now. Do not wait for an alert.',
            'Se você está na costa e sentiu um terremoto forte ou longo, vá a pé para um lugar alto agora. Não espere um alerta.',
          )}
        </SafetyNotice>
        <p>
          {t(
            'Revisa si el boletín nombra tu costa y sigue a las autoridades locales.',
            'Check whether the bulletin names your coast, and follow local authorities.',
            'Veja se o boletim cita a sua costa e siga as autoridades locais.',
          )}
        </p>
        <SourceStamp
          issuer={
            <>
              <span lang="en">{readablePlace(b.place)}</span>
              {t(' (en inglés)', '', ' (em inglês)')}
            </>
          }
        >
          {t('publicado', 'issued', 'publicado')}{' '}
          {/* The number stays with its unit at a line break ("hace 18 min"). */}
          {ageLabel(b.issued, now, lang).replace(/(\d) (?=\S)/g, '$1 ')}
        </SourceStamp>
        {/* Not current: there may be a newer message, said with NOAA's state and time. */}
        {source && (
          <SourceStamp issuer="NOAA" state={lineStamp(source.state)}>
            {source.text}.{' '}
            {t(
              'Puede haber un mensaje más nuevo.',
              'There may be a newer message.',
              'Pode haver uma mensagem mais recente.',
            )}
          </SourceStamp>
        )}
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
