import { useState } from 'react';
import { ArrowClockwiseIcon, ArrowUpRightIcon, MapPinIcon, XIcon } from '@phosphor-icons/react';
import type { Quake } from '../lib/domain.ts';
import { ageLabel, type FeedUpdate } from '../lib/feedUpdates.ts';
type Props = {
  events: Quake[];
  updates: FeedUpdate[];
  provider: string;
  catalog: string;
  lang: 'es' | 'en';
  now: number;
  next: number;
  checked: number;
  fetched: number;
  busy: boolean;
  online: boolean;
  stale: boolean;
  formatTime: (time: number) => string;
  onRefresh: () => void;
  onDetails: (q: Quake) => void;
  onMap: (q: Quake) => void;
};
export default function LiveActivity(p: Props) {
  const t = (es: string, en: string) => (p.lang === 'es' ? es : en);
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
  const fresh = unread.find((u) => p.now >= u.receivedAt && p.now - u.receivedAt < 120000);
  const state = !p.online
    ? t('Sin conexión', 'Offline')
    : p.busy
      ? t('Consultando la fuente…', 'Checking source…')
      : p.stale
        ? t('Actualización pendiente', 'Update overdue')
        : !p.checked
          ? t('Conectando…', 'Connecting…')
          : t('Consulta automática activa', 'Automatic updates active');
  const clock = (time: number) =>
    new Intl.DateTimeFormat(p.lang, { timeStyle: 'medium' }).format(time);
  return (
    <section
      className="fw-monitor"
      aria-label={t('Últimos eventos y actualizaciones', 'Latest events and updates')}
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
              ? `${t('Consultado', 'Checked')} ${clock(p.checked)}`
              : t('Esperando respuesta', 'Awaiting response')}
            {p.online && !p.busy && p.checked > 0 && (
              <>
                {' '}
                · {t('Próxima consulta', 'Next check')}:{' '}
                {Math.max(0, Math.ceil((p.next - p.now) / 1000))} s
              </>
            )}
          </span>
          <button disabled={p.busy || !p.online} onClick={p.onRefresh}>
            <ArrowClockwiseIcon size={16} />
            {p.busy ? t('Consultando…', 'Checking…') : t('Actualizar', 'Refresh')}
          </button>
        </div>
      </div>
      {latest && (
        <div className="fw-latest-event">
          <div className="fw-latest-magnitude">
            <strong>{latest.mag?.toFixed(1) ?? '—'}</strong>
            <span>{t('Magnitud', 'Magnitude')}</span>
          </div>
          <div className="fw-latest-place">
            <span className="fw-latest-kicker">
              {t('Último sismo en esta vista', 'Latest earthquake in this view')}
            </span>
            <h2>{latest.place.replace(/^Localizado en\s+/i, '').replace(/(\d)km\b/g, '$1 km')}</h2>
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
              {latest.depth.toFixed(0)} km {t('de profundidad', 'deep')} ·{' '}
              {latest.reviewed
                ? t('Revisado por la fuente', 'Reviewed by source')
                : t('Preliminar', 'Preliminary')}
            </span>
          </div>
          <div className="fw-latest-actions">
            <button onClick={() => p.onMap(latest)}>
              <MapPinIcon size={17} />
              {t('Ver epicentro', 'View epicentre')}
            </button>
            <button onClick={() => p.onDetails(latest)}>
              {t('Detalle del sismo', 'Earthquake details')}
              <ArrowUpRightIcon size={16} />
            </button>
          </div>
        </div>
      )}
      {fresh && (
        <div className="fw-arrival">
          <div className="fw-arrival-content">
            <p role="status">
              <strong>
                {t('Recibido', 'Received')} {clock(fresh.receivedAt)} · {t('Magnitud', 'Magnitude')}{' '}
                {fresh.event.mag?.toFixed(1) ?? '—'}
              </strong>{' '}
              — {fresh.event.place}
              <span>
                {t('Hora del sismo', 'Earthquake time')}: {p.formatTime(fresh.event.time)} ·{' '}
                {p.provider}
              </span>
            </p>
            <div className="fw-arrival-actions">
              <button onClick={() => p.onDetails(fresh.event)}>
                {t('Ver detalle', 'View details')} <ArrowUpRightIcon size={15} />
              </button>
              <button onClick={() => p.onMap(fresh.event)}>
                {t('Ver epicentro', 'View epicentre')} <MapPinIcon size={15} />
              </button>
            </div>
          </div>
          <button
            className="fw-arrival-dismiss"
            aria-label={t('Descartar esta novedad', 'Dismiss this update')}
            onClick={() => setDismissed((prev) => new Set([...prev, key(fresh)]))}
          >
            <XIcon size={18} />
          </button>
          {unread.length > 1 && (
            <button className="fw-arrival-more" onClick={() => setHistory(true)}>
              {t('Otras novedades en esta vista', 'Other updates in this view')}:{' '}
              {unread.length - 1}
            </button>
          )}
        </div>
      )}
      <div className="fw-monitor-foot">
        <span>
          {t(
            'Sismos ya ocurridos; la publicación puede demorar.',
            'Earthquakes already occurred; publication may be delayed.',
          )}
        </span>
        <button aria-expanded={history} onClick={() => setHistory((v) => !v)}>
          {t('Novedades recibidas', 'Received updates')} <b>{updates.length}</b>{' '}
          <span aria-hidden="true">{history ? '−' : '+'}</span>
        </button>
      </div>
      {history && (
        <div className="fw-update-history">
          <p>
            {t(
              'Recibidas desde que abriste Faro y que coinciden con tus filtros. La primera carga no cuenta como novedad. Hasta 50 por fuente.',
              'Received since opening Faro and matching your filters. The initial load is not an update. Up to 50 per source.',
            )}
          </p>
          {updates.length ? (
            updates.map((u) => (
              <button key={key(u)} onClick={() => p.onDetails(u.event)}>
                <strong>
                  {u.event.mag?.toFixed(1) ?? '—'}
                  <small>{t('Magnitud', 'Magnitude')}</small>
                </strong>
                <span>
                  <b>{u.event.place}</b>
                  <small>
                    {t('Sismo', 'Earthquake')}: {p.formatTime(u.event.time)} ·{' '}
                    {t('Recibido', 'Received')}: {clock(u.receivedAt)}
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
              )}
            </p>
          )}
          {p.fetched > 0 && (
            <small>
              {t('Datos obtenidos de la fuente', 'Data retrieved from source')}:{' '}
              {p.formatTime(p.fetched)}
            </small>
          )}
        </div>
      )}
    </section>
  );
}
