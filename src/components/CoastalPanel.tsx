import { destinationFor } from '../data/destinations/index.ts';
import { useEffect, useState } from 'react';
import { WavesIcon, ArrowUpRightIcon, ArrowClockwiseIcon } from '@phosphor-icons/react';
import type { Geo } from './WebMap.tsx';
import { coastDistanceKm, decodeCoastline, type CoastLine } from '../lib/coast.ts';
import { classifyBulletins, type TsunamiData, type BulletinState } from '../lib/tsunami.ts';
import { nwsEventLabels, type NwsAlert } from '../lib/nws.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
let coastCache: Promise<CoastLine[]> | null = null;
export default function CoastalPanel({
  lang,
  geo,
  country,
  data,
  failed: error,
  busy,
  now,
  onRefresh,
  onLocate,
  locating,
  nws,
  online,
}: {
  lang: Lang;
  geo: Geo | null;
  country: string;
  data: TsunamiData | null;
  failed: boolean;
  busy: boolean;
  now: number;
  onRefresh: () => void;
  /** Asks for the device location; only on an explicit tap. */
  onLocate: () => void;
  locating: boolean;
  /** NWS alerts for a U.S. state or territory; null elsewhere. */
  nws: { data: NwsAlert[] | null; failed: boolean } | null;
  /** Offline, the last answer can no longer confirm "no messages". */
  online: boolean;
}) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const [distance, setDistance] = useState<number | null>(null),
    [coastError, setCoastError] = useState(false),
    [coastLoaded, setCoastLoaded] = useState(false);
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
      .then(decodeCoastline)
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
  // Only tsunami products belong here; other NWS alerts are on the situation screen.
  const nwsTsunami = nws?.data?.filter((a) => a.kind === 'tsunami') ?? null;
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
    ended: t(
      'Cierre de amenaza publicado',
      'Threat ended in this bulletin',
      'Encerramento da ameaça publicado',
    ),
    cancelled: t('Cancelación publicada', 'Cancellation published', 'Cancelamento publicado'),
    information: t(
      'Informativo · no es una alerta',
      'Information · not an alert',
      'Informativo · não é um alerta',
    ),
    superseded: t(
      'Reemplazado por un boletín posterior',
      'Superseded by a later bulletin',
      'Substituído por um boletim posterior',
    ),
    unconfirmed: t(
      'Vigencia sin confirmar',
      'Current status unconfirmed',
      'Vigência não confirmada',
    ),
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
          {t('Emitido', 'Issued', 'Emitido')}:{' '}
          <time dateTime={new Date(b.issued).toISOString()}>{date(b.issued)}</time> · {zone}
        </p>
        <p>
          {b.product} ·{' '}
          {b.basin === 'Pacific'
            ? t('Pacífico', 'Pacific', 'Pacífico')
            : t('Caribe', 'Caribbean', 'Caribe')}{' '}
          · {t('Evento', 'Event', 'Evento')} {b.eventId}
        </p>
        {row.replacedAt && (
          <p>
            {t('Actualización posterior', 'Later update', 'Atualização posterior')}:{' '}
            {date(row.replacedAt)}
          </p>
        )}
        {state === 'ended' || state === 'cancelled' ? (
          <p>
            {t(
              'Este estado corresponde al evento y al ámbito de ese boletín. No describe la situación actual de tu ubicación.',
              'This status applies to the event and area in that bulletin. It does not describe the current situation at your location.',
              'Este status corresponde ao evento e à área desse boletim. Não descreve a situação atual da sua localização.',
            )}
          </p>
        ) : state === 'unconfirmed' ? (
          <p>
            {t(
              'Consulta la última actualización oficial y las costas afectadas. Faro no confirma que exista una alerta vigente para tu ubicación.',
              'Check the latest official update and affected coasts. Faro does not confirm an active alert for your location.',
              'Consulte a última atualização oficial e as costas afetadas. O Faro não confirma que exista um alerta em vigor para a sua localização.',
            )}
          </p>
        ) : null}
        {!row.recent && (
          <small>
            {t(
              'Archivo: fuera de la ventana de 6 horas. La antigüedad no equivale a cancelación.',
              'Archive: outside the 6-hour display window. Age does not mean cancellation.',
              'Arquivo: fora da janela de 6 horas. Ser antigo não equivale a ter sido cancelado.',
            )}
          </small>
        )}
        <div className="fw-bulletin-links">
          <a href={b.url} target="_blank" rel="noreferrer">
            {t('Leer comunicado', 'Read statement', 'Ler comunicado')}{' '}
            <ArrowUpRightIcon size={14} />
          </a>
          <a href="https://www.tsunami.gov/" target="_blank" rel="noreferrer">
            {t(
              'Consultar última actualización',
              'Check latest update',
              'Consultar última atualização',
            )}
            <ArrowUpRightIcon size={13} aria-hidden="true" />
          </a>
        </div>
        <details>
          <summary>
            {t(
              'Evaluación original (inglés)',
              'Original evaluation (English)',
              'Avaliação original (em inglês)',
            )}
          </summary>
          <pre>
            {b.evaluation ||
              t(
                'Sin evaluación legible. Abre el comunicado oficial.',
                'No readable evaluation. Open the official statement.',
                'Sem avaliação legível. Abra o comunicado oficial.',
              )}
          </pre>
        </details>
      </article>
    );
  };
  // One line that answers "is there a tsunami message?", from what was received and how.
  const statusState = error
    ? 'failed'
    : !data
      ? 'checking'
      : current.length > 0
        ? 'review'
        : rows.some((r) => r.unresolved)
          ? 'unresolved'
          : data.partial
            ? 'partial'
            : rows.some((r) => !r.reliable) || !online
              ? 'old'
              : 'none';
  // The newest message, when it closes a threat: said as NOAA said it, with its time.
  const closing =
    statusState === 'none'
      ? rows.find((r) => r.recent && (r.state === 'cancelled' || r.state === 'ended'))
      : undefined;
  const statusHeadline = {
    failed: t(
      'No se pudo actualizar NOAA',
      'NOAA could not be refreshed',
      'Não foi possível atualizar a NOAA',
    ),
    checking: busy
      ? t('Consultando NOAA…', 'Checking NOAA…', 'Consultando a NOAA…')
      : t('Sin datos de NOAA todavía', 'No NOAA data yet', 'Ainda sem dados da NOAA'),
    review:
      current.length === 1
        ? t(
            '1 mensaje reciente por revisar',
            '1 recent message to review',
            '1 mensagem recente para revisar',
          )
        : t(
            `${current.length} mensajes recientes por revisar`,
            `${current.length} recent messages to review`,
            `${current.length} mensagens recentes para revisar`,
          ),
    unresolved: t(
      'Hay un mensaje de amenaza sin cierre: no se puede confirmar que terminó',
      'A threat message has no closing message: it cannot be confirmed as over',
      'Há uma mensagem de ameaça sem encerramento: não é possível confirmar que terminou',
    ),
    partial: t(
      'Respuesta parcial de NOAA: no se puede confirmar',
      'Partial NOAA answer: cannot be confirmed',
      'Resposta parcial da NOAA: não é possível confirmar',
    ),
    old: t(
      'La consulta está desactualizada',
      'This check is out of date',
      'A consulta está desatualizada',
    ),
    none:
      closing?.state === 'cancelled'
        ? t(
            `NOAA canceló el mensaje de amenaza (${date(closing.bulletin.issued)})`,
            `NOAA cancelled the threat message (${date(closing.bulletin.issued)})`,
            `A NOAA cancelou a mensagem de ameaça (${date(closing.bulletin.issued)})`,
          )
        : closing
          ? t(
              `NOAA dio por terminada la amenaza (${date(closing.bulletin.issued)})`,
              `NOAA says the threat has ended (${date(closing.bulletin.issued)})`,
              `A NOAA deu a ameaça por encerrada (${date(closing.bulletin.issued)})`,
            )
          : t(
              'Sin mensajes de amenaza en las últimas 6 horas',
              'No threat messages in the last 6 hours',
              'Sem mensagens de ameaça nas últimas 6 horas',
            ),
  }[statusState];
  return (
    <section
      className={`fw-coast ${near ? 'near-coast' : ''}`}
      aria-label={t('Información de tsunami', 'Tsunami information', 'Informação sobre tsunami')}
    >
      <div className="fw-coast-title">
        <WavesIcon size={25} />
        <div>
          <h2>{t('Información de tsunami', 'Tsunami information', 'Informação sobre tsunami')}</h2>
          <small>
            {t(
              'NOAA/PTWC · consulta automática cada 60 s',
              'NOAA/PTWC · automatic checks every 60 s',
              'NOAA/PTWC · consulta automática a cada 60 s',
            )}
          </small>
        </div>
        <button
          className="fw-icon"
          disabled={busy}
          onClick={onRefresh}
          aria-label={t(
            'Actualizar boletines de tsunami',
            'Refresh tsunami bulletins',
            'Atualizar boletins de tsunami',
          )}
        >
          <ArrowClockwiseIcon size={19} />
        </button>
      </div>
      {/* The answer first: what NOAA's products say now, when they were checked, and the limits. */}
      <div className="fw-tsunami-status" role="status" data-state={statusState}>
        <strong>{statusHeadline}</strong>
        <p>
          {data && `${t('Consultado', 'Checked', 'Consultado')} ${date(data.fetched)}. `}
          {t(
            'Estos productos internacionales no confirman el estado de una alerta en tu ubicación: confírmalo con la autoridad local.',
            'These international products do not confirm alert status at your location: check with local authorities.',
            'Estes produtos internacionais não confirmam o status de um alerta na sua localização: confirme com a autoridade local.',
          )}
          {statusState === 'none' &&
            ` ${t('Esto no confirma ausencia de peligro.', 'This does not confirm absence of danger.', 'Isso não confirma ausência de perigo.')}`}
        </p>
      </div>
      {current.length > 0 && (
        <section className="fw-bulletin-current">
          <h3>
            {t(
              'Mensajes recientes: verificar actualización',
              'Recent messages: check for updates',
              'Mensagens recentes: verificar atualização',
            )}
          </h3>
          {current.map(renderBulletin)}
        </section>
      )}
      <div className={`fw-coast-now ${near ? 'is-near' : ''}`}>
        <strong>
          {t(
            'Si estás en la costa y sientes un sismo fuerte o largo, ves que el mar se retira o sube de golpe, u oyes un rugido:',
            'If you are on the coast and feel strong or long shaking, see the sea suddenly pull back or rise, or hear a roar:',
            'Se você está na costa e sente um terremoto forte ou longo, vê o mar recuar ou subir de repente, ou ouve um rugido:',
          )}
        </strong>
        <ol>
          <li>
            {t(
              'Protégete mientras tiembla.',
              'Protect yourself while it shakes.',
              'Proteja-se enquanto treme.',
            )}
          </li>
          <li>
            {t(
              'Cuando pare, ve a pie a un lugar alto o tierra adentro.',
              'When it stops, go on foot to high ground or inland.',
              'Quando parar, vá a pé para um lugar alto ou para o interior.',
            )}
          </li>
          <li>
            {t(
              'Sigue las señales de evacuación. No esperes una alerta oficial.',
              'Follow evacuation signs. Do not wait for an official alert.',
              'Siga as placas de evacuação. Não espere um alerta oficial.',
            )}
          </li>
        </ol>
        <a href="https://www.weather.gov/safety/tsunami-during" target="_blank" rel="noreferrer">
          {t('Fuente: NOAA', 'Source: NOAA', 'Fonte: NOAA')}
        </a>
      </div>
      <div className="fw-coast-where">
        <p className="fw-coast-location">
          {!geo
            ? t(
                'Con tu ubicación, Faro calcula la distancia aproximada a la costa. No indica si la zona es segura.',
                'With your location, Faro estimates the distance to the coast. It does not say whether the area is safe.',
                'Com sua localização, o Faro calcula a distância aproximada até a costa. Não indica se a área é segura.',
              )
            : coastError
              ? t(
                  'No se pudo consultar la cartografía costera.',
                  'Coastal mapping could not be loaded.',
                  'Não foi possível carregar a cartografia costeira.',
                )
              : distance === null
                ? coastLoaded
                  ? t(
                      'Sin estimación costera disponible para este punto.',
                      'No coastal estimate available for this point.',
                      'Sem estimativa costeira disponível para este ponto.',
                    )
                  : t(
                      'Consultando cartografía costera…',
                      'Checking coastal mapping…',
                      'Consultando a cartografia costeira…',
                    )
                : near
                  ? t(
                      `Estás a unos ${Math.round(distance)} km de la costa (aproximado).`,
                      `You are about ${Math.round(distance)} km from the coast (approximate).`,
                      `Você está a cerca de ${Math.round(distance)} km da costa (aproximado).`,
                    )
                  : t(
                      `Distancia aproximada a la costa: ${Math.round(distance)} km. Esto no indica si la zona es segura.`,
                      `Approximate distance to the coast: ${Math.round(distance)} km. This does not say whether the area is safe.`,
                      `Distância aproximada até a costa: ${Math.round(distance)} km. Isso não indica se a área é segura.`,
                    )}
        </p>
        {!geo && (
          <button className="fw-secondary" onClick={onLocate} disabled={locating}>
            {locating
              ? t('Buscando ubicación…', 'Finding location…', 'Buscando localização…')
              : t('Usar mi ubicación', 'Use my location', 'Usar minha localização')}
          </button>
        )}
      </div>
      {nws && (
        <section className="fw-nws" aria-labelledby="fw-nws-title">
          <h3 id="fw-nws-title">
            {t(
              'Avisos de tsunami del NWS · EE. UU. y territorios',
              'NWS tsunami alerts · U.S. and territories',
              'Avisos de tsunami do NWS · EUA e territórios',
            )}
          </h3>
          {nws.failed && (
            <p className="fw-warning" role="status">
              {t(
                'No se pudo consultar el NWS. No podemos confirmar si hay avisos.',
                'The NWS could not be reached. We cannot confirm whether alerts exist.',
                'Não foi possível consultar o NWS. Não podemos confirmar se há avisos.',
              )}
            </p>
          )}
          {!nwsTsunami && !nws.failed && (
            <p>{t('Consultando NWS…', 'Checking NWS…', 'Consultando o NWS…')}</p>
          )}
          {nwsTsunami && nwsTsunami.length === 0 && !nws.failed && (
            <p>
              {t(
                'El NWS no tiene avisos de tsunami activos. Esto no confirma ausencia de peligro.',
                'The NWS has no active tsunami alerts. This does not confirm there is no danger.',
                'O NWS não tem avisos de tsunami ativos. Isso não confirma ausência de perigo.',
              )}
            </p>
          )}
          {nwsTsunami?.map((a) => (
            <article className="fw-bulletin" data-state="unconfirmed" key={a.id}>
              <div className="fw-bulletin-state">{nwsEventLabels[a.event][langIndex(lang)]}</div>
              {a.headline && <h3>{a.headline}</h3>}
              <p>{a.area}</p>
              <p className="fw-bulletin-meta">
                {t('Emitido', 'Issued', 'Emitido')}: {date(a.sent)}
                {a.expires && ` · ${t('Hasta', 'Until', 'Até')}: ${date(a.expires)}`} · {zone}
              </p>
              <div className="fw-bulletin-links">
                <a href="https://www.tsunami.gov/" target="_blank" rel="noreferrer">
                  {t(
                    'Consultar última actualización',
                    'Check latest update',
                    'Consultar última atualização',
                  )}
                  <ArrowUpRightIcon size={13} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
          <small>
            {t(
              'Fuente: NOAA/National Weather Service. Cubre solo EE. UU., sus territorios y aguas. Revisa las zonas indicadas en cada aviso.',
              'Source: NOAA/National Weather Service. Covers only the U.S., its territories and waters. Check the areas listed in each alert.',
              'Fonte: NOAA/National Weather Service. Cobre só os EUA, seus territórios e águas. Confira as áreas indicadas em cada aviso.',
            )}
          </small>
        </section>
      )}
      {data && (
        <details className="fw-bulletin-archive">
          <summary>
            {t(
              'Archivo de comunicados NOAA',
              'NOAA statement archive',
              'Arquivo de comunicados da NOAA',
            )}{' '}
            <span>({archived.length})</span>
          </summary>
          <p>
            {t(
              'Último comunicado recibido de cada producto. Incluye información y cierres de eventos anteriores; no es una lista de alertas activas ni un historial completo.',
              'Latest statement received for each product. Includes information and closures for past events; this is not a list of active alerts or a complete history.',
              'Último comunicado recebido de cada produto. Inclui informações e encerramentos de eventos anteriores; não é uma lista de alertas ativos nem um histórico completo.',
            )}
          </p>
          {archived.map(renderBulletin)}
        </details>
      )}
      <div className="fw-coast-foot">
        <span>
          {data
            ? `${t('Fuente consultada', 'Source checked', 'Fonte consultada')}: ${date(data.fetched)}`
            : busy
              ? t('Conectando con NOAA…', 'Connecting to NOAA…', 'Conectando com a NOAA…')
              : t('Sin datos recibidos', 'No data received', 'Nenhum dado recebido')}
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
          {t(
            'Cartografía aproximada: Natural Earth',
            'Approximate mapping: Natural Earth',
            'Cartografia aproximada: Natural Earth',
          )}
        </a>
      </div>
      <small>
        {t(
          'Umbral orientativo de proximidad: 20 km; no delimita inundación. Cartografía generalizada, puede omitir islas y tener errores de varios km. No es un mapa de evacuación ni de inundación. La estimación se calcula en tu navegador.',
          'The 20 km proximity threshold does not define inundation. Generalized mapping may omit islands and be inaccurate by several km. It is not an evacuation or inundation map. The estimate is calculated in your browser.',
          'Limite orientativo de proximidade: 20 km; não delimita inundação. Cartografia generalizada, pode omitir ilhas e ter erros de vários km. Não é um mapa de evacuação nem de inundação. A estimativa é calculada no seu navegador.',
        )}
      </small>
    </section>
  );
}
