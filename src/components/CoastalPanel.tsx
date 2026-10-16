import { destinationFor } from '../data/destinations/index.ts';
import { useEffect, useState } from 'react';
import { CrosshairIcon, RotateCwIcon, WavesIcon } from 'lucide-react';
import type { Geo } from './WebMap.tsx';
import { coastDistanceKm, decodeCoastline, type CoastLine } from '../lib/coast.ts';
import {
  bulletinNotice,
  classifyBulletins,
  leadingNotice,
  readablePlace,
  type BulletinState,
  type TsunamiData,
} from '../lib/tsunami.ts';
import { nwsEventLabels, type NwsAlert } from '../lib/nws.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import { checkedLabel } from '../lib/time.ts';
import { failingLabel, lineStamp, sourceLine } from '../lib/sourceStatus.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { distance as formatDistance } from '../lib/units.ts';
import {
  Actions,
  Badge,
  Button,
  ExpandRow,
  IconButton,
  List,
  ListRow,
  Note,
  OutLink,
  SafetyNotice,
  ScopeNote,
  SourceStamp,
  StatusIcon,
  Steps,
  type Signal,
} from '../ui/index.ts';
// Numbers stay with their units at a line break ("hace 2 h", "13 oct").
const nb = (text: string) => text.replace(/(\d) (?=\S)/g, '$1\u00a0');

let coastCache: Promise<CoastLine[]> | null = null;

/** A PTWC message, as published. The evaluation is NOAA's own text, in English. */
const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);

