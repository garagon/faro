import { useEffect, useState } from 'react';
import { WavesIcon, ArrowUpRightIcon, ArrowClockwiseIcon } from '@phosphor-icons/react';
import type { Geo } from './WebMap.tsx';
import { coastDistanceKm, type CoastLine } from '../lib/coast.ts';
type Bulletin = {
  product: string;
  issued: number;
  eventId: string;
  place: string;
  url: string;
  basin: string;
  kind: string;
  evaluation: string;
};
type Data = { bulletins: Bulletin[]; partial: boolean; fetched: number };
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
  const [data, setData] = useState<Data | null>(null),
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
        const r = await fetch('/api/tsunami', {
          signal: AbortSignal.any([ctrl.signal, AbortSignal.timeout(20000)]),
        });
        if (!r.ok) throw Error();
        const d = await r.json();
        if (!Array.isArray(d.bulletins) || !Number.isFinite(d.fetched)) throw Error();
        if (!stop) {
          setData(d);
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
  const date = (n: number) =>
    new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Panama',
    }).format(n);
  const near = geo && distance !== null && distance <= 20 + geo.accuracy / 1000;
  const recentThreats =
    data?.bulletins.filter(
      (b) => b.kind === 'threat' && now - b.issued < 6 * 3600000 && now >= b.issued,
    ) || [];
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
      {recentThreats.length > 0 && (
        <div className="fw-warning">
          {t(
            'Hay un mensaje reciente de amenaza en los productos consultados. Revisa las costas afectadas en el boletín; no se ha determinado si aplica a tu ubicación.',
            'A recent threat message exists in the products checked. Review affected coasts in the bulletin; applicability to your location has not been determined.',
          )}
        </div>
      )}
      <details>
        <summary>
          {t('Boletines NOAA', 'NOAA bulletins')} {data ? `(${data.bulletins.length})` : ''}
        </summary>
        <p>
          {t(
            'Pacífico y Caribe internacionales. Un boletín antiguo no es una alerta vigente ni prueba que hoy no haya peligro. La autoridad nacional determina la alerta local.',
            'International Pacific and Caribbean. An old bulletin is neither a current alert nor proof of no danger today. National authorities determine local alerts.',
          )}
        </p>
        {data?.bulletins.map((b) => (
          <article className="fw-bulletin" key={b.product}>
            <span className="fw-eyebrow">
              {b.product} ·{' '}
              {b.basin === 'Pacific' ? t('Pacífico', 'Pacific') : t('Caribe', 'Caribbean')}
            </span>
            <h3>{b.place}</h3>
            <p>{date(b.issued)} · America/Panama</p>
            <b>
              {now - b.issued > 6 * 3600000
                ? t('Boletín anterior', 'Past bulletin')
                : t(
                    'Mensaje reciente · verificar ámbito',
                    'Recent message · check applicable area',
                  )}
            </b>
            <p>
              {b.kind === 'ended'
                ? t(
                    'El boletín da por terminada la amenaza para ese evento.',
                    'The bulletin ends the threat for that specific event.',
                  )
                : b.kind === 'information'
                  ? t(
                      'Comunicado informativo para ese evento.',
                      'Information statement for that specific event.',
                    )
                  : t(
                      'Mensaje de amenaza: consultar texto oficial.',
                      'Threat message: read the official text.',
                    )}
            </p>
            <a href={b.url} target="_blank" rel="noreferrer">
              {t('Leer boletín oficial', 'Read official bulletin')}
              <ArrowUpRightIcon size={16} />
            </a>
            <details>
              <summary>
                {t('Evaluación original (inglés)', 'Original evaluation (English)')}
              </summary>
              <pre>{b.evaluation}</pre>
            </details>
          </article>
        ))}
      </details>
      <div className="fw-coast-foot">
        <span>
          {data
            ? `${t('Fuente consultada', 'Source checked')}: ${date(data.fetched)}`
            : busy
              ? t('Conectando con NOAA…', 'Connecting to NOAA…')
              : t('Sin datos recibidos', 'No data received')}
        </span>
        {country === 'PA' && (
          <a href="https://www.sinaproc.gob.pa/" target="_blank" rel="noreferrer">
            SINAPROC
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
