import { useRef } from 'react';
import { magnitudeBand } from '../lib/magnitude.ts';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRightIcon, MapPinIcon, XIcon } from '@phosphor-icons/react';
import { displayPlace, distanceKm, type Quake } from '../lib/domain.ts';
import type { Geo } from './WebMap.tsx';
import QuakeImpact from './QuakeImpact.tsx';
import { langTag, pick, type Lang } from '../lib/i18n.ts';
import { depthInFull, distance } from '../lib/units.ts';
type Props = {
  open: boolean;
  selected: Quake | undefined;
  geo: Geo | null;
  lang: Lang;
  provider: string;
  fetched: number | null;
  generated: number | null;
  onClose: () => void;
  onMap: (q: Quake) => void;
  onTsunami: () => void;
};
export default function InformationDialog(p: Props) {
  const opener = useRef<HTMLElement | null>(null);
  const { selected: q, lang } = p,
    t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const stamp = (n: number, utc = false) =>
    new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      timeStyle: 'medium',
      ...(utc ? { timeZone: 'UTC' } : {}),
    }).format(n);
  const local = (n: number) =>
    new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(n);
  const zoneName = (n: number) =>
    new Intl.DateTimeFormat(lang, { timeZoneName: 'short' })
      .formatToParts(n)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  const ago = (n: number) => {
    const min = Math.max(0, Math.round((Date.now() - n) / 60000));
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
  return (
    <Dialog.Root
      open={p.open}
      onOpenChange={(open) => {
        if (!open) p.onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fw-modal-overlay" />
        <Dialog.Content
          className="fw-modal fw-info-dialog fw-event-dialog"
          lang={langTag(lang)}
          // Remember what opened the dialog (a list row or a map pin) and return focus there.
          onOpenAutoFocus={() => {
            opener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            if (opener.current?.isConnected) {
              event.preventDefault();
              opener.current.focus({ preventScroll: true });
            }
          }}
        >
          {q ? (
            <header className="fw-qd-head">
              <p className={`fw-qd-mag fw-mag-band-${magnitudeBand(q.mag)}`}>
                <strong>{q.mag?.toFixed(1) ?? '—'}</strong>
                <span>
                  {t('magnitud', 'magnitude', 'magnitude')}
                  {q.magType && q.magType.toUpperCase() !== 'M' ? ` ${q.magType}` : ''}
                </span>
              </p>
              <div>
                <Dialog.Title>{displayPlace(q.place)}</Dialog.Title>
                <Dialog.Description>
                  {ago(q.time)} · {q.source || 'USGS'}
                  {q.authority ? `, ${q.authority}` : ''} ·{' '}
                  {q.reviewed
                    ? t('revisado', 'reviewed', 'revisado')
                    : q.source === 'EMSC'
                      ? t('revisión no informada', 'review not reported', 'revisão não informada')
                      : t('preliminar', 'preliminary', 'preliminar')}
                </Dialog.Description>
              </div>
              <Dialog.Close className="fw-dialog-close" aria-label={t('Cerrar', 'Close', 'Fechar')}>
                <XIcon size={21} />
              </Dialog.Close>
            </header>
          ) : (
            <header className="fw-dialog-header">
              <div>
                <Dialog.Title>
                  {t('Detalle del sismo', 'Earthquake details', 'Detalhes do terremoto')}
                </Dialog.Title>
                <Dialog.Description>
                  {t(
                    'Datos publicados por el catálogo oficial.',
                    'Data published by the official catalog.',
                    'Dados publicados pelo catálogo oficial.',
                  )}
                </Dialog.Description>
              </div>
              <Dialog.Close className="fw-dialog-close" aria-label={t('Cerrar', 'Close', 'Fechar')}>
                <XIcon size={21} />
              </Dialog.Close>
            </header>
          )}
          <div className="fw-dialog-body">
            {q ? (
              <>
                <dl className="fw-qd-facts">
                  <div>
                    <dt>{t('Hora', 'Time', 'Horário')}</dt>
                    <dd>
                      <time dateTime={new Date(q.time).toISOString()}>{local(q.time)}</time>{' '}
                      <span>{zoneName(q.time)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t('Hora UTC', 'UTC time', 'Horário UTC')}</dt>
                    <dd>{stamp(q.time, true)}</dd>
                  </div>
                  <div>
                    <dt>{t('Profundidad', 'Depth', 'Profundidade')}</dt>
                    <dd>{depthInFull(q.depth, lang)}</dd>
                  </div>
                  <div>
                    <dt>{t('Epicentro', 'Epicenter', 'Epicentro')}</dt>
                    <dd>
                      {q.lat.toFixed(4)}, {q.lng.toFixed(4)}
                    </dd>
                  </div>
                  {p.geo && (
                    <div>
                      <dt>{t('Distancia a ti', 'Distance from you', 'Distância de você')}</dt>
                      <dd>{distance(distanceKm([p.geo.lat, p.geo.lng], [q.lat, q.lng]), lang)}</dd>
                    </div>
                  )}
                </dl>
                <p className="fw-qd-note">
                  {t(
                    'La magnitud y la distancia no determinan el riesgo en tu ubicación. El catálogo no indica si el sismo es una réplica.',
                    'Magnitude and distance do not determine risk at your location. The catalog does not say whether the earthquake is an aftershock.',
                    'A magnitude e a distância não determinam o risco na sua localização. O catálogo não indica se o terremoto é uma réplica.',
                  )}
                </p>
                <QuakeImpact q={q} lang={lang} onTsunami={p.onTsunami} />
                <details className="fw-qd-more">
                  <summary>
                    {t('Más datos del registro', 'More record details', 'Mais dados do registro')}
                  </summary>
                  <dl className="fw-qd-facts">
                    <div>
                      <dt>{t('Última revisión', 'Last revision', 'Última revisão')}</dt>
                      <dd>
                        {q.updated
                          ? stamp(q.updated)
                          : t(
                              'La fuente no indica esta fecha',
                              'Not provided by the source',
                              'A fonte não indica esta data',
                            )}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('Tipo de magnitud', 'Magnitude type', 'Tipo de magnitude')}</dt>
                      <dd>
                        {q.magType && q.magType.toUpperCase() !== 'M'
                          ? q.magType
                          : t(
                              'No especificado por la fuente',
                              'Not specified by the source',
                              'Não especificado pela fonte',
                            )}
                      </dd>
                    </div>
                    <div>
                      <dt>ID</dt>
                      <dd className="fw-record-id">{q.id}</dd>
                    </div>
                  </dl>
                  <p>
                    {t(
                      'La magnitud expresa el tamaño del sismo. La intensidad describe cuánto se sintió en un lugar y puede variar entre localidades.',
                      'Magnitude describes the size of an earthquake. Intensity describes shaking at a location and can vary from place to place.',
                      'A magnitude expressa o tamanho do terremoto. A intensidade descreve quanto ele foi sentido em um lugar e pode variar entre localidades.',
                    )}{' '}
                    <a
                      href="https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t(
                        'Magnitud e intensidad, USGS',
                        'Magnitude and intensity, USGS',
                        'Magnitude e intensidade, USGS',
                      )}
                    </a>
                  </p>
                </details>
              </>
            ) : (
              <p>
                {t(
                  'Este evento ya no está en el catálogo actual.',
                  'This event is no longer in the current catalog.',
                  'Este evento não está mais no catálogo atual.',
                )}
              </p>
            )}
          </div>
          {q && (
            <footer className="fw-dialog-actions">
              <>
                <button className="fw-primary" onClick={() => p.onMap(q)}>
                  <MapPinIcon size={18} aria-hidden="true" />
                  {t('Ver en el mapa', 'Show on map', 'Ver no mapa')}
                </button>
                {q.url && (
                  <a className="fw-secondary" href={q.url} target="_blank" rel="noreferrer">
                    {t('Reporte oficial', 'Official report', 'Relatório oficial')}
                    <ArrowUpRightIcon size={16} aria-hidden="true" />
                  </a>
                )}
              </>
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
