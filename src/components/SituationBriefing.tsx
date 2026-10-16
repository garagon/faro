import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { ActivityIcon, DropletIcon, MountainIcon, WavesIcon, WindIcon } from 'lucide-react';
import OfficialNow, {
  NationalWarningRow,
  officialRowId,
  type CivilFeed,
  type NationalFeed,
} from './OfficialNow.tsx';
import { alertLevelLabels, alertLevelShort, alertTitle } from '../lib/alerts.ts';
import {
  nationalSignal,
  readableEvent,
  severityLabels,
  severityLevel,
  type CapSeverity,
} from '../lib/national.ts';
import { leadingWarnings, type HazardKey, type HazardStatus } from '../lib/hazards.ts';
import { readablePlace } from '../lib/tsunami.ts';
import type { Quake } from '../lib/domain.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import { checkedLabel } from '../lib/time.ts';
import { capitalize, sourceLine } from '../lib/sourceStatus.ts';
import { scrollMotion } from '../lib/motion.ts';
import type { Destination, OfficialLink } from '../data/destinations/types.ts';
import { langIndex, pick, type Lang, type Localized } from '../lib/i18n.ts';
import {
  Badge,
  Button,
  List,
  ListRow,
  Note,
  ScopeNote,
  ScreenHead,
  Section,
  SourceStamp,
  StatusIcon,
  type Signal,
} from '../ui/index.ts';

export type BriefingTarget = HazardKey;
type Props = {
  lang: Lang;
  countryName: string;
  quakes: {
    count: number;
    largest?: Quake;
    latest?: Quake;
    /** Never received and the device is offline: there is nothing to show yet. */
    offline?: boolean;
    period: string;
    provider: string;
    loading: boolean;
    failed: boolean;
    /** When the last failed request was made, while the catalogue is failing. */
    failedAt?: number | null;
    /** The last answer is old (or the source is failing): when it was received. */
    staleSince?: number;
    /** The source answers, but its newest record is more than a day old: that record's time. */
    quietSince?: number;
  };
  /** An urgent official message shown above everything else (a recent tsunami threat). */
  alert?: ReactNode;
  /**
   * Whether Faro is checking the sources right now. `live` only while online and the last
   * check succeeded recently; otherwise the time of the last good data.
   */
  monitor: {
    state: 'live' | 'stale' | 'offline' | 'failed' | 'checking';
    checked: number | null;
    /** When the last failed request was made, while the catalogue is failing. */
    failedAt?: number | null;
  };
  /** Every source this screen reads, and whether its last request failed: summed up in the head. */
  sources: { name: string; failed: boolean }[];
  /** Asks the failing sources again. */
  onRetry: () => void;
  now: number;
  /** Opens the Sources screen (how to read the data, when each source answered). */
  onSources: () => void;
  /** The call button (or the way to choose a country). */
  call: ReactNode;
  /** Tell people, what to do now, the embassy, and the natural tsunami warning. */
  actions: ReactNode;
  /** The map and, on wide screens, the latest earthquakes: beside the rest from 1200 px. */
  map: ReactNode;
  response?: ReactNode;
  hazards: HazardStatus[];
  /** Warnings from the national meteorological service: null while loading, absent without a feed. */
  national?: NationalFeed;
  /** Civil-protection posts (Panama). */
  civil?: CivilFeed;
  /** A warning in force that mentions flooding or rising rivers: its row in "Official now". */
  floodAdvice?: { agency: string; rowId: string; event?: string; severity?: CapSeverity };
  /**
   * Recent civil-protection posts that mention rain or flooding (they have no expiry): how many,
   * and the newest, which the row opens in "Official now".
   */
  floodNotice?: {
    agency: string;
    title: string;
    published: number;
    rowId: string;
    count: number;
  };
  /** Active NHC cyclones in its basins, when the place is in them. */
  stormsInBasin?: number;
  /** The place is in the NHC basins: its cyclone row also reads the NHC, even before it answers. */
  nhcArea?: boolean;
  notes?: Partial<Record<HazardKey, string>>;
  authority?: OfficialLink;
  weather?: OfficialLink;
  /** Opens Faro's flood steps (from a Spanish-only flood warning, for EN/PT readers). */
  onFloodGuide?: () => void;
  /** A U.S. area, where Faro reads NWS alerts directly. */
  nwsArea?: boolean;
  /** Leads a hazard row when a national service has alerts in force (NWS flood or tropical). */
  leads?: Partial<Record<HazardKey, string>>;
  services?: Destination['services'];
  onOpen: (target: BriefingTarget) => void;
};

