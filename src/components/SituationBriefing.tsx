import { useState, type ReactNode } from 'react';
import {
  DropIcon,
  HurricaneIcon,
  MountainsIcon,
  PulseIcon,
  WavesIcon,
} from '@phosphor-icons/react';
import OfficialNow, { type CivilFeed, type NationalFeed } from './OfficialNow.tsx';
import { alertLevelLabels, alertLevelShort, alertTitle } from '../lib/alerts.ts';
import { nationalSignal } from '../lib/national.ts';
import type { HazardKey, HazardStatus } from '../lib/hazards.ts';
import type { Quake } from '../lib/domain.ts';
import { atLabel, checkedLabel } from '../lib/time.ts';
import { scrollMotion } from '../lib/motion.ts';
import type { Destination, OfficialLink } from '../data/destinations/types.ts';
import { langIndex, pick, type Lang, type Localized } from '../lib/i18n.ts';
import {
  Badge,
  List,
  ListRow,
  Note,
  ScopeNote,
  ScreenHead,
  Section,
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
  monitor: { state: 'live' | 'stale' | 'offline' | 'failed' | 'checking'; checked: number | null };
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
  floodAdvice?: { agency: string; rowId: string };
  /** A recent civil-protection post that mentions rain or flooding (it has no expiry). */
  floodNotice?: { agency: string; title: string; published: number; rowId: string };
  /** Active NHC cyclones in its basins, when the place is in them. */
  stormsInBasin?: number;
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
  earthquake: <PulseIcon size={20} weight="bold" />,
  tsunami: <WavesIcon size={20} weight="bold" />,
  cyclone: <HurricaneIcon size={20} weight="bold" />,
  flood: <DropIcon size={20} weight="fill" />,
  volcano: <MountainsIcon size={20} weight="bold" />,
};
const names: Record<HazardKey, Localized> = {
  earthquake: ['Sismos', 'Earthquakes', 'Terremotos'],
  tsunami: ['Tsunami', 'Tsunami', 'Tsunami'],
  cyclone: ['Ciclones', 'Cyclones', 'Ciclones'],
  flood: ['Inundaciones', 'Floods', 'Inundações'],
  volcano: ['Volcanes', 'Volcanoes', 'Vulcões'],
};
// GDACS levels on Faro's official scale. Green is listed without a warning colour; a NOAA message
// to review is level 1.
const levelOf = (level: HazardStatus['level']): 1 | 2 | 3 | undefined =>
  level === 'red' ? 3 : level === 'orange' ? 2 : level === 'review' ? 1 : undefined;

/**
 * The home for one place, in order of need: an urgent official message if there is one, the call,
 * the actions, one row per hazard (warnings in force first), the map, then what the authorities
 * are saying. When a warning of level 2 or more is in force, the hazard rows come before the
 * actions. Each row states what its source lists; none of it is a safety rating. Detail (lists,
 * filters, bulletins) lives on its own page.
 */
