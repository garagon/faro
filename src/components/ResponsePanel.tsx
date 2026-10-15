import { useState } from 'react';
import { MegaphoneSimpleIcon } from '@phosphor-icons/react';
import type { ActiveResponse } from '../data/responses.ts';
import { missionKinds, missionsFor } from '../data/consularMissions.ts';
import { hostOf, reviewDate } from '../lib/links.ts';
import { displayPhone } from '../lib/phone.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { ExpandRow, List, ListRow, OutLink, PhoneRow, RowIcon } from '../ui/index.ts';

type Props = { lang: Lang; response: ActiveResponse; nationality: string; now: number };

/**
 * A dated, hand-reviewed summary of an official disaster response, with its sources: one row
 * that opens in place. It belongs in a list (the "Official response" section).
 */
export default function ResponsePanel({ lang, response: r, nationality, now }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    i = langIndex(lang);
  const [open, setOpen] = useState(false);
  // Without a written block for this nationality, its verified missions in the country.
  const missions =
    nationality && r.consular?.nationality !== nationality
      ? missionsFor(r.country, nationality).filter((m) => !m.historical && m.emergency)
      : [];
  return (
    <ExpandRow
      id={`fw-response-${r.id}`}
      open={open}
      onToggle={() => setOpen(!open)}
      lead={<RowIcon icon={<MegaphoneSimpleIcon size={20} />} />}
      title={r.title[i]}
      meta={`${ageLabel(Date.parse(r.occurredAt), now, lang)} · ${t('según el', 'per', 'segundo o')} ${r.occurredSource}`}
    >
      <p>{r.highlight[i]}</p>
      <p className="f-caption">
        {r.when[i]}, {t('según el', 'according to', 'segundo o')} {r.occurredSource}.
        {r.magnitudes.length > 1 && (
          <>
            {' '}
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
          </>
        )}
      </p>
      <p>{r.summary[i]}</p>
      <dl>
        {r.facts.map((f) => (
          <div key={f.label[1]}>
            <dt>{f.label[i]}</dt>
            <dd>
              {f.text[i]} <small>{f.source}.</small>
            </dd>
          </div>
        ))}
      </dl>
      {r.consular && r.consular.nationality === nationality && (
        <>
          <p>{r.consular.text[i]}</p>
          <List>
            {r.consular.lines.map((l) => (
              <PhoneRow key={l.number} number={l.display} dial={l.number} name={l.scope[i]} />
            ))}
          </List>
          <OutLink href={r.consular.url}>
            {t('Inscribirme en STEP', 'Enroll in STEP', 'Inscrever-me no STEP')}
          </OutLink>
        </>
      )}
      {missions.length > 0 && (
        <>
          <p>
            {t(
              'Tu embajada atiende emergencias de sus ciudadanos. Para un peligro inmediato, llama primero al número local.',
              'Your embassy handles emergencies involving its citizens. For immediate danger, call the local number first.',
              'Sua embaixada atende emergências de seus cidadãos. Em caso de perigo imediato, ligue primeiro para o número local.',
            )}
          </p>
          <List>
            {missions.map((m) => (
              <PhoneRow
                key={m.id}
                number={displayPhone(m.emergency!)}
                dial={m.emergency}
                name={`${m.name[i]} · ${missionKinds[m.kind][i]}`}
              />
            ))}
          </List>
        </>
      )}
      <h3>{t('Cómo ayudar de forma segura', 'How to help safely', 'Como ajudar com segurança')}</h3>
      <ul>
        {r.help.map((h) => (
          <li key={h[1]}>{h[i]}</li>
        ))}
      </ul>
      <h3>{t('Fuentes oficiales', 'Official sources', 'Fontes oficiais')}</h3>
      <List>
        {r.links.map((l) => (
          <ListRow key={l.url} title={l.name[i]} meta={hostOf(l.url)} href={l.url} external />
        ))}
      </List>
      <p className="f-caption">
        {t(
          `Resumen de Faro revisado el ${reviewDate(r.reviewedAt, lang)}. Las cifras cambian: consulta cada fuente para ver la última actualización. Faro dejará de mostrarlo el ${reviewDate(r.showUntil, lang)} si no se vuelve a revisar.`,
          `Faro summary reviewed on ${reviewDate(r.reviewedAt, lang)}. Figures change: check each source for the latest update. Faro stops showing it on ${reviewDate(r.showUntil, lang)} unless it is reviewed again.`,
          `Resumo do Faro revisado em ${reviewDate(r.reviewedAt, lang)}. Os números mudam: consulte cada fonte para ver a última atualização. O Faro deixará de mostrá-lo em ${reviewDate(r.showUntil, lang)} se não for revisado novamente.`,
        )}
      </p>
    </ExpandRow>
  );
}
