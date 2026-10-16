import { useState, type ReactNode } from 'react';
import { ArrowClockwiseIcon, FunnelSimpleIcon, PulseIcon } from '@phosphor-icons/react';
import { displayPlace, placeLang, type Quake } from '../lib/domain.ts';
import { type FeedUpdate } from '../lib/feedUpdates.ts';
import { checkedLabel } from '../lib/time.ts';
import { sourceTime } from '../lib/sourceStatus.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import {
  Actions,
  ExpandRow,
  IconButton,
  List,
  ListRow,
  Magnitude,
  RowIcon,
  SourceStamp,
  StatusIcon,
} from '../ui/index.ts';
type Props = {
  events: Quake[];
  updates: FeedUpdate[];
  provider: string;
  catalog: string;
  lang: Lang;
  now: number;
  /** When the data shown was retrieved; 0 if nothing was received. */
  checked: number;
  busy: boolean;
  online: boolean;
  stale: boolean;
  /** The last request failed, and when it was made. */
  failed: boolean;
  failedAt: number | null;
  onRefresh: () => void;
  onDetails: (q: Quake) => void;
  onMap: (q: Quake) => void;
  /** Opens the list of changes received since Faro was opened (on the Sources screen). */
  onHistory: () => void;
  /** The filters: one caption line that sums them up, and the fields shown when opened. */
  filters: { summary: ReactNode; content: ReactNode };
  /** What is wrong with the data, when something is (old answer, quiet catalogue). */
  children?: ReactNode;
};

/**
 * The head of the earthquake list: whether the catalogue is being checked and when it last
 * answered, the filters, and an earthquake received a moment ago. The latest and largest
 * earthquakes are on Situación; polling and the changes received are on the Sources screen.
 */
export default function LiveActivity(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set()),
    [filtersOpen, setFiltersOpen] = useState(false);
  const key = (u: FeedUpdate) => `${p.catalog}:${u.event.id}`;
  const visible = new Set(p.events.map((q) => q.id));
  const unread = p.updates.filter((u) => visible.has(u.event.id) && !dismissed.has(key(u)));
  const fresh = unread.find((u) => p.now >= u.receivedAt && p.now - u.receivedAt < 120000);
  // "Waiting" only while a request is on its way; a failed one says so, with its time.
  const failing = p.online && p.failed && !p.busy;
  const state = !p.online
    ? t('Sin conexión', 'Offline', 'Sem conexão')
    : p.busy
      ? t('Consultando la fuente…', 'Checking source…', 'Consultando a fonte…')
      : failing
        ? t('No responde', 'Not responding', 'Não responde')
        : p.stale
          ? t('Actualización pendiente', 'Update overdue', 'Atualização pendente')
          : !p.checked
            ? t('Conectando…', 'Connecting…', 'Conectando…')
            : t('Actualización automática', 'Automatic updates', 'Atualização automática');
  const old = !p.online || p.stale;
  const clock = (time: number) => checkedLabel(time, p.now, p.lang);
  const when = p.checked
    ? sourceTime({ checked: p.checked, old, now: p.now, lang: p.lang })
    : failing && p.failedAt
      ? sourceTime({ checked: null, old: true, failedAt: p.failedAt, now: p.now, lang: p.lang })
      : !p.online
        ? t('sin datos', 'no data', 'sem dados')
        : t('esperando respuesta', 'awaiting response', 'aguardando resposta');
  return (
    <section
      className="f-stack"
      data-gap="sm"
      aria-label={t(
        'Últimos eventos y actualizaciones',
        'Latest events and updates',
        'Últimos eventos e atualizações',
      )}
    >
      <List>
        <ListRow
          lead={
            <StatusIcon
              state={old ? 'unknown' : p.busy || !p.checked ? 'pending' : 'listed'}
              level={old ? 1 : undefined}
              icon={<PulseIcon size={20} weight="bold" />}
            />
          }
          title={state}
          meta={
            <SourceStamp issuer={p.provider} state={failing ? 'error' : old ? 'stale' : undefined}>
              <span>{when}</span>
            </SourceStamp>
          }
          trail={
            <IconButton
              label={
                p.busy
                  ? t('Consultando…', 'Checking…', 'Consultando…')
                  : t('Actualizar', 'Refresh', 'Atualizar')
              }
              disabled={p.busy || !p.online}
              onClick={p.onRefresh}
            >
              <ArrowClockwiseIcon size={20} aria-hidden="true" />
            </IconButton>
          }
        />
        <ExpandRow
          id="fw-quake-filters"
          open={filtersOpen}
          onToggle={() => setFiltersOpen((v) => !v)}
          lead={<RowIcon icon={<FunnelSimpleIcon size={20} />} />}
          title={t('Filtros', 'Filters', 'Filtros')}
          meta={p.filters.summary}
        >
          {p.filters.content}
        </ExpandRow>
      </List>
      {p.children}
      {fresh && (
        <div className="f-stack" data-gap="sm" role="status">
          <List label={t('Recibido', 'Received', 'Recebido')}>
            <ListRow
              lead={
                <>
                  <Magnitude value={fresh.event.mag} />
                  <span className="f-visually-hidden">
                    {t('Magnitud', 'Magnitude', 'Magnitude')}
                  </span>
                </>
              }
              title={<span lang={placeLang(fresh.event)}>{displayPlace(fresh.event.place)}</span>}
              meta={`${t('Recibido', 'Received', 'Recebido')} ${clock(fresh.receivedAt)} · ${t('Hora del sismo', 'Earthquake time', 'Horário do terremoto')}: ${clock(fresh.event.time)} · ${p.provider}`}
              onClick={() => p.onDetails(fresh.event)}
            />
          </List>
          <Actions>
            <button type="button" onClick={() => p.onMap(fresh.event)}>
              {t('Ver epicentro', 'View epicenter', 'Ver epicentro')}
            </button>
            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set([...prev, key(fresh)]))}
            >
              {t('Descartar esta novedad', 'Dismiss this update', 'Descartar esta novidade')}
            </button>
            {unread.length > 1 && (
              <button type="button" onClick={p.onHistory}>
                {t(
                  'Otras novedades en esta vista',
                  'Other updates in this view',
                  'Outras novidades nesta tela',
                )}
                : {unread.length - 1}
              </button>
            )}
          </Actions>
        </div>
      )}
    </section>
  );
}