export default function CoastalPanel({
  lang,
  geo,
  country,
  data,
  failed: error,
  failedAt,
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
  /** When the last failed request was made, while NOAA is failing. */
  failedAt?: number | null;
  busy: boolean;
  now: number;
  onRefresh: () => void;
  /** Asks for the device location; only on an explicit tap. */
  onLocate: () => void;
  locating: boolean;
  /** NWS alerts for a U.S. state or territory; null elsewhere. */
  nws: {
    data: NwsAlert[] | null;
    failed: boolean;
    /** When this device last received an answer, and when the last failed request was made. */
    checked?: number | null;
    failedAt?: number | null;
  } | null;
  /** Offline, the last answer can no longer confirm "no messages". */
  online: boolean;
}) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const [distance, setDistance] = useState<number | null>(null),
    [coastError, setCoastError] = useState(false),
    [coastLoaded, setCoastLoaded] = useState(false),
    // Rows the person opened or closed; messages to review start open, the archive closed.
    [toggled, setToggled] = useState<Set<string>>(() => new Set()),
    // Bulletins whose product and event codes are shown ("More data").
    [codes, setCodes] = useState<Set<string>>(() => new Set());
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
  const flip = (id: string) => (prev: Set<string>) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };
  const toggle = (id: string) => setToggled(flip(id));
  // Only tsunami products belong here; other NWS alerts are on the situation screen.
  const nwsTsunami = nws?.data?.filter((a) => a.kind === 'tsunami') ?? null;
  const authority = destinationFor(country)?.civilProtection;
  // One date grammar: the time today, the date and time otherwise; how long ago beside it.
  const at = (n: number) => checkedLabel(n, now, lang);
  const issued = (n: number) =>
    nb(`${t('emitido', 'issued', 'emitido')} ${at(n)} · ${ageLabel(n, now, lang)}`);
  const near = geo && distance !== null && distance <= 20 + geo.accuracy / 1000;
  const rows = data ? classifyBulletins(data, now, error) : [];
  // The message the banner and the Situación row name, with the same words and level.
  const lead = leadingNotice(data, now, error);
  const idx = langIndex(lang);
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
    const id = `fw-bulletin-${b.product}-${b.eventId}-${b.issued}`.replace(/[^\w-]/g, '_');
    const open = row.needsReview !== toggled.has(id);
    // An open message carries the same badge as the banner and the Situación row.
    const notice = bulletinNotice(row);
    const more = codes.has(id);
    return (
      <ExpandRow
        key={id}
        id={id}
        open={open}
        onToggle={() => toggle(id)}
        lead={
          <StatusIcon
            state={notice ? 'listed' : 'none'}
            level={notice?.level}
            icon={<WavesIcon className="size-4" />}
          />
        }
        // NOAA's place, readable, in English as published.
        title={
          <>
            <span lang="en">{readablePlace(b.place)}</span>
            {t(' (en inglés)', '', ' (em inglês)')}
          </>
        }
        badge={<Badge level={notice?.level}>{notice ? notice.label[idx] : labels[state]}</Badge>}
        // Every bulletin here is PTWC's: the issuer is in the status line above.
        meta={issued(b.issued)}
      >
        {row.replacedAt && (
          <p>
            {t('Actualización posterior', 'Later update', 'Atualização posterior')}:{' '}
            {at(row.replacedAt)}
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
          <p className="f-caption m-0 text-sm text-muted-foreground">
            {t(
              'Archivo: fuera de la ventana de 6 horas. La antigüedad no equivale a cancelación.',
              'Archive: outside the 6-hour display window. Age does not mean cancellation.',
              'Arquivo: fora da janela de 6 horas. Ser antigo não equivale a ter sido cancelado.',
            )}
          </p>
        )}
        <h3>
          {t(
            'Evaluación original (inglés)',
            'Original evaluation (English)',
            'Avaliação original (em inglês)',
          )}
        </h3>
        {b.evaluation ? (
          paragraphs(b.evaluation).map((text, i) => (
            <p key={i} lang="en">
              {text}
            </p>
          ))
        ) : (
          <p>
            {t(
              'Sin evaluación legible. Abre el comunicado oficial.',
              'No readable evaluation. Open the official statement.',
              'Sem avaliação legível. Abra o comunicado oficial.',
            )}
          </p>
        )}
        <Actions>
          <OutLink href={b.url}>{t('Leer comunicado', 'Read statement', 'Ler comunicado')}</OutLink>
          <OutLink href="https://www.tsunami.gov/">
            {t(
              'Consultar última actualización',
              'Check latest update',
              'Consultar última atualização',
            )}
          </OutLink>
          <button
            type="button"
            aria-expanded={more}
            aria-controls={`${id}-codes`}
            onClick={() => setCodes(flip(id))}
          >
            {t('Más datos', 'More data', 'Mais dados')}
          </button>
        </Actions>
        {/* NOAA's product and event codes, for anyone matching the bulletin on tsunami.gov. */}
        <p
          id={`${id}-codes`}
          className="f-caption m-0 text-sm text-muted-foreground"
          hidden={!more}
        >
          {t('Producto', 'Product', 'Produto')} {b.product} ·{' '}
          {b.basin === 'Pacific'
            ? t('Pacífico', 'Pacific', 'Pacífico')
            : t('Caribe', 'Caribbean', 'Caribe')}{' '}
          · {t('Evento', 'Event', 'Evento')} {b.eventId}
          {b.place !== readablePlace(b.place) && (
            <>
              {' · '}
              {t(
                'Lugar tal como lo publica NOAA',
                'Place as NOAA publishes it',
                'Local como a NOAA publica',
              )}
              : <span lang="en">{b.place}</span>
            </>
          )}
        </p>
      </ExpandRow>
    );
  };
  // One line that answers "is there a tsunami message?", from what was received and how. An open
  // message leads even while NOAA is failing: its last copy is never dropped.
  const statusState = lead
    ? 'open'
    : error
      ? 'failed'
      : !data
        ? 'checking'
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
  const unconfirmed = t(
    'No se puede confirmar si hay mensajes',
    'Cannot confirm whether there are messages',
    'Não é possível confirmar se há mensagens',
  );
  const openCount = rows.filter((r) => bulletinNotice(r)).length;
  const statusHeadline = {
    // The same title and badge as the banner and the Situación row.
    open:
      openCount > 1
        ? t(
            `Tsunami · ${openCount} mensajes`,
            `Tsunami · ${openCount} messages`,
            `Tsunami · ${openCount} mensagens`,
          )
        : 'Tsunami',
    failed: unconfirmed,
    checking: t('Sin datos de NOAA todavía', 'No NOAA data yet', 'Ainda sem dados da NOAA'),
    partial: t(
      'Respuesta parcial de NOAA: no se puede confirmar',
      'Partial NOAA answer: cannot be confirmed',
      'Resposta parcial da NOAA: não é possível confirmar',
    ),
    old: unconfirmed,
    none:
      closing?.state === 'cancelled'
        ? t(
            `NOAA canceló el mensaje de amenaza (${at(closing.bulletin.issued)})`,
            `NOAA cancelled the threat message (${at(closing.bulletin.issued)})`,
            `A NOAA cancelou a mensagem de ameaça (${at(closing.bulletin.issued)})`,
          )
        : closing
          ? t(
              `NOAA dio por terminada la amenaza (${at(closing.bulletin.issued)})`,
              `NOAA says the threat has ended (${at(closing.bulletin.issued)})`,
              `A NOAA deu a ameaça por encerrada (${at(closing.bulletin.issued)})`,
            )
          : t(
              'Sin mensajes de amenaza en las últimas 6 horas',
              'No threat messages in the last 6 hours',
              'Sem mensagens de ameaça nas últimas 6 horas',
            ),
  }[statusState];
  // Never a calm signal from an answer that cannot confirm it.
  const signal: Signal =
    statusState === 'none'
      ? 'none'
      : statusState === 'open'
        ? 'listed'
        : statusState === 'checking' && busy
          ? 'pending'
          : 'unknown';
  // NOAA's state in the one vocabulary: checked, no response or offline, with its time. Polled
  // every minute, so an answer older than a few minutes is no longer current.
  const line = sourceLine({
    checked: data?.fetched ?? null,
    failed: error,
    failedAt,
    online,
    old: !!data && now - data.fetched > 3 * 60000,
    now,
    lang,
  });
  return (
    <div className="f-stack grid gap-8" data-gap="lg">
      {/* The answer first: what NOAA's products say now, when they were checked, and the limits. */}
      <div className="f-stack grid gap-2" data-gap="sm">
        <div role="status">
          <List
            label={t('Información de tsunami', 'Tsunami information', 'Informação sobre tsunami')}
          >
            <ListRow
              lead={
                <StatusIcon
                  state={signal}
                  level={lead?.notice.level}
                  icon={<WavesIcon className="size-4" />}
                />
              }
              title={statusHeadline}
              badge={lead && <Badge level={lead.notice.level}>{lead.notice.label[idx]}</Badge>}
              meta={
                <SourceStamp
                  issuer="NOAA/PTWC"
                  state={statusState === 'partial' ? 'stale' : lineStamp(line.state)}
                >
                  {line.text}
                </SourceStamp>
              }
              trail={
                <IconButton
                  label={t(
                    'Actualizar boletines de tsunami',
                    'Refresh tsunami bulletins',
                    'Atualizar boletins de tsunami',
                  )}
                  disabled={busy}
                  onClick={onRefresh}
                >
                  <RotateCwIcon className="size-4" aria-hidden="true" />
                </IconButton>
              }
            />
          </List>
        </div>
        <Note>
          {t(
            'Estos productos internacionales no confirman el estado de una alerta en tu ubicación: confírmalo con la autoridad local.',
            'These international products do not confirm alert status at your location: check with local authorities.',
            'Estes produtos internacionais não confirmam o status de um alerta na sua localização: confirme com a autoridade local.',
          )}
          {statusState === 'none' &&
            ` ${t('Esto no confirma ausencia de peligro.', 'This does not confirm absence of danger.', 'Isso não confirma ausência de perigo.')}`}
        </Note>
      </div>
      {current.length > 0 && (
        <section className="f-section @container grid gap-3" aria-labelledby="fw-tsunami-current">
          <h2
            className="f-section-title m-0 text-base leading-snug font-semibold"
            id="fw-tsunami-current"
          >
            {t('Mensajes recientes', 'Recent messages', 'Mensagens recentes')}
          </h2>
          <List>{current.map(renderBulletin)}</List>
        </section>
      )}
      <section
        className="f-stack grid gap-4"
        aria-label={t('En la costa', 'On the coast', 'Na costa')}
      >
        <SafetyNotice>
          {t(
            'Si estás en la costa y sientes un sismo fuerte o largo, ves que el mar se retira o sube de golpe, u oyes un rugido:',
            'If you are on the coast and feel strong or long shaking, see the sea suddenly pull back or rise, or hear a roar:',
            'Se você está na costa e sente um terremoto forte ou longo, vê o mar recuar ou subir de repente, ou ouve um rugido:',
          )}
        </SafetyNotice>
        <Steps
          items={[
            {
              id: 'protect',
              text: t(
                'Protégete mientras tiembla.',
                'Protect yourself while it shakes.',
                'Proteja-se enquanto treme.',
              ),
            },
            {
              id: 'go',
              text: t(
                'Cuando pare, ve a pie a un lugar alto o tierra adentro.',
                'When it stops, go on foot to high ground or inland.',
                'Quando parar, vá a pé para um lugar alto ou para o interior.',
              ),
            },
            {
              id: 'signs',
              text: t(
                'Sigue las señales de evacuación. No esperes una alerta oficial.',
                'Follow evacuation signs. Do not wait for an official alert.',
                'Siga as placas de evacuação. Não espere um alerta oficial.',
              ),
            },
          ]}
        />
        <Actions>
          <OutLink href="https://www.weather.gov/safety/tsunami-during">
            {t('Fuente: NOAA', 'Source: NOAA', 'Fonte: NOAA')}
          </OutLink>
        </Actions>
      </section>
      <div className="f-stack grid gap-2" data-gap="sm">
        <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
          <p>
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
                        `You are about ${formatDistance(distance, lang)} from the coast (approximate).`,
                        `Você está a cerca de ${Math.round(distance)} km da costa (aproximado).`,
                      )
                    : t(
                        `Distancia aproximada a la costa: ${Math.round(distance)} km. Esto no indica si la zona es segura.`,
                        `Approximate distance to the coast: ${formatDistance(distance, lang)}. This does not say whether the area is safe.`,
                        `Distância aproximada até a costa: ${Math.round(distance)} km. Isso não indica se a área é segura.`,
                      )}
          </p>
        </div>
        {!geo && (
          <Button
            variant="secondary"
            icon={<CrosshairIcon className="size-4" aria-hidden="true" />}
            onClick={onLocate}
            disabled={locating}
          >
            {locating
              ? t('Buscando ubicación…', 'Finding location…', 'Buscando localização…')
              : t('Usar mi ubicación', 'Use my location', 'Usar minha localização')}
          </Button>
        )}
      </div>
      {nws && (
        <section className="f-section @container grid gap-3" aria-labelledby="fw-nws-title">
          <h2
            className="f-section-title m-0 text-base leading-snug font-semibold"
            id="fw-nws-title"
          >
            {t(
              'Avisos de tsunami del NWS · EE. UU. y territorios',
              'NWS tsunami alerts · U.S. and territories',
              'Avisos de tsunami do NWS · EUA e territórios',
            )}
          </h2>
          {nws.failed && (
            <div role="status">
              <SourceStamp issuer="NWS" state="error">
                <span>
                  {failingLabel({
                    checked: nws.data ? (nws.checked ?? null) : null,
                    failedAt: nws.failedAt,
                    now,
                    lang,
                  })}
                  .{' '}
                  {t(
                    'No podemos confirmar si hay avisos.',
                    'We cannot confirm whether alerts exist.',
                    'Não podemos confirmar se há avisos.',
                  )}
                </span>
              </SourceStamp>
            </div>
          )}
          {!nwsTsunami && !nws.failed && (
            <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
              <p>{t('Consultando NWS…', 'Checking NWS…', 'Consultando o NWS…')}</p>
            </div>
          )}
          {nwsTsunami && nwsTsunami.length === 0 && !nws.failed && (
            <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
              <p>
                {t(
                  'El NWS no tiene avisos de tsunami activos. Esto no confirma ausencia de peligro.',
                  'The NWS has no active tsunami alerts. This does not confirm there is no danger.',
                  'O NWS não tem avisos de tsunami ativos. Isso não confirma ausência de perigo.',
                )}
              </p>
            </div>
          )}
          {nwsTsunami && nwsTsunami.length > 0 && (
            <List label="NWS">
              {nwsTsunami.map((a) => {
                const id = `fw-nws-tsunami-${a.id}`.replace(/[^\w-]/g, '_');
                return (
                  <ExpandRow
                    key={id}
                    id={id}
                    open={!toggled.has(id)}
                    onToggle={() => toggle(id)}
                    lead={
                      // An alert in force; its name says which (warning, advisory, watch).
                      <StatusIcon
                        state="listed"
                        level={1}
                        icon={<WavesIcon className="size-4" />}
                      />
                    }
                    title={nwsEventLabels[a.event][langIndex(lang)]}
                    meta={`NWS · ${issued(a.sent)}${a.expires ? ` · ${t('hasta', 'until', 'até')} ${at(a.expires)}` : ''}`}
                  >
                    {a.headline && <p lang="en">{a.headline}</p>}
                    <p lang="en">{a.area}</p>
                    <Actions>
                      <OutLink href="https://www.tsunami.gov/">
                        {t(
                          'Consultar última actualización',
                          'Check latest update',
                          'Consultar última atualização',
                        )}
                      </OutLink>
                    </Actions>
                  </ExpandRow>
                );
              })}
            </List>
          )}
          <Note>
            {t(
              'Fuente: NOAA/National Weather Service. Cubre solo EE. UU., sus territorios y aguas. Revisa las zonas indicadas en cada aviso.',
              'Source: NOAA/National Weather Service. Covers only the U.S., its territories and waters. Check the areas listed in each alert.',
              'Fonte: NOAA/National Weather Service. Cobre só os EUA, seus territórios e águas. Confira as áreas indicadas em cada aviso.',
            )}
          </Note>
        </section>
      )}
      {data && (
        <section className="f-section @container grid gap-3" aria-labelledby="fw-tsunami-archive">
          <div className="f-section-head flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2
              className="f-section-title m-0 text-base leading-snug font-semibold"
              id="fw-tsunami-archive"
            >
              {t(
                'Archivo de comunicados NOAA',
                'NOAA statement archive',
                'Arquivo de comunicados da NOAA',
              )}
            </h2>
            <span className="f-section-aside text-sm text-muted-foreground data-[state=stale]:text-amber-900">
              {archived.length}
            </span>
          </div>
          <Note>
            {t(
              'Último comunicado recibido de cada producto. Incluye información y cierres de eventos anteriores; no es una lista de alertas activas ni un historial completo.',
              'Latest statement received for each product. Includes information and closures for past events; this is not a list of active alerts or a complete history.',
              'Último comunicado recebido de cada produto. Inclui informações e encerramentos de eventos anteriores; não é uma lista de alertas ativos nem um histórico completo.',
            )}
          </Note>
          {archived.length > 0 && <List>{archived.map(renderBulletin)}</List>}
        </section>
      )}
      <Actions>
        {authority && <OutLink href={authority.url}>{authority.name}</OutLink>}
        <OutLink href="https://www.tsunami.gov/">NOAA</OutLink>
        <OutLink href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-coastline/">
          {t(
            'Cartografía aproximada: Natural Earth',
            'Approximate mapping: Natural Earth',
            'Cartografia aproximada: Natural Earth',
          )}
        </OutLink>
      </Actions>
      <ScopeNote>
        {t(
          'Umbral orientativo de proximidad: 20 km; no delimita inundación. Cartografía generalizada, puede omitir islas y tener errores de varios km. No es un mapa de evacuación ni de inundación. La estimación se calcula en tu navegador.',
          `The ${formatDistance(20, lang)} proximity threshold does not define inundation. Generalized mapping may omit islands and be inaccurate by several miles. It is not an evacuation or inundation map. The estimate is calculated in your browser.`,
          'Limite orientativo de proximidade: 20 km; não delimita inundação. Cartografia generalizada, pode omitir ilhas e ter erros de vários km. Não é um mapa de evacuação nem de inundação. A estimativa é calculada no seu navegador.',
        )}
      </ScopeNote>
    </div>
  );
}
