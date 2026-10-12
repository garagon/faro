import { destinationFor } from '../data/destinations/index.ts';
import { useEffect, useState } from 'react';
import { WavesIcon, ArrowUpRightIcon, ArrowClockwiseIcon } from '@phosphor-icons/react';
import type { Geo } from './WebMap.tsx';
import { coastDistanceKm, type CoastLine } from '../lib/coast.ts';
import {
  classifyBulletins,
  parseTsunamiData,
  type TsunamiData,
  type BulletinState,
} from '../lib/tsunami.ts';
let coastCache: Promise<CoastLine[]> | null = null;
export default function CoastalPanel({
  lang,
  geo,
  country,
}: {
  lang: 'es' | 'en';
  geo: Geo | null;
  country: string;
}) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const [data, setData] = useState<TsunamiData | null>(null),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0),
    [distance, setDistance] = useState<number | null>(null),
    [coastError, setCoastError] = useState(false),
    [coastLoaded, setCoastLoaded] = useState(false),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    let stop = false;
    const ctrl = new AbortController();
    const run = async () => {
      setBusy(true);
      try {
        // One controller per request: it aborts on unmount or after 20 s.
        // (AbortSignal.any would do this, but older Safari does not support it.)
        const request = new AbortController();
        const cancel = () => request.abort();
        ctrl.signal.addEventListener('abort', cancel);
        const timer = setTimeout(cancel, 20000);
        let d;
        try {
          const r = await fetch('/api/tsunami', { signal: request.signal });
          if (!r.ok) throw Error();
          d = parseTsunamiData(await r.json());
        } finally {
          clearTimeout(timer);
          ctrl.signal.removeEventListener('abort', cancel);
        }
        if (!stop) {
          setData(d);
          setNow(Date.now());
          setError(false);
        }
      } catch {
        if (!stop) setError(true);
      } finally {
        if (!stop) setBusy(false);
      }
    };
    void run();
    const interval = setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState === 'visible') void run();
    }, 60000);
    const resume = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void run();
    };
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      stop = true;
      ctrl.abort();
      clearInterval(interval);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [refresh]);
  useEffect(() => {
    let stop = false;
    setDistance(null);
    setCoastLoaded(false);
    if (!geo) return;
    setCoastError(false);
    coastCache ??= fetch('/data/coastline.json', { signal: AbortSignal.timeout(30000) })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (!Array.isArray(d.lines)) throw Error();
        return d.lines;
      })
      .catch((e) => {
        coastCache = null;
        throw e;
      });
    coastCache
      .then((lines) => {
        if (!stop) {
          setDistance(coastDistanceKm(geo.lat, geo.lng, lines));
          setCoastLoaded(true);
        }
      })
      .catch(() => {
        if (!stop) setCoastError(true);
      });
    return () => {
      stop = true;
    };
  }, [geo?.lat, geo?.lng]);
  const authority = destinationFor(country)?.civilProtection;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = (n: number) =>
    new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(n);
  const near = geo && distance !== null && distance <= 20 + geo.accuracy / 1000;
  const rows = data ? classifyBulletins(data, now, error) : [];
  const current = rows.filter((r) => r.needsReview);
  const archived = rows.filter((r) => !r.needsReview);
  const labels: Record<BulletinState, string> = {
    ended: t('Cierre de amenaza publicado', 'Threat ended in this bulletin'),
    cancelled: t('Cancelación publicada', 'Cancellation published'),
    information: t('Informativo · no es una alerta', 'Information · not an alert'),
    superseded: t('Reemplazado por un boletín posterior', 'Superseded by a later bulletin'),
    unconfirmed: t('Vigencia sin confirmar', 'Current status unconfirmed'),
  };
  const renderBulletin = (row: (typeof rows)[number]) => {
    const { bulletin: b, state } = row;
    return (
      <article
        className="fw-bulletin"
        data-state={state}
        key={`${b.product}:${b.eventId}:${b.issued}`}
      >
        <div className="fw-bulletin-state">{labels[state]}</div>
        <h3>{b.place}</h3>
        <p className="fw-bulletin-meta">
          {t('Emitido', 'Issued')}:{' '}
          <time dateTime={new Date(b.issued).toISOString()}>{date(b.issued)}</time> · {zone}
        </p>
        <p>
          {b.product} ·{' '}
          {b.basin === 'Pacific' ? t('Pacífico', 'Pacific') : t('Caribe', 'Caribbean')} ·{' '}
          {t('Evento', 'Event')} {b.eventId}
        </p>
        {row.replacedAt && (
          <p>
            {t('Actualización posterior', 'Later update')}: {date(row.replacedAt)}
          </p>
        )}
        {state === 'ended' || state === 'cancelled' ? (
          <p>
            {t(
              'Este estado corresponde al evento y al ámbito de ese boletín. No describe la situación actual de tu ubicación.',
              'This status applies to the event and area in that bulletin. It does not describe the current situation at your location.',
            )}
          </p>
        ) : state === 'unconfirmed' ? (
          <p>
            {t(
              'Consulta la última actualización oficial y las costas afectadas. Faro no confirma que exista una alerta vigente para tu ubicación.',
              'Check the latest official update and affected coasts. Faro does not confirm an active alert for your location.',
            )}
          </p>
        ) : null}
        {!row.recent && (
          <small>
            {t(
              'Archivo: fuera de la ventana de 6 horas. La antigüedad no equivale a cancelación.',
              'Archive: outside the 6-hour display window. Age does not mean cancellation.',
            )}
          </small>
        )}
        <div className="fw-bulletin-links">
          <a href={b.url} target="_blank" rel="noreferrer">
            {t('Leer comunicado', 'Read statement')} <ArrowUpRightIcon size={14} />
          </a>
          <a href="https://www.tsunami.gov/" target="_blank" rel="noreferrer">
            {t('Consultar última actualización', 'Check latest update')} ↗
          </a>
        </div>
        <details>
          <summary>{t('Evaluación original (inglés)', 'Original evaluation (English)')}</summary>
          <pre>
            {b.evaluation ||
              t(
                'Sin evaluación legible. Abre el comunicado oficial.',
                'No readable evaluation. Open the official statement.',
              )}
          </pre>
        </details>
      </article>
    );
  };
  return (
    <section
      className={`fw-coast ${near ? 'near-coast' : ''}`}
      aria-label={t('Información de tsunami', 'Tsunami information')}
    >
      <div className="fw-coast-title">
        <WavesIcon size={25} />
        <div>
          <h2>{t('Información de tsunami', 'Tsunami information')}</h2>
          <small>
            {t(
              'NOAA/PTWC · consulta automática cada 60 s',
              'NOAA/PTWC · automatic checks every 60 s',
            )}
          </small>
        </div>
        <button
          className="fw-icon"
          disabled={busy}
          onClick={() => setRefresh((v) => v + 1)}
          aria-label={t('Actualizar boletines de tsunami', 'Refresh tsunami bulletins')}
        >
          <ArrowClockwiseIcon size={19} />
        </button>
      </div>
      <p className="fw-coast-location">
        {!geo
          ? t(
              'Activa la ubicación para consultar la distancia aproximada a la costa.',
              'Enable location to check the approximate distance to the coast.',
            )
          : coastError
            ? t(
                'No se pudo consultar la cartografía costera.',
                'Coastal mapping could not be loaded.',
              )
            : distance === null
              ? coastLoaded
                ? t(
                    'Sin estimación costera disponible para este punto.',
                    'No coastal estimate available for this point.',
                  )
                : t('Consultando cartografía costera…', 'Checking coastal mapping…')
              : near
                ? t(
                    `Posible zona costera: a unos ${Math.round(distance)} km de la línea cartográfica.`,
                    `Possible coastal area: about ${Math.round(distance)} km from the mapped coastline.`,
                  )
                : t(
                    `Distancia aproximada a la costa cartográfica: ${Math.round(distance)} km. Esto no declara una zona segura.`,
                    `Approximate distance to mapped coastline: ${Math.round(distance)} km. This does not declare an area safe.`,
                  )}
      </p>
      <p>
        {t(
          'El riesgo en tu ubicación no está determinado. Consulta los avisos de protección civil y las rutas de evacuación locales.',
          'Risk at your location has not been determined. Check civil protection notices and local evacuation routes.',
        )}
      </p>
      {near && (
        <div className="fw-warning">
          {t(
            'Si sientes un sismo fuerte o prolongado, observas retirada o subida inusual del mar o escuchas un rugido, protégete durante el temblor y, cuando puedas moverte con seguridad, evacúa hacia terreno alto o tierra adentro siguiendo las señales locales. No esperes una notificación de Faro.',
            'If you feel strong or prolonged shaking, see unusual sea withdrawal or rise, or hear a roar, protect yourself during shaking and, as soon as you can move safely, evacuate to higher ground or inland following local signs. Do not wait for Faro.',
          )}{' '}
          <a href="https://www.weather.gov/safety/tsunami-during" target="_blank" rel="noreferrer">
            NOAA
          </a>
        </div>
      )}
      {error ? (
        <div className="fw-warning" role="status">
          {t(
            'No se pudo actualizar NOAA. No podemos confirmar la situación actual.',
            'NOAA could not be refreshed. We cannot confirm the current situation.',
          )}
        </div>
      ) : data?.partial ? (
        <div className="fw-warning">
          {t(
            'Cobertura parcial: algunos productos NOAA no respondieron.',
            'Partial coverage: some NOAA products did not respond.',
          )}
        </div>
      ) : null}
      <div className="fw-tsunami-status" role="status">
        <strong>
          {t('Avisos locales: confirmar con la autoridad', 'Local alerts: check with authorities')}
        </strong>
        <p>
          {t(
            'Estos productos internacionales no confirman el estado de una alerta en tu ubicación. Un comunicado informativo o un cierre anterior no es una alerta activa.',
            'These international products do not confirm alert status at your location. An information statement or a previous closure is not an active alert.',
          )}
        </p>
        {data && rows.every((r) => r.reliable) && current.length === 0 && (
          <p>
            {t(
              'No hay mensajes de amenaza de las últimas 6 horas entre los productos recibidos. Esto no confirma ausencia de peligro.',
              'No threat messages from the last 6 hours appear in the products received. This does not confirm absence of danger.',
            )}
          </p>
        )}
        {data && rows.some((r) => !r.reliable) && !error && !data.partial && (
          <p>
            {t(
              'La consulta está desactualizada. No se puede confirmar si hubo cambios.',
              'This check is out of date. Changes cannot be confirmed.',
            )}
          </p>
        )}
      </div>
      {current.length > 0 && (
        <section className="fw-bulletin-current">
          <h3>
            {t('Mensajes recientes: verificar actualización', 'Recent messages: check for updates')}
          </h3>
          {current.map(renderBulletin)}
        </section>
      )}
      {data && (
        <details className="fw-bulletin-archive">
          <summary>
            {t('Archivo de comunicados NOAA', 'NOAA statement archive')}{' '}
            <span>({archived.length})</span>
          </summary>
          <p>
            {t(
              'Último comunicado recibido de cada producto. Incluye información y cierres de eventos anteriores; no es una lista de alertas activas ni un historial completo.',
              'Latest statement received for each product. Includes information and closures for past events; this is not a list of active alerts or a complete history.',
            )}
          </p>
          {archived.map(renderBulletin)}
        </details>
      )}
      <div className="fw-coast-foot">
        <span>
          {data
            ? `${t('Fuente consultada', 'Source checked')}: ${date(data.fetched)}`
            : busy
              ? t('Conectando con NOAA…', 'Connecting to NOAA…')
              : t('Sin datos recibidos', 'No data received')}
        </span>
        {authority && (
          <a href={authority.url} target="_blank" rel="noreferrer">
            {authority.name}
          </a>
        )}
        <a href="https://www.tsunami.gov/" target="_blank" rel="noreferrer">
          NOAA
        </a>
        <a
          href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-coastline/"
          target="_blank"
          rel="noreferrer"
        >
          {t('Cartografía aproximada: Natural Earth', 'Approximate mapping: Natural Earth')}
        </a>
      </div>
      <small>
        {t(
          'Umbral orientativo de proximidad: 20 km; no delimita inundación. Cartografía generalizada, puede omitir islas y tener errores de varios km. No es un mapa de evacuación ni de inundación. La estimación se calcula en tu navegador.',
          'The 20 km proximity threshold does not define inundation. Generalised mapping may omit islands and be inaccurate by several km. It is not an evacuation or inundation map. The estimate is calculated in your browser.',
        )}
      </small>
    </section>
  );
}
