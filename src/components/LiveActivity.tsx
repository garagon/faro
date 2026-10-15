import { magnitudeBand } from '../lib/magnitude.ts';
import { useState } from 'react';
import { ArrowClockwiseIcon, ArrowUpRightIcon, MapPinIcon, XIcon } from '@phosphor-icons/react';
import { displayPlace, placeLang, type Quake } from '../lib/domain.ts';
import { ageLabel, type FeedUpdate } from '../lib/feedUpdates.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import { distance } from '../lib/units.ts';
type Props = {
  events: Quake[];
  updates: FeedUpdate[];
  provider: string;
  catalog: string;
  lang: Lang;
  now: number;
  next: number;
  checked: number;
  fetched: number;
  busy: boolean;
  online: boolean;
  stale: boolean;
  period: string;
  formatTime: (time: number) => string;
  onRefresh: () => void;
  onDetails: (q: Quake) => void;
  onMap: (q: Quake) => void;
};
export default function LiveActivity(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set()),
    [history, setHistory] = useState(false);
  const key = (u: FeedUpdate) => `${p.catalog}:${u.event.id}`;
  const visible = new Set(p.events.map((q) => q.id));
  const updates = p.updates.filter((u) => visible.has(u.event.id));
  const unread = updates.filter((u) => !dismissed.has(key(u)));
  const latest = p.events.reduce<Quake | undefined>(
    (a, q) => (!a || q.time > a.time ? q : a),
    undefined,
  );
  // In a sequence of many events, the latest one can hide the largest. Both are shown.
  const largest = p.events.reduce<Quake | undefined>(
    (a, q) => (q.mag !== null && (!a || q.mag > (a.mag ?? -Infinity)) ? q : a),
    undefined,
  );
  const fresh = unread.find((u) => p.now >= u.receivedAt && p.now - u.receivedAt < 120000);
  const state = !p.online
    ? t('Sin conexión', 'Offline', 'Sem conexão')
    : p.busy
      ? t('Consultando la fuente…', 'Checking source…', 'Consultando a fonte…')
      : p.stale
        ? t('Actualización pendiente', 'Update overdue', 'Atualização pendente')
        : !p.checked
          ? t('Conectando…', 'Connecting…', 'Conectando…')
          : t('Actualización automática', 'Automatic updates', 'Atualização automática');
  const clock = (time: number) =>
    new Intl.DateTimeFormat(p.lang, { timeStyle: 'medium' }).format(time);
  return (
    <section
      className="fw-monitor"
      aria-label={t(
        'Últimos eventos y actualizaciones',
        'Latest events and updates',
        'Últimos eventos e atualizações',
      )}
    >
      <div className="fw-monitor-connection">
        <div>
          <span
            className={`fw-connection-dot ${!p.online || p.stale || !p.checked ? 'paused' : ''}`}
          />
          <strong>{state}</strong>
          <span>{p.provider}</span>
        </div>
        <div className="fw-monitor-check">
          <span>
            {p.checked
              ? `${t('Consultado', 'Checked', 'Consultado')} ${clock(p.checked)}`
              : t('Esperando respuesta', 'Awaiting response', 'Aguardando resposta')}
            {p.online && !p.busy && p.checked > 0 && (
              <>
                {' '}
                · {t('Próxima consulta', 'Next check', 'Próxima consulta')}:{' '}
                {Math.max(0, Math.ceil((p.next - p.now) / 1000))} s
              </>
            )}
          </span>
          <button disabled={p.busy || !p.online} onClick={p.onRefresh}>
            <ArrowClockwiseIcon size={16} />
            {p.busy
              ? t('Consultando…', 'Checking…', 'Consultando…')
              : t('Actualizar', 'Refresh', 'Atualizar')}
          </button>
        </div>
      </div>
      {latest && (
        <div className="fw-latest-event">
          <div className={`fw-latest-magnitude fw-mag-band-${magnitudeBand(latest.mag)}`}>
            <strong>{latest.mag?.toFixed(1) ?? '—'}</strong>
            <span>{t('Magnitud', 'Magnitude', 'Magnitude')}</span>
          </div>
          <div className="fw-latest-place">
            <span className="fw-latest-kicker">
              {t(
                'Último sismo en el área',
                'Latest earthquake in this area',
                'Último terremoto na área',
              )}
            </span>
            <h2 lang={placeLang(latest)}>{displayPlace(latest.place)}</h2>
            <p>
              <time
                dateTime={new Date(latest.time).toISOString()}
                title={p.formatTime(latest.time)}
              >
                {ageLabel(latest.time, p.now, p.lang)}
              </time>{' '}
              · {p.formatTime(latest.time)}
            </p>
            <span>
              {distance(latest.depth, p.lang)} {t('de profundidad', 'deep', 'de profundidade')} ·{' '}
              {latest.reviewed
                ? t('Revisado por la fuente', 'Reviewed by source', 'Revisado pela fonte')
                : latest.source === 'EMSC'
                  ? `${t('Publicado por', 'Credited to', 'Publicado por')} ${latest.authority || 'EMSC'}`
                  : t('Preliminar', 'Preliminary', 'Preliminar')}
            </span>
          </div>
          <div className="fw-latest-actions">
            <button onClick={() => p.onMap(latest)}>
              <MapPinIcon size={17} />
              {t('Ver epicentro', 'View epicentre', 'Ver epicentro')}
            </button>
            <button onClick={() => p.onDetails(latest)}>
              {t('Detalle del sismo', 'Earthquake details', 'Detalhes do terremoto')}
              <ArrowUpRightIcon size={16} />
            </button>
          </div>
        </div>
      )}
      {largest && largest.id !== latest?.id && (
        <button className="fw-largest-event" onClick={() => p.onDetails(largest)}>
          <strong className={`fw-mag fw-mag-band-${magnitudeBand(largest.mag)}`}>
            {largest.mag?.toFixed(1)}
          </strong>
          <span>
            <small>
              {t(
                'Mayor sismo del período',
                'Largest earthquake in the period',
                'Maior terremoto do período',
              )}{' '}
              · {p.period}
            </small>
            <b lang={placeLang(largest)}>{displayPlace(largest.place)}</b>
            <small>
              {ageLabel(largest.time, p.now, p.lang)} · {p.formatTime(largest.time)}
            </small>
          </span>
          <ArrowUpRightIcon size={16} aria-hidden="true" />
        </button>
      )}
      {fresh && (
        <div className="fw-arrival">
          <div className="fw-arrival-content">
            <p role="status">
              <strong>
                {t('Recibido', 'Received', 'Recebido')} {clock(fresh.receivedAt)} ·{' '}
                {t('Magnitud', 'Magnitude', 'Magnitude')} {fresh.event.mag?.toFixed(1) ?? '—'}
              </strong>{' '}
              — <span lang={placeLang(fresh.event)}>{displayPlace(fresh.event.place)}</span>
              <span>
                {t('Hora del sismo', 'Earthquake time', 'Horário do terremoto')}:{' '}
                {p.formatTime(fresh.event.time)} · {p.provider}
              </span>
            </p>
            <div className="fw-arrival-actions">
              <button onClick={() => p.onDetails(fresh.event)}>
                {t('Ver detalle', 'View details', 'Ver detalhes')} <ArrowUpRightIcon size={15} />
              </button>
              <button onClick={() => p.onMap(fresh.event)}>
                {t('Ver epicentro', 'View epicentre', 'Ver epicentro')} <MapPinIcon size={15} />
              </button>
            </div>
          </div>
          <button
            className="fw-arrival-dismiss"
            aria-label={t(
              'Descartar esta novedad',
              'Dismiss this update',
              'Descartar esta novidade',
            )}
            onClick={() => setDismissed((prev) => new Set([...prev, key(fresh)]))}
          >
            <XIcon size={18} />
          </button>
          {unread.length > 1 && (
            <button className="fw-arrival-more" onClick={() => setHistory(true)}>
              {t(
                'Otras novedades en esta vista',
                'Other updates in this view',
                'Outras novidades nesta tela',
              )}
              : {unread.length - 1}
            </button>
          )}
        </div>
      )}
      <div className="fw-monitor-foot">
        <span>
          {t(
            'Cada sismo aparece cuando la fuente lo publica.',
            'Each earthquake appears once the source publishes it.',
            'Cada terremoto aparece quando a fonte o publica.',
          )}
        </span>
        <button aria-expanded={history} onClick={() => setHistory((v) => !v)}>
          {t('Cambios recibidos', 'Updates received', 'Mudanças recebidas')} <b>{updates.length}</b>{' '}
          <span aria-hidden="true">{history ? '−' : '+'}</span>
        </button>
      </div>
      {history && (
        <div className="fw-update-history">
          <p>
            {t(
              'Recibidas desde que abriste Faro y que coinciden con tus filtros. La primera carga no cuenta como novedad. Hasta 50 por fuente.',
              'Received since opening Faro and matching your filters. The initial load is not an update. Up to 50 per source.',
              'Recebidas desde que você abriu o Faro e que coincidem com seus filtros. O primeiro carregamento não conta como novidade. Até 50 por fonte.',
            )}
          </p>
          {updates.length ? (
            updates.map((u) => (
              <button key={key(u)} onClick={() => p.onDetails(u.event)}>
                <strong className={`fw-update-mag fw-mag-band-${magnitudeBand(u.event.mag)}`}>
                  {u.event.mag?.toFixed(1) ?? '—'}
                  <small>{t('Magnitud', 'Magnitude', 'Magnitude')}</small>
                </strong>
                <span>
                  <b lang={placeLang(u.event)}>{displayPlace(u.event.place)}</b>
                  <small>
                    {t('Sismo', 'Earthquake', 'Terremoto')}: {p.formatTime(u.event.time)} ·{' '}
                    {t('Recibido', 'Received', 'Recebido')}: {clock(u.receivedAt)}
                  </small>
                </span>
                <ArrowUpRightIcon size={17} />
              </button>
            ))
          ) : (
            <p>
              {t(
                'Todavía no se recibieron otros eventos para esta vista.',
                'No additional events received for this view yet.',
                'Ainda não foram recebidos outros eventos para esta tela.',
              )}
            </p>
          )}
          {p.fetched > 0 && (
            <small>
              {t(
                'Datos obtenidos de la fuente',
                'Data retrieved from source',
                'Dados obtidos da fonte',
              )}
              : {p.formatTime(p.fetched)}
            </small>
          )}
        </div>
      )}
    </section>
  );
}
