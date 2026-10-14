import { useState } from 'react';
import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { atLabel } from '../lib/time.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import {
  ACTIVE_WINDOW,
  alertLevelMeaning,
  alertTitle,
  alertsFor,
  type AlertsSnapshot,
  readableSeverity,
} from '../lib/alerts.ts';
import type { Bounds } from '../lib/domain.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';

type Props = {
  lang: Lang;
  country: string;
  countryName: string;
  bounds: Bounds;
  data: AlertsSnapshot | null;
  failed: boolean;
  online: boolean;
  now: number;
};
/** GDACS events for the selected country. Estimates for international response, not warnings. */
export default function AlertsPanel(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt),
    idx = langIndex(p.lang);
  const [all, setAll] = useState(false);
  const names = new Intl.DisplayNames([p.lang], { type: 'region' });
  const listed = p.data ? alertsFor(p.data.events, p.country, p.bounds, p.now) : [];
  // Green earthquake events repeat what the earthquake catalog already shows; they are
  // summarized in one line. Everything else is listed.
  const greenQuakes = listed.filter((e) => e.type === 'EQ' && e.level === 'green');
  const rows = listed.filter((e) => !(e.type === 'EQ' && e.level === 'green'));
  const shown = all ? rows : rows.slice(0, 4);
  const date = (n: number) =>
    new Intl.DateTimeFormat(p.lang, { day: 'numeric', month: 'short' }).format(n);
  const stale = !!p.data && p.now - p.data.fetched > 15 * 60000;
  return (
    <section className="fw-feed fw-alerts" aria-labelledby="fw-alerts-title">
      <div className="fw-feed-head">
        <h2 id="fw-alerts-title">
          {t('Alertas internacionales', 'International alerts', 'Alertas internacionais')}
        </h2>
        <p>
          {t(
            'Estimaciones de GDACS (ONU y Comisión Europea) para coordinar la ayuda internacional. No son un aviso para ti ni una orden de evacuación: qué hacer lo indican las autoridades locales.',
            'Estimates from GDACS (UN and European Commission) to coordinate international aid. They are not a warning for you or an evacuation order: local authorities say what to do.',
            'Estimativas do GDACS (ONU e Comissão Europeia) para coordenar a ajuda internacional. Não são um aviso para você nem uma ordem de evacuação: o que fazer é indicado pelas autoridades locais.',
          )}
        </p>
      </div>
      {/* The answer first, in one sentence. */}
      {p.data && (
        <p className="fw-alerts-answer">
          {rows.length === 0
            ? t(
                `Ningún evento con alerta para ${p.countryName} en los últimos 14 días.`,
                `No events with an alert for ${p.countryName} in the last 14 days.`,
                `${p.countryName}: nenhum evento com alerta nos últimos 14 dias.`,
              )
            : rows.length === 1
              ? t(
                  `1 evento con alerta para ${p.countryName} en los últimos 14 días.`,
                  `1 event with an alert for ${p.countryName} in the last 14 days.`,
                  `${p.countryName}: 1 evento com alerta nos últimos 14 dias.`,
                )
              : t(
                  `${rows.length} eventos con alerta para ${p.countryName} en los últimos 14 días.`,
                  `${rows.length} events with an alert for ${p.countryName} in the last 14 days.`,
                  `${p.countryName}: ${rows.length} eventos com alerta nos últimos 14 dias.`,
                )}
        </p>
      )}
      {p.failed && (
        <p className="fw-feed-problem" role="status">
          {p.data
            ? t(
                'No se pudo actualizar GDACS. Se muestran los últimos datos recibidos.',
                'GDACS could not be refreshed. Showing the last data received.',
                'Não foi possível atualizar o GDACS. Mostrando os últimos dados recebidos.',
              )
            : t(
                'No se pudo consultar GDACS. Esto no significa que no haya alertas.',
                'GDACS could not be reached. This does not mean there are no alerts.',
                'Não foi possível consultar o GDACS. Isso não significa que não haja alertas.',
              )}
        </p>
      )}
      {!p.data && !p.failed && (
        <p className="fw-feed-empty">
          {p.online
            ? t('Consultando GDACS…', 'Checking GDACS…', 'Consultando o GDACS…')
            : t(
                'Sin conexión: no se pueden consultar las alertas.',
                'Offline: alerts cannot be checked.',
                'Sem conexão: não é possível consultar os alertas.',
              )}
        </p>
      )}

      {shown.length > 0 && (
        <ul className="fw-feed-list">
          {shown.map((e) => (
            <li key={e.id} className="fw-alert-row" data-level={e.level}>
              <span className="fw-alert-dot" aria-hidden="true" />
              <div>
                <strong>{alertTitle(e, (c) => names.of(c), p.lang)}</strong>
                <p className="fw-alert-meaning">{alertLevelMeaning[e.level][idx]}</p>
                <p className="fw-alert-when">
                  {e.from === e.to ? date(e.to) : `${date(e.from)} – ${date(e.to)}`} ·{' '}
                  {ageLabel(e.to, p.now, p.lang)}
                  {p.now - e.to > ACTIVE_WINDOW &&
                    ` · ${t('sin cambios desde entonces', 'no change since then', 'sem mudanças desde então')}`}
                  {e.type === 'EQ' && e.severity && ` · ${readableSeverity(e.severity, p.lang)}`}
                </p>
                <a href={e.url} target="_blank" rel="noreferrer">
                  {t(
                    'Informe de GDACS (en inglés)',
                    'GDACS report',
                    'Relatório do GDACS (em inglês)',
                  )}
                  <ArrowUpRightIcon size={13} aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      {greenQuakes.length > 0 && (
        <p className="fw-feed-aside">
          {t(
            `Además, ${greenQuakes.length} sismos con impacto estimado bajo (alerta verde). Están en la lista de sismos.`,
            `Also ${greenQuakes.length} earthquakes with low estimated impact (green alert). They are in the earthquake list.`,
            `Além disso, ${greenQuakes.length} terremotos com impacto estimado baixo (alerta verde). Estão na lista de terremotos.`,
          )}
        </p>
      )}
      {rows.length > 4 && (
        <button className="fw-link-button" onClick={() => setAll((v) => !v)}>
          {all
            ? t('Mostrar menos', 'Show fewer', 'Mostrar menos')
            : t(
                `Ver las ${rows.length} alertas`,
                `See all ${rows.length} alerts`,
                `Ver os ${rows.length} alertas`,
              )}
        </button>
      )}
      <p className="fw-feed-note">
        {stale &&
          t(
            'Datos con más de 15 minutos. ',
            'Data older than 15 minutes. ',
            'Dados com mais de 15 minutos. ',
          )}
        {p.data?.partial && t('Respuesta parcial. ', 'Partial response. ', 'Resposta parcial. ')}
        {t('Fuente', 'Source', 'Fonte')}:{' '}
        <a href="https://www.gdacs.org/" target="_blank" rel="noreferrer">
          Global Disaster Alert and Coordination System, GDACS
        </a>
        {p.data &&
          `, ${t('consultado a', 'checked at', 'última consulta:')} ${atLabel(p.data.fetched, p.now, p.lang)}`}
        .
      </p>
    </section>
  );
}