const icons: Record<HazardKey, ReactNode> = {
  earthquake: <ActivityIcon className="size-4" />,
  tsunami: <WavesIcon className="size-4" />,
  cyclone: <WindIcon className="size-4" />,
  flood: <DropletIcon className="size-4" />,
  volcano: <MountainIcon className="size-4" />,
};
const names: Record<HazardKey, Localized> = {
  earthquake: ['Sismos', 'Earthquakes', 'Terremotos'],
  tsunami: ['Tsunami', 'Tsunami', 'Tsunami'],
  cyclone: ['Ciclones', 'Cyclones', 'Ciclones'],
  flood: ['Inundaciones', 'Floods', 'Inundações'],
  volcano: ['Volcanes', 'Volcanoes', 'Vulcões'],
};
// GDACS levels on Faro's official scale. Green is listed without a warning colour or a badge.
const levelOf = (level: HazardStatus['level']): 2 | 3 | undefined =>
  level === 'red' ? 3 : level === 'orange' ? 2 : undefined;
// Rows with an official level lead, the most severe first; the rest keep their usual order.
const rankOf = (level?: 1 | 2 | 3) => (level === 3 ? 0 : level === 2 ? 1 : level === 1 ? 2 : 3);

/**
 * The home for one place, in order of need: an urgent official message if there is one, the call,
 * the actions, one row per hazard (warnings in force first), the map, then what the authorities
 * are saying. When a warning of level 2 or more is in force, the hazard rows come before the
 * actions, and the map follows both. Each row states what its source lists; none of it is a
 * safety rating. Detail (lists, filters, bulletins) lives on its own page.
 */
