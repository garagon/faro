import { useState, type ReactNode } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';
import OfficialNow, { type CivilFeed, type NationalFeed } from './OfficialNow.tsx';
import { alertLevelLabels, alertLevelShort, alertTitle } from '../lib/alerts.ts';
import { nationalSignal } from '../lib/national.ts';
import type { HazardKey, HazardStatus } from '../lib/hazards.ts';
import type { Quake } from '../lib/domain.ts';
import { atLabel, checkedLabel } from '../lib/time.ts';
import { scrollMotion } from '../lib/motion.ts';
import type { Destination, OfficialLink } from '../data/destinations/types.ts';
import { langIndex, pick, type Lang, type Localized } from '../lib/i18n.ts';

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
  /** When the official data on screen was last checked, with access to the sources. */
  updated: ReactNode;
  actions: ReactNode;
  setup?: ReactNode;
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
  services?: Destination['services'];
  onOpen: (target: BriefingTarget) => void;
};

const names: Record<HazardKey, Localized> = {
  earthquake: ['Sismos', 'Earthquakes', 'Terremotos'],
  tsunami: ['Tsunami', 'Tsunami', 'Tsunami'],
  cyclone: ['Ciclones', 'Cyclones', 'Ciclones'],
  flood: ['Inundaciones', 'Floods', 'Inundações'],
  volcano: ['Volcanes', 'Volcanoes', 'Vulcões'],
};
// Signal colors: GDACS levels, a pending review in amber, nothing listed as an unlit ring.
const levelColor: Record<string, string> = {
  green: '#3f8a55',
  orange: '#c66a1b',
  red: '#b3343c',
  review: '#b5802e',
};

