import { useState, type ReactNode } from 'react';
import {
  DropIcon,
  FireIcon,
  HurricaneIcon,
  MountainsIcon,
  PulseIcon,
  SunIcon,
} from '@phosphor-icons/react';
import { checkedLabel } from '../lib/time.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import {
  ACTIVE_WINDOW,
  alertLevelMeaning,
  alertLevelShort,
  alertTitle,
  alertsFor,
  type AlertLevel,
  type AlertType,
  type AlertsSnapshot,
  readableSeverity,
} from '../lib/alerts.ts';
import type { Bounds } from '../lib/domain.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import {
  Actions,
  Badge,
  ExpandRow,
  List,
  Note,
  OutLink,
  SourceStamp,
  StatusIcon,
} from '../ui/index.ts';

// Numbers stay with their units at a line break ("hace 2 h", "13 oct").
const nb = (text: string) => text.replace(/(\d) (?=\S)/g, '$1\u00a0');

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

const icons: Record<AlertType, ReactNode> = {
  EQ: <PulseIcon size={20} weight="bold" />,
  TC: <HurricaneIcon size={20} weight="bold" />,
  FL: <DropIcon size={20} weight="fill" />,
  VO: <MountainsIcon size={20} weight="bold" />,
  DR: <SunIcon size={20} weight="bold" />,
  WF: <FireIcon size={20} weight="bold" />,
};
// GDACS levels on Faro's official scale, as on Situación. Green is listed without a warning colour.
const levels: Record<AlertLevel, 2 | 3 | undefined> = { green: undefined, orange: 2, red: 3 };

/** GDACS events for the selected country. Estimates for international response, not warnings. */
export default function AlertsPanel(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt),
    idx = langIndex(p.lang);
  const [all, setAll] = useState(false);
  // Every alert starts open; the person can close the ones they have read.
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    <div className="f-stack" data-gap="lg">
      <div className="f-stack">
        {/* The answer first, in one sentence. */}
        {p.data && (
          <h2 className="f-section-title" id="fw-alerts-title">
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
          </h2>
        )}
        <Note>
          {t(
            'Estimaciones de GDACS (ONU y Comisión Europea) para coordinar la ayuda internacional. No son un aviso para ti ni una orden de evacuación: qué hacer lo indican las autoridades locales.',
            'Estimates from GDACS (UN and European Commission) to coordinate international aid. They are not a warning for you or an evacuation order: local authorities say what to do.',
            'Estimativas do GDACS (ONU e Comissão Europeia) para coordenar a ajuda internacional. Não são um aviso para você nem uma ordem de evacuação: o que fazer é indicado pelas autoridades locais.',
          )}
        </Note>
        {p.failed && (
          <div role="status">
            <SourceStamp issuer="GDACS" state="error">
              <span>
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
              </span>
            </SourceStamp>
          </div>
        )}
        {!p.data && !p.failed && (
          <div className="f-prose">
            <p>
              {p.online
                ? t('Consultando GDACS…', 'Checking GDACS…', 'Consultando o GDACS…')
                : t(
                    'Sin conexión: no se pueden consultar las alertas.',
                    'Offline: alerts cannot be checked.',
                    'Sem conexão: não é possível consultar os alertas.',
                  )}
            </p>
          </div>
        )}
        {shown.length > 0 && (
          <List label="GDACS">
            {shown.map((e) => {
              const id = `fw-gdacs-${e.id}`.replace(/[^\w-]/g, '_');
              return (
                <ExpandRow
                  key={id}
                  id={id}
                  open={!closed.has(id)}
                  onToggle={() => toggle(id)}
                  lead={<StatusIcon state="listed" level={levels[e.level]} icon={icons[e.type]} />}
                  title={alertTitle(e, (c) => names.of(c), p.lang)}
                  badge={
                    <Badge level={levels[e.level]}>
                      {alertLevelShort[e.level][idx].split(':')[0]}
                    </Badge>
                  }
                  meta={nb(
                    [
                      e.from === e.to ? date(e.to) : `${date(e.from)} – ${date(e.to)}`,
                      ageLabel(e.to, p.now, p.lang),
                      p.now - e.to > ACTIVE_WINDOW &&
                        t(
                          'sin cambios desde entonces',
                          'no change since then',
                          'sem mudanças desde então',
                        ),
                    ]
                      .filter(Boolean)
                      .join(' · '),
                  )}
                >
                  <p>{alertLevelMeaning[e.level][idx]}</p>
                  {e.type === 'EQ' && e.severity && <p>{readableSeverity(e.severity, p.lang)}</p>}
                  <Actions>
                    <OutLink href={e.url}>
                      {t(
                        'Informe de GDACS (en inglés)',
                        'GDACS report',
                        'Relatório do GDACS (em inglês)',
                      )}
                    </OutLink>
                  </Actions>
                </ExpandRow>
              );
            })}
          </List>
        )}
        {rows.length > 4 && (
          <Actions>
            <button type="button" onClick={() => setAll((v) => !v)}>
              {all
                ? t('Mostrar menos', 'Show fewer', 'Mostrar menos')
                : t(
                    `Ver las ${rows.length} alertas`,
                    `See all ${rows.length} alerts`,
                    `Ver os ${rows.length} alertas`,
                  )}
            </button>
          </Actions>
        )}
        {greenQuakes.length > 0 && (
          <Note>
            {t(
              greenQuakes.length === 1
                ? 'Además, 1 sismo con alerta verde de GDACS (no se espera ayuda internacional). Está en la lista de sismos.'
                : `Además, ${greenQuakes.length} sismos con alerta verde de GDACS (no se espera ayuda internacional). Están en la lista de sismos.`,
              greenQuakes.length === 1
                ? 'Also 1 earthquake with a GDACS green alert (no international assistance expected). It is in the earthquake list.'
                : `Also ${greenQuakes.length} earthquakes with a GDACS green alert (no international assistance expected). They are in the earthquake list.`,
              greenQuakes.length === 1
                ? 'Além disso, 1 terremoto com alerta verde do GDACS (não se espera ajuda internacional). Está na lista de terremotos.'
                : `Além disso, ${greenQuakes.length} terremotos com alerta verde do GDACS (não se espera ajuda internacional). Estão na lista de terremotos.`,
            )}
          </Note>
        )}
        <div>
          <SourceStamp
            issuer={
              <a href="https://www.gdacs.org/" target="_blank" rel="noreferrer">
                Global Disaster Alert and Coordination System, GDACS
              </a>
            }
            state={stale || p.data?.partial ? 'stale' : undefined}
          >
            <span>
              {[
                stale &&
                  t(
                    'Datos con más de 15 minutos.',
                    'Data older than 15 minutes.',
                    'Dados com mais de 15 minutos.',
                  ),
                p.data?.partial &&
                  t('Respuesta parcial.', 'Partial response.', 'Resposta parcial.'),
                p.data &&
                  `${t('consultado', 'checked', 'consultado')} ${checkedLabel(p.data.fetched, p.now, p.lang)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </SourceStamp>
        </div>
      </div>
    </div>
  );
}