export default function SituationBriefing(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt),
    idx = langIndex(p.lang);
  const regions = new Intl.DisplayNames([p.lang], { type: 'region' });
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  // The order shown while a finger or pointer is down on the rows or the actions, and when the
  // rows last moved: a new order waits for the finger to lift, never more than a moment.
  const [held, setHeld] = useState<{ keys: string; severe: boolean } | null>(null);
  const movedAt = useRef(-Infinity),
    lastOrder = useRef('');
  // A tap that lands just after the rows moved was aimed at the row that was there before: it is
  // ignored rather than opening another hazard. Keyboard activation follows focus and always works.
  const opens = (action: () => void) => (e?: MouseEvent) => {
    if (e && e.detail > 0 && performance.now() - movedAt.current < 600) return;
    action();
  };
  const toggle = (rowId: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  // Opens one message in "Official now" and brings it into view with focus on it.
  const reveal = (rowId: string) => {
    setOpen((prev) => new Set(prev).add(rowId));
    setTimeout(() => {
      const row = document.getElementById(rowId);
      row?.scrollIntoView({ block: 'center', behavior: scrollMotion() });
      row?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    }, 60);
  };
  const q = p.quakes;
  const offline = p.monitor.state === 'offline';
  // One age grammar across the app ("hace 18 min", "18m ago"); a number stays with its unit.
  const ago = (n: number) => ageLabel(n, p.now, p.lang).replace(/(\d) (?=\S)/g, '$1 ');
  const lastData = (n: number) => {
    const at = checkedLabel(n, p.now, p.lang);
    return t(`último dato ${at}`, `last data ${at}`, `último dado ${at}`);
  };
  /**
   * A source in a row whose data is not current, in the words of the one vocabulary: named, then
   * checking, no response, or the time of the data still shown. The head and the offline strip
   * say the rest once, so a failure is not repeated with its time in every row.
   */
  const fromSource = (
    name: string,
    s: { checked?: number | null; failed?: boolean; pending?: boolean },
  ) =>
    [
      name,
      offline
        ? ''
        : s.pending
          ? t('consultando…', 'checking…', 'consultando…')
          : s.failed
            ? t('sin respuesta', 'no response', 'sem resposta')
            : '',
      s.checked ? lastData(s.checked) : offline ? t('sin datos', 'no data', 'sem dados') : '',
    ]
      .filter(Boolean)
      .join(' · ');
  // Text quoted from a source in another language, marked so it is not read as Faro's.
  const quoted = (text: string, from: 'es' | 'en') => (
    <>
      <span lang={from}>{text}</span>
      {from === 'es'
        ? t('', ' (in Spanish)', ' (em espanhol)')
        : t(' (en inglés)', '', ' (em inglês)')}
    </>
  );
  // The national service's state, added to its warning rows while it is not current: they may
  // have been lifted or raised since.
  const nationalOld =
    p.national?.checked && (p.national.failed || p.national.stale || offline)
      ? [
          !offline && p.national.failed ? t('sin respuesta', 'no response', 'sem resposta') : '',
          lastData(p.national.checked),
        ]
          .filter(Boolean)
          .join(' · ')
      : '';

  // GDACS rarely lists floods: when the national service that does cannot be read, the row says
  // that instead of "no international alerts".
  const national = p.national ? nationalSignal(p.national) : null;
  const floodGap =
    p.national && (national === 'failed' || national === 'offline' || national === 'unconfirmed')
      ? {
          status:
            national === 'unconfirmed' && !p.national.failed
              ? t(
                  `Avisos de ${p.national.agency} sin confirmar`,
                  `${p.national.agency} warnings not confirmed`,
                  `Avisos do ${p.national.agency} não confirmados`,
                )
              : fromSource(p.national.agency, {
                  checked: p.national.checked,
                  failed: p.national.failed,
                }),
          check:
            !offline && p.weather?.url
              ? `${t('revisa', 'check', 'consulte')} ${new URL(p.weather.url).hostname.replace(/^www\./, '')}`
              : '',
        }
      : null;

  type Row = { key: string; rank: number; node: ReactNode };
  const rows: Row[] = [];

  // Old data is never shown as the current picture: no counts, no "none", a "not confirmed" dot.
  const quakeSignal =
    q.offline || q.loading || q.staleSince || (q.failed && !q.count)
      ? 'unknown'
      : q.largest
        ? 'on'
        : 'off';
  const quakeState: Signal =
    quakeSignal === 'on'
      ? 'listed'
      : quakeSignal === 'off'
        ? 'none'
        : q.loading && !q.failed && !q.offline
          ? 'pending'
          : 'unknown';
  const latestQuake = q.latest
    ? `${t('Último', 'Latest', 'Último')} M${q.latest.mag?.toFixed(1) ?? '—'} ${ago(q.latest.time)}`
    : '';
  rows.push({
    key: 'earthquake',
    rank: 3,
    node: (
      <ListRow
        key="earthquake"
        lead={<StatusIcon state={quakeState} icon={icons.earthquake} />}
        title={names.earthquake[idx]}
        meta={
          q.offline
            ? fromSource(q.provider, {})
            : q.loading
              ? fromSource(q.provider, { pending: !q.failed, failed: q.failed })
              : q.staleSince
                ? // The last known earthquake, with the time of the data it comes from.
                  [latestQuake, fromSource(q.provider, { checked: q.staleSince, failed: q.failed })]
                    .filter(Boolean)
                    .join(' · ')
                : q.failed && !q.count
                  ? fromSource(q.provider, { failed: true })
                  : q.latest
                    ? `${latestQuake} · ${q.count} ${t('en', 'in', 'em')} ${q.period}`
                    : [
                        t(`Ninguno en ${q.period}`, `None in ${q.period}`, `Nenhum em ${q.period}`),
                        q.quietSince
                          ? t(
                              `${q.provider}: registro más reciente ${ago(q.quietSince)}`,
                              `${q.provider}: most recent record ${ago(q.quietSince)}`,
                              `${q.provider}: registro mais recente ${ago(q.quietSince)}`,
                            )
                          : q.provider,
                      ].join(' · ')
        }
        onClick={opens(() => p.onOpen('earthquake'))}
      />
    ),
  });

  // Every national warning in force at level 2 or 3 has its own row, in the agency's words; the
  // first that mentions flooding is the flood row, at any level.
  const leading = p.national?.warnings ? leadingWarnings(p.national.warnings) : [];
  for (const w of leading) {
    const id = officialRowId('w', w.id);
    if (id === p.floodAdvice?.rowId) continue;
    rows.push({
      key: id,
      rank: rankOf(severityLevel[w.severity]),
      node: (
        <NationalWarningRow
          key={id}
          warning={w}
          agency={p.national!.agency}
          lang={p.lang}
          extra={nationalOld}
          onOpen={opens(() => reveal(id))}
        />
      ),
    });
  }

  for (const h of p.hazards) {
    if (h.key === 'flood' && p.floodAdvice) {
      const advice = p.floodAdvice;
      const level = (advice.severity && severityLevel[advice.severity]) ?? 1;
      rows.push({
        key: h.key,
        rank: rankOf(level),
        node: (
          <ListRow
            key={h.key}
            lead={<StatusIcon state="listed" level={level} icon={icons.flood} />}
            title={names.flood[idx]}
            badge={
              <Badge level={level}>
                {advice.severity
                  ? severityLabels[advice.severity][idx]
                  : t('Aviso', 'Warning', 'Aviso')}
              </Badge>
            }
            // The agency's own name for the warning, as in "Official now", marked when it is
            // not in the reader's language.
            meta={
              <>
                {advice.event ? (
                  <>
                    {advice.agency} · {quoted(readableEvent(advice.event), 'es')}
                  </>
                ) : (
                  t(
                    `${advice.agency} advierte posibles inundaciones`,
                    `${advice.agency} warns of possible flooding`,
                    `${advice.agency} alerta para possíveis inundações`,
                  )
                )}
                {nationalOld && ` · ${nationalOld}`}
              </>
            }
            onClick={opens(() => reveal(advice.rowId))}
          />
        ),
      });
      continue;
    }
    if (h.key === 'flood' && p.floodNotice) {
      // A post has no expiry: the row says how many mention rain and when the newest was
      // published, never "in force". Its headline is in "Official now", where the row opens it.
      const notice = p.floodNotice;
      rows.push({
        key: h.key,
        rank: 3,
        node: (
          <ListRow
            key={h.key}
            lead={<StatusIcon state="listed" icon={icons.flood} />}
            title={names.flood[idx]}
            meta={`${
              notice.count === 1
                ? t(
                    `${notice.agency}: 1 comunicado`,
                    `${notice.agency}: 1 post`,
                    `${notice.agency}: 1 comunicado`,
                  )
                : t(
                    `${notice.agency}: ${notice.count} comunicados`,
                    `${notice.agency}: ${notice.count} posts`,
                    `${notice.agency}: ${notice.count} comunicados`,
                  )
            } · ${ago(notice.published)}`}
            onClick={opens(() => reveal(notice.rowId))}
          />
        ),
      });
      continue;
    }
    const gap = h.key === 'flood' && h.state === 'none' ? floodGap : null;
    // A national service's alerts in force (NWS) lead over an empty international list.
    const lead = h.state === 'listed' ? undefined : p.leads?.[h.key];
    // The source behind the row's state (GDACS for cyclones, floods and volcanoes).
    const source = h.key === 'tsunami' ? 'NOAA/PTWC' : 'GDACS';
    // Offline is said by the strip; a failing source is named in its row.
    const failing = !offline && !!h.failedAt;
    // The open NOAA message: the same words, level and badge as the banner and the Tsunami tab.
    const notice = h.key === 'tsunami' ? h.notice : undefined;
    const level: 1 | 2 | 3 | undefined = notice
      ? notice.level
      : lead
        ? 1
        : h.state === 'listed'
          ? levelOf(h.level)
          : undefined;
    const state: Signal = notice || lead ? 'listed' : gap ? 'unknown' : h.state;
    // While loading, every source the row will read is named: the NHC and national services
    // answer for cyclones and floods along with GDACS.
    const loadingFrom = new Intl.ListFormat(p.lang, { type: 'conjunction' }).format(
      h.key === 'tsunami'
        ? ['NOAA/PTWC']
        : [
            h.key === 'cyclone' && (p.nhcArea || p.stormsInBasin !== undefined) ? 'NHC' : '',
            (h.key === 'cyclone' || h.key === 'flood') && p.nwsArea ? 'NWS' : '',
            h.key === 'flood' ? (p.national?.agency ?? '') : '',
            'GDACS',
          ].filter(Boolean),
    );
    // Listed data from a source that is failing or offline is the last data, with its time.
    const old =
      failing || offline ? fromSource(source, { checked: h.checked, failed: failing }) : '';
    const meta: ReactNode =
      notice && h.bulletin ? (
        <>
          NOAA · {quoted(readablePlace(h.bulletin.place), 'en')} · {ago(h.bulletin.issued)}
          {/* NOAA is already named: only its state is added. */}
          {old && ` · ${fromSource('', { checked: h.checked, failed: failing })}`}
        </>
      ) : lead ? (
        lead
      ) : gap ? (
        [gap.status, gap.check].filter(Boolean).join(' · ')
      ) : h.state === 'pending' ? (
        fromSource(loadingFrom, { pending: true })
      ) : h.state === 'unknown' ? (
        fromSource(source, { checked: h.checked, failed: failing })
      ) : h.state === 'none' ? (
        [
          h.key === 'tsunami'
            ? t(
                'Sin mensajes de amenaza en 6 h',
                'No threat messages in 6 h',
                'Sem mensagens de ameaça em 6 h',
              )
            : h.key === 'cyclone' && p.stormsInBasin
              ? // The basin count comes once, from the NHC note.
                t('Sin alerta', 'No alert', 'Sem alerta')
              : t(
                  'Sin alertas internacionales',
                  'No international alerts',
                  'Sem alertas internacionais',
                ),
          h.recent
            ? t(`${h.recent} en 14 días`, `${h.recent} in 14 days`, `${h.recent} em 14 dias`)
            : '',
          p.notes?.[h.key],
        ]
          .filter(Boolean)
          .join(' · ')
      ) : (
        [
          h.top
            ? alertTitle(h.top, (c) => regions.of(c), p.lang)
            : alertLevelLabels[h.level as 'green'][idx].split(' · ')[0],
          // Green has no badge: its meaning is said in the caption.
          h.level === 'green' ? alertLevelShort.green[idx] : '',
          p.notes?.[h.key],
          old,
        ]
          .filter(Boolean)
          .join(' · ')
      );
    rows.push({
      key: h.key,
      rank: rankOf(level),
      node: (
        <ListRow
          key={h.key}
          lead={<StatusIcon state={state} level={level} icon={icons[h.key]} />}
          title={names[h.key][idx]}
          badge={
            notice ? (
              <Badge level={notice.level}>{notice.label[idx]}</Badge>
            ) : lead ? (
              <Badge level={1}>{t('En vigor', 'In force', 'Em vigor')}</Badge>
            ) : level ? (
              <Badge level={level}>{alertLevelShort[h.level as 'orange'][idx]}</Badge>
            ) : undefined
          }
          meta={meta}
          onClick={opens(() => p.onOpen(h.key))}
        />
      ),
    });
  }
  // Rows with an official level first, most severe first; the rest keep their usual order. Every
  // leading row carries a badge, and the head counts exactly those.
  const sorted = rows.map((r, n) => ({ ...r, n })).sort((a, b) => a.rank - b.rank || a.n - b.n);
  const withLevel = rows.filter((r) => r.rank < 3).length;
  const severeNow = rows.some((r) => r.rank < 2);
  // Under a finger the rows keep their place; the new order applies as soon as it lifts.
  const heldRows = held?.keys.split(' ');
  const ordered =
    heldRows && heldRows.length === sorted.length && sorted.every((r) => heldRows.includes(r.key))
      ? heldRows.map((key) => sorted.find((r) => r.key === key)!)
      : sorted;
  const severe = held ? held.severe : severeNow;
  const order = `${ordered.map((r) => r.key).join(' ')}|${severe}`;
  const hold = () => {
    if (!held) setHeld({ keys: ordered.map((r) => r.key).join(' '), severe });
  };
  useLayoutEffect(() => {
    if (lastOrder.current && lastOrder.current !== order) movedAt.current = performance.now();
    lastOrder.current = order;
  }, [order]);
  useEffect(() => {
    if (!held) return;
    let later = 0;
    const release = (delay: number) => () => {
      clearTimeout(later);
      later = window.setTimeout(() => setHeld(null), delay);
    };
    // After the click that ends the tap (on phones it follows the lifted finger), so the tap
    // opens what was under the finger; at once when the touch turns into a scroll.
    const lifted = release(350),
      done = release(0);
    const cap = window.setTimeout(() => setHeld(null), 2000);
    window.addEventListener('pointerup', lifted);
    window.addEventListener('pointercancel', done);
    window.addEventListener('click', done);
    return () => {
      clearTimeout(later);
      clearTimeout(cap);
      window.removeEventListener('pointerup', lifted);
      window.removeEventListener('pointercancel', done);
      window.removeEventListener('click', done);
    };
  }, [held]);

  // The sources behind the rows, named once under the list instead of in every row.
  const sources = new Intl.ListFormat(p.lang, { type: 'conjunction' }).format(
    [
      q.provider,
      'NOAA/PTWC',
      'GDACS',
      p.nhcArea || p.stormsInBasin !== undefined ? 'NHC' : '',
      p.nwsArea ? 'NWS' : '',
      p.national?.agency ?? '',
    ].filter(Boolean),
  );
  // The head says once when Faro checked, or sums up the sources that do not answer, with one
  // way to ask them again. Offline, the strip above says it; checking is never in amber.
  const failingSources = offline ? [] : p.sources.filter((s) => s.failed);
  const summary = t(
    `${failingSources.length} de ${p.sources.length} fuentes sin respuesta`,
    `${failingSources.length} of ${p.sources.length} sources not responding`,
    `${failingSources.length} de ${p.sources.length} fontes sem resposta`,
  );
  const head = offline ? undefined : failingSources.length ? (
    <>
      <SourceStamp state="error">{summary}</SourceStamp>{' '}
      <Button variant="ghost" onClick={p.onRetry}>
        {t('Reintentar', 'Retry', 'Tentar de novo')}
      </Button>
    </>
  ) : p.monitor.state === 'checking' || !p.monitor.checked ? (
    <SourceStamp>{t('Consultando…', 'Checking…', 'Consultando…')}</SourceStamp>
  ) : (
    <SourceStamp>
      {capitalize(
        sourceLine({
          checked: p.monitor.checked,
          failed: false,
          online: true,
          now: p.now,
          lang: p.lang,
        }).text,
      )}
    </SourceStamp>
  );
  // Whether anything received earlier is on screen, so "the last data" is only said when it is.
  const anyData =
    !!p.monitor.checked ||
    p.hazards.some((h) => h.checked) ||
    !!p.national?.checked ||
    !!p.civil?.checked;

  const happening = (
    <Section
      id="fw-now"
      title={t('Qué está pasando', 'What is happening', 'O que está acontecendo')}
      aside={
        withLevel
          ? withLevel === 1
            ? t('1 aviso', '1 alert', '1 aviso')
            : t(`${withLevel} avisos`, `${withLevel} alerts`, `${withLevel} avisos`)
          : undefined
      }
    >
      {/* The visible state ticks; screen readers hear only a change of state. */}
      <p className="sr-only" role="status">
        {offline
          ? anyData
            ? t(
                'Sin conexión: se muestran los últimos datos.',
                'Offline: showing the last data.',
                'Sem conexão: mostrando os últimos dados.',
              )
            : t(
                'Sin conexión: todavía no hay datos de las fuentes.',
                'Offline: no data from the sources yet.',
                'Sem conexão: ainda não há dados das fontes.',
              )
          : failingSources.length
            ? `${summary}.`
            : p.monitor.state === 'live'
              ? t('Datos oficiales en vivo.', 'Official data live.', 'Dados oficiais ao vivo.')
              : p.monitor.state === 'stale'
                ? t(
                    'Los sismos no se están actualizando.',
                    'Earthquake data is not updating.',
                    'Os terremotos não estão sendo atualizados.',
                  )
                : ''}
      </p>
      <List label={t('Peligros', 'Hazards', 'Perigos')}>{ordered.map((r) => r.node)}</List>
      <Note
        more={
          <button
            type="button"
            className="f-inline-link inline cursor-pointer rounded-sm border-0 bg-transparent p-0 font-medium text-foreground underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={p.onSources}
          >
            {t('Cómo leer esto', 'How to read this', 'Como ler isto')}
          </button>
        }
      >
        {t('Fuentes', 'Sources', 'Fontes')}: {sources}.{' '}
        {t(
          'Faro no es un sistema de alerta temprana. Que una fuente no liste eventos no significa que no haya peligro. Sigue a las autoridades locales',
          'Faro is not an early warning system. A source listing no events does not mean there is no danger. Follow local authorities',
          'O Faro não é um sistema de alerta antecipado. Uma fonte não listar eventos não significa que não haja perigo. Siga as autoridades locais',
        )}
        {/* Without a named agency the sentence ends here, never on an empty colon. */}
        {p.authority || p.weather ? ': ' : ''}
        {p.authority && (
          <a href={p.authority.url} target="_blank" rel="noreferrer">
            {p.authority.name}
          </a>
        )}
        {p.authority && p.weather && t(' y ', ' and ', ' e ')}
        {p.weather && (
          <a href={p.weather.url} target="_blank" rel="noreferrer">
            {p.weather.name}
          </a>
        )}
        .
      </Note>
    </Section>
  );
  const side = (
    <div key="side" data-side="">
      {p.map}
    </div>
  );
  const main: ReactNode[] = [
    <ScreenHead
      key="head"
      titleId="fw-brief-title"
      title={t('Situación', 'Situation', 'Situação')}
      aside={head}
    />,
    p.alert ? <div key="alert">{p.alert}</div> : null,
    <div key="call">{p.call}</div>,
    ...(severe
      ? [
          <div key="now" onPointerDown={hold}>
            {happening}
          </div>,
          <div key="actions" onPointerDown={hold}>
            {p.actions}
          </div>,
        ]
      : [
          <div key="actions" onPointerDown={hold}>
            {p.actions}
          </div>,
          <div key="now" onPointerDown={hold}>
            {happening}
          </div>,
        ]),
    p.response ? (
      <Section
        key="response"
        id="fw-response"
        title={t('Respuesta oficial', 'Official response', 'Resposta oficial')}
      >
        <List>{p.response}</List>
      </Section>
    ) : null,
    <OfficialNow
      key="official"
      lang={p.lang}
      now={p.now}
      online={!offline}
      national={p.national}
      civil={p.civil}
      // NWS areas are read separately (the NWS tab): never "no format Faro can read". With a
      // national feed, the agency's site is where to look when it cannot be read.
      weather={p.nwsArea ? undefined : p.weather}
      services={p.services}
      open={open}
      onToggle={toggle}
      onFloodGuide={p.onFloodGuide}
    />,
    <ScopeNote key="scope">
      {t(
        'Faro consulta las fuentes oficiales solo mientras está abierto. No llama ni avisa por ti, y tus datos quedan en este navegador.',
        'Faro checks the official sources only while it is open. It does not call or alert anyone for you, and your data stays in this browser.',
        'O Faro consulta as fontes oficiais só enquanto está aberto. Não liga nem avisa ninguém por você, e seus dados ficam neste navegador.',
      )}
    </ScopeNote>,
  ].filter(Boolean);
  // On phones the map follows "What is happening" and the actions, whichever comes last, so the
  // actions never fall below it on a bad day; on wide screens it spans the main column.
  const keyAt = (key: string) => main.findIndex((n) => (n as { key?: string }).key === key);
  const after = Math.max(keyAt('now'), keyAt('actions'));
  const items = [...main.slice(0, after + 1), side, ...main.slice(after + 1)];
  return (
    <div
      className="f-dashboard grid max-w-2xl grid-cols-[minmax(0,1fr)] items-start gap-8 @min-[1200px]/app:max-w-none @min-[1200px]/app:grid-cols-[minmax(0,42rem)_minmax(20rem,1fr)] @min-[1200px]/app:*:col-start-1 @min-[1200px]/app:[&>[data-side]]:sticky @min-[1200px]/app:[&>[data-side]]:top-8 @min-[1200px]/app:[&>[data-side]]:col-start-2 @min-[1200px]/app:[&>[data-side]]:row-[1/span_var(--f-side-span,6)]"
      style={{ '--f-side-span': main.length } as React.CSSProperties}
    >
      {items}
    </div>
  );
}