export default function SituationBriefing(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt),
    idx = langIndex(p.lang);
  const regions = new Intl.DisplayNames([p.lang], { type: 'region' });
  const [open, setOpen] = useState<Set<string>>(() => new Set());
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

  const ago = (n: number) => {
    const sec = Math.max(0, Math.round((p.now - n) / 1000));
    if (sec < 60) return t(`hace ${sec} s`, `${sec} s ago`, `há ${sec} s`);
    const min = Math.max(0, Math.round((p.now - n) / 60000));
    return min < 60
      ? t(`hace ${min} min`, `${min} min ago`, `há ${min} min`)
      : min < 48 * 60
        ? t(
            `hace ${Math.round(min / 60)} h`,
            `${Math.round(min / 60)} h ago`,
            `há ${Math.round(min / 60)} h`,
          )
        : t(
            `hace ${Math.round(min / 1440)} días`,
            `${Math.round(min / 1440)} days ago`,
            `há ${Math.round(min / 1440)} dias`,
          );
  };
  // A warning in force comes first; otherwise a recent post that mentions rain or flooding.
  // A post has no expiry, so the row says when it was published, never "in force".
  const floodRow = p.floodAdvice
    ? {
        rowId: p.floodAdvice.rowId,
        status: t(
          `${p.floodAdvice.agency} advierte posibles inundaciones`,
          `${p.floodAdvice.agency} warns of possible flooding`,
          `${p.floodAdvice.agency} alerta para possíveis inundações`,
        ),
        // From a copy that is not current, the row says how old it is.
        detail:
          p.national?.stale && p.national.checked
            ? t(
                `vigente según el último dato (${checkedLabel(p.national.checked, p.now, p.lang)})`,
                `in force as of the last data (${checkedLabel(p.national.checked, p.now, p.lang)})`,
                `em vigor segundo o último dado (${checkedLabel(p.national.checked, p.now, p.lang)})`,
              )
            : '',
      }
    : p.floodNotice
      ? {
          rowId: p.floodNotice.rowId,
          status: t(
            `${p.floodNotice.agency} menciona lluvias o inundaciones`,
            `${p.floodNotice.agency} mentions rain or flooding`,
            `${p.floodNotice.agency} menciona chuvas ou inundações`,
          ),
          detail: `«${p.floodNotice.title}», ${t('publicado', 'published', 'publicado')} ${ago(p.floodNotice.published)}`,
        }
      : null;

  // GDACS rarely lists floods: when the national service that does cannot be read, the row says
  // that instead of "no international alerts".
  const national = p.national ? nationalSignal(p.national) : null;
  const floodGap =
    p.national && (national === 'failed' || national === 'offline' || national === 'unconfirmed')
      ? {
          status:
            national === 'offline'
              ? t(
                  `Sin conexión: avisos de ${p.national.agency} sin confirmar`,
                  `Offline: ${p.national.agency} warnings not confirmed`,
                  `Sem conexão: avisos do ${p.national.agency} não confirmados`,
                )
              : national === 'failed'
                ? t(
                    `${p.national.agency} no responde`,
                    `${p.national.agency} is not responding`,
                    `${p.national.agency} não responde`,
                  )
                : t(
                    `Avisos de ${p.national.agency} sin confirmar`,
                    `${p.national.agency} warnings not confirmed`,
                    `Avisos do ${p.national.agency} não confirmados`,
                  ),
          check: p.weather?.url
            ? `${t('Revisa', 'Check', 'Consulte')} ${new URL(p.weather.url).hostname.replace(/^www\./, '')}`
            : '',
        }
      : null;
  const offline = p.monitor.state === 'offline';

  // Old data is never shown as the current picture: no counts, no "none", a "not confirmed" dot.
  const quakeSignal =
    q.offline || q.loading || q.staleSince || (q.failed && !q.count)
      ? 'unknown'
      : q.largest
        ? 'on'
        : 'off';
  type Row = { key: string; rank: number; node: ReactNode };
  const rows: Row[] = [];
  const quakeState: Signal =
    quakeSignal === 'on'
      ? 'listed'
      : quakeSignal === 'off'
        ? 'none'
        : q.loading && !q.failed && !q.offline
          ? 'pending'
          : 'unknown';
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
            ? t('Sin datos: sin conexión', 'No data: offline', 'Sem dados: sem conexão')
            : q.loading && q.failed
              ? t('La fuente no responde', 'Source not responding', 'Fonte sem resposta')
              : q.loading
                ? t('Consultando…', 'Checking…', 'Consultando…')
                : q.staleSince
                  ? [
                      t(
                        `Sin actualizar desde ${atLabel(q.staleSince, p.now, p.lang)}`,
                        `Not updated since ${atLabel(q.staleSince, p.now, p.lang)}`,
                        `Sem atualização desde ${atLabel(q.staleSince, p.now, p.lang)}`,
                      ),
                      q.latest
                        ? t(
                            `último conocido M${q.latest.mag?.toFixed(1) ?? '—'}, ${ago(q.latest.time)}`,
                            `last known M${q.latest.mag?.toFixed(1) ?? '—'}, ${ago(q.latest.time)}`,
                            `último conhecido M${q.latest.mag?.toFixed(1) ?? '—'}, ${ago(q.latest.time)}`,
                          )
                        : '',
                      q.failed
                        ? t(
                            `${q.provider} no responde`,
                            `${q.provider} is not responding`,
                            `${q.provider} não responde`,
                          )
                        : q.provider,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : q.failed && !q.count
                    ? t('La fuente no responde', 'Source not responding', 'Fonte sem resposta')
                    : q.latest
                      ? `${t('Último', 'Latest', 'Último')} M${q.latest.mag?.toFixed(1) ?? '—'} ${ago(q.latest.time)} · ${q.count} ${t('en', 'in', 'em')} ${q.period} · ${q.provider}`
                      : [
                          t(
                            `Ninguno en ${q.period}`,
                            `None in ${q.period}`,
                            `Nenhum em ${q.period}`,
                          ),
                          q.quietSince
                            ? t(
                                `${q.provider}: registro más reciente ${ago(q.quietSince)}`,
                                `${q.provider}: most recent record ${ago(q.quietSince)}`,
                                `${q.provider}: registro mais recente ${ago(q.quietSince)}`,
                              )
                            : q.provider,
                        ].join(' · ')
        }
        onClick={() => p.onOpen('earthquake')}
      />
    ),
  });
  for (const h of p.hazards) {
    const gap = h.key === 'flood' && !floodRow && h.state === 'none' ? floodGap : null;
    // A national service's alerts in force (NWS) lead over an empty international list.
    const lead = h.state === 'listed' ? undefined : p.leads?.[h.key];
    if (h.key === 'flood' && floodRow) {
      rows.push({
        key: h.key,
        rank: p.floodAdvice ? 2 : 3,
        node: (
          <ListRow
            key={h.key}
            lead={
              <StatusIcon state="listed" level={p.floodAdvice ? 1 : undefined} icon={icons.flood} />
            }
            title={names.flood[idx]}
            badge={
              p.floodAdvice ? <Badge level={1}>{t('Aviso', 'Warning', 'Aviso')}</Badge> : undefined
            }
            meta={[floodRow.status, floodRow.detail].filter(Boolean).join(' · ')}
            onClick={() => reveal(floodRow.rowId)}
          />
        ),
      });
      continue;
    }
    // When each source answered: said only when it is not recent (the screen states freshness).
    const old =
      h.checked && (offline || p.now - h.checked > (h.key === 'tsunami' ? 3 : 15) * 60000)
        ? t(
            `último dato ${checkedLabel(h.checked, p.now, p.lang)}`,
            `last data ${checkedLabel(h.checked, p.now, p.lang)}`,
            `último dado ${checkedLabel(h.checked, p.now, p.lang)}`,
          )
        : '';
    const level = lead || (h.state === 'unknown' && h.unclosed) ? 1 : levelOf(h.level);
    const state: Signal =
      lead || (h.state === 'unknown' && h.unclosed)
        ? 'listed'
        : gap
          ? 'unknown'
          : h.state === 'listed'
            ? 'listed'
            : h.state;
    const source =
      h.key === 'tsunami'
        ? 'NOAA/PTWC'
        : h.key === 'cyclone' && p.stormsInBasin
          ? 'GDACS'
          : 'GDACS';
    const meta = lead
      ? lead
      : gap
        ? [gap.status, gap.check].filter(Boolean).join(' · ')
        : h.state === 'unknown' && h.unclosed
          ? `${t('Mensaje de amenaza sin cierre: ábrelo', 'Threat message not closed: open it', 'Mensagem de ameaça sem encerramento: abra-a')} · ${t('publicado', 'issued', 'publicado')} ${ago(h.unclosed)}`
          : h.state === 'pending'
            ? `${t('Consultando…', 'Checking…', 'Consultando…')} · ${source}`
            : h.state === 'unknown'
              ? [
                  t('No se pudo comprobar', 'Could not be checked', 'Não foi possível verificar'),
                  h.checked
                    ? t(
                        `último dato ${checkedLabel(h.checked, p.now, p.lang)}`,
                        `last data ${checkedLabel(h.checked, p.now, p.lang)}`,
                        `último dado ${checkedLabel(h.checked, p.now, p.lang)}`,
                      )
                    : offline
                      ? t('sin conexión', 'offline', 'sem conexão')
                      : t(
                          'sin respuesta de la fuente',
                          'no answer from the source',
                          'sem resposta da fonte',
                        ),
                ].join(' · ')
              : h.state === 'none'
                ? [
                    h.key === 'tsunami'
                      ? t(
                          'Sin mensajes de amenaza de NOAA en 6 h',
                          'No NOAA threat messages in 6 h',
                          'Sem mensagens de ameaça da NOAA em 6 h',
                        )
                      : h.key === 'cyclone' && p.stormsInBasin
                        ? t(
                            `Ninguno con alerta para ${p.countryName} · ${p.stormsInBasin} activos en la cuenca (NHC)`,
                            `None with an alert for ${p.countryName} · ${p.stormsInBasin} active in the basin (NHC)`,
                            `Nenhum com alerta para ${p.countryName} · ${p.stormsInBasin} ativos na bacia (NHC)`,
                          )
                        : t(
                            'Sin alertas internacionales · GDACS',
                            'No international alerts · GDACS',
                            'Sem alertas internacionais · GDACS',
                          ),
                    h.recent
                      ? t(
                          `${h.recent} en 14 días`,
                          `${h.recent} in 14 days`,
                          `${h.recent} em 14 dias`,
                        )
                      : '',
                    p.notes?.[h.key],
                    old,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : h.level === 'review'
                  ? t(
                      'Mensaje reciente de NOAA: ábrelo',
                      'Recent NOAA message: open it',
                      'Mensagem recente da NOAA: abra-a',
                    )
                  : [
                      h.top
                        ? alertTitle(h.top, (c) => regions.of(c), p.lang)
                        : alertLevelLabels[h.level as 'green'][idx].split(' · ')[0],
                      p.notes?.[h.key],
                      old,
                    ]
                      .filter(Boolean)
                      .join(' · ');
    rows.push({
      key: h.key,
      rank: level === 3 ? 0 : level === 2 ? 1 : level === 1 ? 2 : 3,
      node: (
        <ListRow
          key={h.key}
          lead={<StatusIcon state={state} level={level} icon={icons[h.key]} />}
          title={names[h.key][idx]}
          badge={
            h.state === 'listed' && h.level && h.level !== 'review' ? (
              <Badge level={levelOf(h.level)}>{alertLevelShort[h.level as 'green'][idx]}</Badge>
            ) : undefined
          }
          meta={meta}
          onClick={() => p.onOpen(h.key)}
        />
      ),
    });
  }
  // Warnings in force first, most severe first; the rest keep their usual order.
  const ordered = rows.map((r, n) => ({ ...r, n })).sort((a, b) => a.rank - b.rank || a.n - b.n);
  const inForce = rows.filter((r) => r.rank < 3).length;
  const severe = rows.some((r) => r.rank < 2);

  const freshness =
    p.monitor.state === 'live' && p.monitor.checked
      ? t(
          `Comprobado ${ago(p.monitor.checked)}`,
          `Checked ${ago(p.monitor.checked)}`,
          `Verificado ${ago(p.monitor.checked)}`,
        )
      : p.monitor.state === 'checking'
        ? t('Consultando…', 'Checking…', 'Consultando…')
        : p.monitor.checked
          ? t(
              `Datos de ${checkedLabel(p.monitor.checked, p.now, p.lang)}`,
              `Data from ${checkedLabel(p.monitor.checked, p.now, p.lang)}`,
              `Dados de ${checkedLabel(p.monitor.checked, p.now, p.lang)}`,
            )
          : p.monitor.state === 'offline'
            ? t('Sin conexión', 'Offline', 'Sem conexão')
            : t('Fuente sin respuesta', 'Source not responding', 'Fonte sem resposta');

  const happening = (
    <Section
      id="fw-now"
      title={t('Qué está pasando', 'What is happening', 'O que está acontecendo')}
      aside={
        inForce
          ? inForce === 1
            ? t('1 aviso vigente', '1 warning in force', '1 aviso em vigor')
            : t(
                `${inForce} avisos vigentes`,
                `${inForce} warnings in force`,
                `${inForce} avisos em vigor`,
              )
          : undefined
      }
    >
      {/* The visible freshness ticks; screen readers hear only a change of state. */}
      <p className="f-visually-hidden" role="status">
        {p.monitor.state === 'live'
          ? t('Datos oficiales en vivo.', 'Official data live.', 'Dados oficiais ao vivo.')
          : p.monitor.state === 'offline'
            ? t(
                'Sin conexión: se muestran los últimos datos.',
                'Offline: showing the last data.',
                'Sem conexão: mostrando os últimos dados.',
              )
            : p.monitor.state === 'stale'
              ? t(
                  'Los sismos no se están actualizando.',
                  'Earthquake data is not updating.',
                  'Os terremotos não estão sendo atualizados.',
                )
              : p.monitor.state === 'failed'
                ? t(
                    'La fuente de sismos no responde.',
                    'The earthquake source is not responding.',
                    'A fonte de terremotos não responde.',
                  )
                : ''}
      </p>
      <List label={t('Peligros', 'Hazards', 'Perigos')}>{ordered.map((r) => r.node)}</List>
      <Note
        more={
          <button type="button" className="f-inline-link" onClick={p.onSources}>
            {t('Cómo leer esto', 'How to read this', 'Como ler isto')}
          </button>
        }
      >
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
      aside={
        <span
          className="f-section-aside"
          data-state={p.monitor.state === 'live' ? undefined : 'stale'}
        >
          {freshness}
        </span>
      }
    />,
    p.alert ? <div key="alert">{p.alert}</div> : null,
    <div key="call">{p.call}</div>,
    ...(severe
      ? [<div key="now">{happening}</div>, <div key="actions">{p.actions}</div>]
      : [<div key="actions">{p.actions}</div>, <div key="now">{happening}</div>]),
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
      national={p.national}
      civil={p.civil}
      // NWS areas are read separately (the NWS tab): never "no format Faro can read".
      weather={p.national || p.nwsArea ? undefined : p.weather}
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
  // On phones the map follows "What is happening"; on wide screens it spans the main column.
  const nowAt = main.findIndex((n) => (n as { key?: string }).key === 'now');
  const items = [...main.slice(0, nowAt + 1), side, ...main.slice(nowAt + 1)];
  return (
    <div className="f-dashboard" style={{ '--f-side-span': main.length } as React.CSSProperties}>
      {items}
    </div>
  );
}
