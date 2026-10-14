import { ArrowUpRightIcon, WavesIcon } from '@phosphor-icons/react';
import type { Quake } from '../lib/domain.ts';
import { emscFeltLink, intensityLabel, pagerLabel, usgsEventLink } from '../lib/impact.ts';
import { pick, type Lang } from '../lib/i18n.ts';

type Props = { q: Quake; lang: Lang; onTsunami: () => void };

/** Products published by the catalog itself. Faro does not compute intensity or impact. */
export default function QuakeImpact({ q, lang, onTsunami }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const impact = q.impact;
  // Report forms open on the agency's site; nothing passes through Faro.
  const feltUrl =
    q.source === 'USGS'
      ? usgsEventLink(q.url, 'tellus')
      : q.source === 'EMSC'
        ? emscFeltLink(q.url)
        : null;
  const reported = impact && (impact.alert || impact.felt || impact.mmi !== null || impact.tsunami);
  const credited = q.source === 'EMSC' && !!q.authority;
  if (!impact && !feltUrl && !credited) return null;
  return (
    <section
      className="fw-quake-impact"
      aria-label={t('Datos oficiales de impacto', 'Impact data', 'Dados oficiais de impacto')}
    >
      {credited && (
        <p className="fw-quake-authority">
          {t('Solución publicada por', 'Solution credited to', 'Solução publicada por')}{' '}
          <strong>{q.authority}</strong> {t('vía EMSC.', 'via EMSC.', 'via EMSC.')}
        </p>
      )}
      {impact && (
        <>
          <h3>{t('Lo que publica USGS', 'What USGS publishes', 'O que o USGS publica')}</h3>
          {reported ? (
            <dl className="fw-dialog-facts">
              {impact.alert && (
                <div>
                  <dt>
                    {t('Alerta PAGER', 'PAGER alert', 'Alerta PAGER')}
                    <small>
                      {t(
                        'Estimación de víctimas y pérdidas',
                        'Estimated casualties and losses',
                        'Estimativa de vítimas e perdas',
                      )}
                    </small>
                  </dt>
                  <dd>
                    <span className={`fw-pager fw-pager-${impact.alert}`}>
                      {pagerLabel(impact.alert, lang)}
                    </span>
                  </dd>
                </div>
              )}
              {impact.mmi !== null && (
                <div>
                  <dt>
                    {t(
                      'Intensidad máxima estimada',
                      'Maximum estimated intensity',
                      'Intensidade máxima estimada',
                    )}
                    <small>ShakeMap</small>
                  </dt>
                  <dd>{intensityLabel(impact.mmi, lang)}</dd>
                </div>
              )}
              {impact.felt !== null && impact.felt > 0 && (
                <div>
                  <dt>
                    {t(
                      'Personas que lo reportaron',
                      'People who reported it',
                      'Pessoas que relataram',
                    )}
                    <small>{t('¿Lo sentiste?', 'Did You Feel It?', 'Você sentiu?')}</small>
                  </dt>
                  <dd>{new Intl.NumberFormat(lang).format(impact.felt)}</dd>
                </div>
              )}
              {impact.felt !== null && impact.felt > 0 && impact.cdi !== null && (
                <div>
                  <dt>
                    {t(
                      'Intensidad máxima reportada',
                      'Maximum reported intensity',
                      'Intensidade máxima relatada',
                    )}
                    <small>{t('Por las personas', 'By people', 'Pelas pessoas')}</small>
                  </dt>
                  <dd>{intensityLabel(impact.cdi, lang)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="fw-quake-impact-empty">
              {t(
                'USGS no ha publicado alerta PAGER, intensidad ni reportes para este sismo. Puede publicarlos más tarde.',
                'USGS has not published a PAGER alert, intensity or reports for this earthquake. It may do so later.',
                'O USGS não publicou alerta PAGER, intensidade nem relatos para este terremoto. Pode publicá-los mais tarde.',
              )}
            </p>
          )}
          {impact.tsunami && (
            <div className="fw-quake-tsunami">
              <WavesIcon size={19} aria-hidden="true" />
              <p>
                {t(
                  'USGS lo marca como sismo grande en zona oceánica y remite a tsunami.gov. La marca no indica si hubo o habrá un tsunami.',
                  'USGS flags it as a large event in an oceanic region and points to tsunami.gov. The flag does not say whether a tsunami occurred or will occur.',
                  'O USGS o marca como terremoto grande em zona oceânica e remete a tsunami.gov. A marca não indica se houve ou haverá um tsunami.',
                )}{' '}
                <button className="fw-text" onClick={onTsunami}>
                  {t('Ver avisos de tsunami', 'See tsunami notices', 'Ver avisos de tsunami')}
                </button>
              </p>
            </div>
          )}
          <p className="fw-quake-impact-note">
            {t(
              'Son estimaciones regionales de USGS. No describen el riesgo ni la intensidad en tu ubicación.',
              'These are USGS regional estimates. They do not describe risk or intensity at your location.',
              'São estimativas regionais do USGS. Não descrevem o risco nem a intensidade na sua localização.',
            )}
          </p>
          <div className="fw-quake-impact-links">
            {impact.mmi !== null && (
              <a href={usgsEventLink(q.url, 'shakemap') ?? q.url} target="_blank" rel="noreferrer">
                ShakeMap <ArrowUpRightIcon size={14} />
              </a>
            )}
            {impact.alert && (
              <a href={usgsEventLink(q.url, 'pager') ?? q.url} target="_blank" rel="noreferrer">
                PAGER <ArrowUpRightIcon size={14} />
              </a>
            )}
          </div>
        </>
      )}
      {feltUrl && (
        <a className="fw-felt-report" href={feltUrl} target="_blank" rel="noreferrer">
          {t(
            '¿Lo sentiste? Repórtalo a',
            'Did you feel it? Report it to',
            'Você sentiu? Relate ao',
          )}{' '}
          {q.source === 'USGS' ? 'USGS' : 'EMSC'}
          <ArrowUpRightIcon size={16} />
        </a>
      )}
    </section>
  );
}