/**
 * The home for one place, in order of need: an urgent official message if there is one,
 * emergency actions, one row per hazard beside the map, then what the authorities are saying. Each row states what its source lists; none of it is
 * a safety rating. Detail (lists, filters, bulletins) lives on its own page.
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
                `Vigente según el último dato (${checkedLabel(p.national.checked, p.now, p.lang)}). Toca para ver sus indicaciones.`,
                `In force as of the last data (${checkedLabel(p.national.checked, p.now, p.lang)}). Tap for its instructions.`,
                `Em vigor segundo o último dado (${checkedLabel(p.national.checked, p.now, p.lang)}). Toque para ver as orientações.`,
              )
            : t(
                'Aviso vigente. Toca para ver sus indicaciones.',
                'Warning in force. Tap for its instructions.',
                'Aviso em vigor. Toque para ver as orientações.',
              ),
      }
    : p.floodNotice
      ? {
          rowId: p.floodNotice.rowId,
          status: t(
            `${p.floodNotice.agency} menciona lluvias o inundaciones`,
            `${p.floodNotice.agency} mentions rain or flooding`,
            `${p.floodNotice.agency} menciona chuvas ou inundações`,
          ),
          detail: `«${p.floodNotice.title}», ${t('publicado', 'published', 'publicado')} ${ago(p.floodNotice.published)}.`,
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
  return (
    <div className="fw-home">
      <header className="fw-home-head">
        <div>
          <h1 id="fw-brief-title" tabIndex={-1}>
            {p.countryName}
          </h1>
          <p className="fw-home-what">
            {t(
              'Datos oficiales y ayuda local para viajeros. No es un sistema de alerta temprana.',
              'Official data and local help for travelers. Not an early warning system.',
              'Dados oficiais e ajuda local para viajantes. Não é um sistema de alerta antecipado.',
            )}
          </p>
        </div>
        <p>{p.updated}</p>
      </header>
      {p.alert}
      {p.actions}
      {p.setup}
      {/* The disaster this place is living through comes before the hazard rows. */}
      {p.response}

      <section className="fw-home-now" aria-labelledby="fw-now-title">
        <header className="fw-home-now-head">
          <div>
            <h2 id="fw-now-title">
              {t(
                `Qué está pasando en ${p.countryName}`,
                `What is happening in ${p.countryName}`,
                `O que está acontecendo: ${p.countryName}`,
              )}
            </h2>
            <p>
              {t(
                'Faro consulta las fuentes oficiales automáticamente, solo mientras está abierto.',
                'Faro checks the official sources automatically, only while it is open.',
                'O Faro consulta as fontes oficiais automaticamente, só enquanto está aberto.',
              )}
            </p>
          </div>
          {/* The visible line ticks every second; screen readers hear only a change of state. */}
          <p className="fw-visually-hidden" role="status">
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
                      'Las fuentes no se están actualizando.',
                      'The sources are not updating.',
                      'As fontes não estão sendo atualizadas.',
                    )
                  : p.monitor.state === 'failed'
                    ? t(
                        'La fuente de sismos no responde.',
                        'The earthquake source is not responding.',
                        'A fonte de terremotos não responde.',
                      )
                    : ''}
          </p>
          <p className="fw-monitor-state" data-state={p.monitor.state}>
            <span className="fw-monitor-dot" aria-hidden="true" />
            <strong>
              {p.monitor.state === 'live'
                ? t('En vivo', 'Live', 'Ao vivo')
                : p.monitor.state === 'offline'
                  ? t('Sin conexión', 'Offline', 'Sem conexão')
                  : p.monitor.state === 'stale'
                    ? t('Sin actualizar', 'Not updating', 'Sem atualização')
                    : p.monitor.state === 'failed'
                      ? t('Fuente sin respuesta', 'Source not responding', 'Fonte sem resposta')
                      : t('Conectando…', 'Connecting…', 'Conectando…')}
            </strong>
            {p.monitor.checked && (
              <span>
                {p.monitor.state === 'live'
                  ? t(
                      `Actualizado ${ago(p.monitor.checked)}`,
                      `Updated ${ago(p.monitor.checked)}`,
                      `Atualizado ${ago(p.monitor.checked)}`,
                    )
                  : t(
                      `Último dato ${checkedLabel(p.monitor.checked, p.now, p.lang)}`,
                      `Last data ${checkedLabel(p.monitor.checked, p.now, p.lang)}`,
                      `Último dado ${checkedLabel(p.monitor.checked, p.now, p.lang)}`,
                    )}
              </span>
            )}
          </p>
        </header>
        <div className="fw-home-now-grid">
          <div className="fw-home-now-map">{p.map}</div>
          <ul className="fw-home-now-list">
            <li>
              <button
                className="fw-now-row"
                data-signal={quakeSignal}
                // Earthquakes are reported, not a warning level: a neutral dot, the magnitude in text.
                data-hazard="earthquake"
                onClick={() => p.onOpen('earthquake')}
              >
                <span className="fw-signal" aria-hidden="true" />
                <span className="fw-now-text">
                  <span className="fw-now-name">{names.earthquake[idx]}</span>
                  {q.offline ? (
                    <strong>
                      {t('Sin datos: sin conexión', 'No data: offline', 'Sem dados: sem conexão')}
                    </strong>
                  ) : q.loading && q.failed ? (
                    <strong>
                      {t('La fuente no responde', 'Source not responding', 'Fonte sem resposta')}
                    </strong>
                  ) : q.loading ? (
                    <strong>{t('Consultando…', 'Checking…', 'Consultando…')}</strong>
                  ) : q.staleSince ? (
                    <>
                      <strong>
                        {t(
                          `Sin actualizar desde ${atLabel(q.staleSince, p.now, p.lang)}`,
                          `Not updated since ${atLabel(q.staleSince, p.now, p.lang)}`,
                          `Sem atualização desde ${atLabel(q.staleSince, p.now, p.lang)}`,
                        )}
                      </strong>
                      <small>
                        {q.latest
                          ? t(
                              `Último conocido: M${q.latest.mag?.toFixed(1) ?? '—'}, ${ago(q.latest.time)}. `,
                              `Last known: M${q.latest.mag?.toFixed(1) ?? '—'}, ${ago(q.latest.time)}. `,
                              `Último conhecido: M${q.latest.mag?.toFixed(1) ?? '—'}, ${ago(q.latest.time)}. `,
                            )
                          : q.quietSince
                            ? t(
                                `Registro más reciente ${ago(q.quietSince)}. `,
                                `Most recent record ${ago(q.quietSince)}. `,
                                `Registro mais recente ${ago(q.quietSince)}. `,
                              )
                            : ''}
                        {q.failed
                          ? t(
                              `${q.provider} no responde.`,
                              `${q.provider} is not responding.`,
                              `${q.provider} não responde.`,
                            )
                          : q.provider}
                      </small>
                    </>
                  ) : q.failed && !q.count ? (
                    <strong>
                      {t('La fuente no responde', 'Source not responding', 'Fonte sem resposta')}
                    </strong>
                  ) : q.latest ? (
                    <>
                      <strong>
                        {t('Último', 'Latest', 'Último')}: M{q.latest.mag?.toFixed(1) ?? '—'},{' '}
                        {ago(q.latest.time)}
                      </strong>
                      <small>
                        {q.largest?.mag != null &&
                          t(
                            `Mayor en ${q.period}: M${q.largest.mag.toFixed(1)}. `,
                            `Largest in ${q.period}: M${q.largest.mag.toFixed(1)}. `,
                            `Maior em ${q.period}: M${q.largest.mag.toFixed(1)}. `,
                          )}
                        {q.count} {t('registrados', 'recorded', 'registrados')} · {q.provider}
                      </small>
                    </>
                  ) : (
                    <>
                      <strong>
                        {t(
                          `Ninguno en ${q.period}`,
                          `None in ${q.period}`,
                          `Nenhum em ${q.period}`,
                        )}
                      </strong>
                      <small>
                        {q.quietSince
                          ? t(
                              `${q.provider}: registro más reciente ${ago(q.quietSince)}. Otras fuentes pueden tener datos más nuevos.`,
                              `${q.provider}: most recent record ${ago(q.quietSince)}. Other sources may have newer data.`,
                              `${q.provider}: registro mais recente ${ago(q.quietSince)}. Outras fontes podem ter dados mais novos.`,
                            )
                          : q.provider}
                      </small>
                    </>
                  )}
                </span>
                <CaretRightIcon className="fw-now-go" size={14} aria-hidden="true" />
              </button>
            </li>
            {p.hazards.map((h) => {
              const gap = h.key === 'flood' && !floodRow && h.state === 'none' ? floodGap : null;
              return h.key === 'flood' && floodRow ? (
                <li key={h.key}>
                  <button
                    className="fw-now-row"
                    data-signal="on"
                    style={{ '--signal': levelColor.review } as React.CSSProperties}
                    onClick={() => reveal(floodRow.rowId)}
                  >
                    <span className="fw-signal" aria-hidden="true" />
                    <span className="fw-now-text">
                      <span className="fw-now-name">{names.flood[idx]}</span>
                      <strong>{floodRow.status}</strong>
                      <small>{floodRow.detail}</small>
                    </span>
                    <CaretRightIcon className="fw-now-go" size={14} aria-hidden="true" />
                  </button>
                </li>
              ) : (
                <li key={h.key}>
                  <button
                    className="fw-now-row"
                    data-signal={
                      h.state === 'listed' ? 'on' : h.state === 'none' && !gap ? 'off' : 'unknown'
                    }
                    style={
                      h.level
                        ? ({ '--signal': levelColor[h.level] } as React.CSSProperties)
                        : undefined
                    }
                    onClick={() => p.onOpen(h.key)}
                  >
                    <span className="fw-signal" aria-hidden="true" />
                    <span className="fw-now-text">
                      <span className="fw-now-name">{names[h.key][idx]}</span>
                      {gap ? (
                        <strong>{gap.status}</strong>
                      ) : h.state === 'unknown' && h.unclosed ? (
                        <strong>
                          {t(
                            'Mensaje de amenaza sin cierre: ábrelo',
                            'Threat message not closed: open it',
                            'Mensagem de ameaça sem encerramento: abra-a',
                          )}
                        </strong>
                      ) : h.state === 'unknown' ? (
                        <strong>{t('Sin confirmar', 'Not confirmed', 'Não confirmado')}</strong>
                      ) : h.state === 'none' ? (
                        <strong>
                          {h.key === 'tsunami'
                            ? t(
                                'Sin mensajes de amenaza de NOAA en 6 h',
                                'No NOAA threat messages in 6 h',
                                'Sem mensagens de ameaça da NOAA em 6 h',
                              )
                            : h.key === 'cyclone' && p.stormsInBasin
                              ? t(
                                  `Ninguno con alerta para ${p.countryName}`,
                                  `None with an alert for ${p.countryName}`,
                                  `${p.countryName}: nenhum com alerta`,
                                )
                              : t(
                                  `Sin alertas internacionales para ${p.countryName}`,
                                  `No international alerts for ${p.countryName}`,
                                  `${p.countryName}: sem alertas internacionais`,
                                )}
                        </strong>
                      ) : h.level === 'review' ? (
                        <strong>
                          {t(
                            'Mensaje reciente de NOAA: ábrelo',
                            'Recent NOAA message: open it',
                            'Mensagem recente da NOAA: abra-a',
                          )}
                        </strong>
                      ) : (
                        <strong>
                          {h.top
                            ? alertTitle(h.top, (c) => regions.of(c), p.lang)
                            : alertLevelLabels[h.level as 'green'][idx].split(' · ')[0]}
                        </strong>
                      )}
                      <small>
                        {[
                          gap?.check,
                          // Plain fact above; who said it goes here, with when.
                          gap
                            ? t(
                                'GDACS: sin alertas internacionales',
                                'GDACS: no international alerts',
                                'GDACS: sem alertas internacionais',
                              )
                            : h.key === 'tsunami'
                              ? 'NOAA/PTWC'
                              : h.key === 'cyclone' && p.stormsInBasin
                                ? ''
                                : h.state === 'listed' && h.level && h.level !== 'review'
                                  ? alertLevelShort[h.level as 'green'][idx]
                                  : 'GDACS',
                          h.unclosed
                            ? `${t('publicado', 'issued', 'publicado')} ${ago(h.unclosed)}`
                            : '',
                          h.key === 'cyclone' && p.stormsInBasin
                            ? t(
                                `${p.stormsInBasin} activos en la cuenca (NHC)`,
                                `${p.stormsInBasin} active in the basin (NHC)`,
                                `${p.stormsInBasin} ativos na bacia (NHC)`,
                              )
                            : p.notes?.[h.key],
                          h.recent && h.state === 'none'
                            ? t(
                                `${h.recent} en 14 días`,
                                `${h.recent} in 14 days`,
                                `${h.recent} em 14 dias`,
                              )
                            : '',
                          h.state === 'unknown'
                            ? h.checked
                              ? t(
                                  `Último dato: ${checkedLabel(h.checked, p.now, p.lang)}`,
                                  `Last data: ${checkedLabel(h.checked, p.now, p.lang)}`,
                                  `Último dado: ${checkedLabel(h.checked, p.now, p.lang)}`,
                                )
                              : offline
                                ? t('Sin conexión', 'Offline', 'Sem conexão')
                                : t(
                                    'Sin respuesta de la fuente',
                                    'No answer from the source',
                                    'Sem resposta da fonte',
                                  )
                            : h.checked
                              ? // A listed item from an old answer says so: NOAA is polled every
                                // minute, GDACS every five.
                                offline ||
                                p.now - h.checked > (h.key === 'tsunami' ? 3 : 15) * 60000
                                ? t(
                                    `Último dato: ${checkedLabel(h.checked, p.now, p.lang)}`,
                                    `Last data: ${checkedLabel(h.checked, p.now, p.lang)}`,
                                    `Último dado: ${checkedLabel(h.checked, p.now, p.lang)}`,
                                  )
                                : t(
                                    `Consultado ${checkedLabel(h.checked, p.now, p.lang)}`,
                                    `Checked ${checkedLabel(h.checked, p.now, p.lang)}`,
                                    `Consultado ${checkedLabel(h.checked, p.now, p.lang)}`,
                                  )
                              : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                      {/* No message is not an all-clear: the shaking itself is the warning. */}
                      {h.key === 'tsunami' && h.state !== 'listed' && (
                        <small className="fw-now-natural">
                          {t(
                            '¿Sentiste un sismo fuerte o largo en la costa? Ve a lo alto ya: no esperes una alerta.',
                            'Felt strong or long shaking on the coast? Go to high ground now: do not wait for an alert.',
                            'Sentiu um tremor forte ou longo na costa? Vá para um lugar alto já: não espere um alerta.',
                          )}
                        </small>
                      )}
                    </span>
                    <CaretRightIcon className="fw-now-go" size={14} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="fw-home-note">
          {t(
            'Que una fuente no liste eventos no significa que no haya peligro. Sigue a las autoridades locales:',
            'A source listing no events does not mean there is no danger. Follow local authorities:',
            'Uma fonte não listar eventos não significa que não haja perigo. Siga as autoridades locais:',
          )}{' '}
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
        </p>
      </section>
      <OfficialNow
        lang={p.lang}
        now={p.now}
        national={p.national}
        civil={p.civil}
        weather={p.national ? undefined : p.weather}
        services={p.services}
        open={open}
        onToggle={toggle}
      />
    </div>
  );
}
