import { ArrowUpRightIcon, CaretDownIcon } from '@phosphor-icons/react';
import type { ActiveResponse } from '../data/responses.ts';
import { missionKinds, missionsFor } from '../data/consularMissions.ts';
import { hostOf, reviewDate } from '../lib/links.ts';
import { displayPhone } from '../lib/phone.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import { PhoneButton, PhoneRow } from './Ui.tsx';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';

type Props = { lang: Lang; response: ActiveResponse; nationality: string; now: number };

/** A dated, hand-reviewed summary of an official disaster response, with its sources. */
export default function ResponsePanel({ lang, response: r, nationality, now }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    i = langIndex(lang);
  const titleId = `fw-response-${r.id}`;
  // Without a written block for this nationality, its verified missions in the country.
  const missions =
    nationality && r.consular?.nationality !== nationality
      ? missionsFor(r.country, nationality).filter((m) => !m.historical && m.emergency)
      : [];
  return (
    <details className="fw-response" aria-labelledby={titleId}>
      <summary>
        <span className="fw-response-head">
          <h2 id={titleId}>{r.title[i]}</h2>
          <span className="fw-response-when">
            {r.when[i]}, {t('según el', 'according to', 'segundo o')} {r.occurredSource} ·{' '}
            {ageLabel(Date.parse(r.occurredAt), now, lang)}
          </span>
          {r.magnitudes.length > 1 && (
            <span className="fw-response-when">
              {t('Magnitud', 'Magnitude', 'Magnitude')}{' '}
              {r.magnitudes
                .map((m) => `${m.value} ${t('según', 'per', 'segundo')} ${m.source[i]}`)
                .join(' · ')}
              .{' '}
              {t(
                'Cada agencia la calcula a su manera.',
                'Each agency calculates it its own way.',
                'Cada agência a calcula à sua maneira.',
              )}
            </span>
          )}
          <span className="fw-response-highlight">{r.highlight[i]}</span>
        </span>
        <span className="fw-response-toggle" aria-hidden="true">
          <span className="fw-response-open">
            {t('Ver la respuesta oficial', 'See the official response', 'Ver a resposta oficial')}
          </span>
          <span className="fw-response-close">{t('Ocultar', 'Hide', 'Ocultar')}</span>
          <CaretDownIcon size={16} />
        </span>
      </summary>
      <p className="fw-response-sources">{r.summary[i]}</p>
      <dl className="fw-response-facts">
        {r.facts.map((f) => (
          <div key={f.label[1]}>
            <dt>{f.label[i]}</dt>
            <dd>
              {f.text[i]} <span>{f.source}.</span>
            </dd>
          </div>
        ))}
      </dl>
      {r.consular && r.consular.nationality === nationality && (
        <div className="fw-response-consular">
          <p>{r.consular.text[i]}</p>
          <div>
            {r.consular.lines.map((l) => (
              <span key={l.number}>
                {l.scope[i]}
                <a href={`tel:${l.number}`}>{l.display}</a>
              </span>
            ))}
          </div>
          <a href={r.consular.url} target="_blank" rel="noreferrer">
            {t('Inscribirme en STEP', 'Enroll in STEP', 'Inscrever-me no STEP')}
            <ArrowUpRightIcon size={13} aria-hidden="true" />
          </a>
        </div>
      )}
      {missions.length > 0 && (
        <div className="fw-response-consular">
          <p>
            {t(
              'Tu embajada atiende emergencias de sus ciudadanos. Para un peligro inmediato, llama primero al número local.',
              'Your embassy handles emergencies involving its citizens. For immediate danger, call the local number first.',
              'Sua embaixada atende emergências de seus cidadãos. Em caso de perigo imediato, ligue primeiro para o número local.',
            )}
          </p>
          {missions.map((m) => (
            <div key={m.id}>
              <span>
                {m.name[i]} · {missionKinds[m.kind][i]}
              </span>
              <PhoneRow>
                <PhoneButton
                  href={`tel:${m.emergency}`}
                  number={displayPhone(m.emergency!)}
                  label={t(
                    'Guardia de emergencias',
                    'Emergency duty line',
                    'Plantão de emergência',
                  )}
                  tone="neutral"
                />
              </PhoneRow>
            </div>
          ))}
        </div>
      )}
      <h3>{t('Cómo ayudar de forma segura', 'How to help safely', 'Como ajudar com segurança')}</h3>
      <ul className="fw-response-help">
        {r.help.map((h) => (
          <li key={h[1]}>{h[i]}</li>
        ))}
      </ul>
      <h3>{t('Fuentes oficiales', 'Official sources', 'Fontes oficiais')}</h3>
      <ul className="fw-link-rows">
        {r.links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer">
              <span>
                <strong>{l.name[i]}</strong>
              </span>
              <small>
                {hostOf(l.url)}
                <ArrowUpRightIcon size={14} aria-hidden="true" />
              </small>
            </a>
          </li>
        ))}
      </ul>
      <p className="fw-feed-note">
        {t(
          `Resumen de Faro revisado el ${reviewDate(r.reviewedAt, lang)}. Las cifras cambian: consulta cada fuente para ver la última actualización. Faro dejará de mostrarlo el ${reviewDate(r.showUntil, lang)} si no se vuelve a revisar.`,
          `Faro summary reviewed on ${reviewDate(r.reviewedAt, lang)}. Figures change: check each source for the latest update. Faro stops showing it on ${reviewDate(r.showUntil, lang)} unless it is reviewed again.`,
          `Resumo do Faro revisado em ${reviewDate(r.reviewedAt, lang)}. Os números mudam: consulte cada fonte para ver a última atualização. O Faro deixará de mostrá-lo em ${reviewDate(r.showUntil, lang)} se não for revisado novamente.`,
        )}
      </p>
    </details>
  );
}
