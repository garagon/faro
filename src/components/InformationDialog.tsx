import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRightIcon, InfoIcon, MapPinIcon, XIcon } from '@phosphor-icons/react';
import { distanceKm, type Quake } from '../lib/domain.ts';
import type { Geo } from './WebMap.tsx';
type Props = {
  open: boolean;
  sourceOpen: boolean;
  selected: Quake | undefined;
  geo: Geo | null;
  lang: 'es' | 'en';
  provider: string;
  fetched: number | null;
  generated: number | null;
  onClose: () => void;
  onMap: (q: Quake) => void;
};
export default function InformationDialog(p: Props) {
  const { selected: q, lang } = p,
    t = (es: string, en: string) => (lang === 'es' ? es : en);
  const stamp = (n: number, utc = false) =>
    new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      timeStyle: 'medium',
      ...(utc ? { timeZone: 'UTC' } : {}),
    }).format(n);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
          className={`fw-modal fw-info-dialog ${p.sourceOpen ? 'fw-source-dialog' : 'fw-event-dialog'}`}
          lang={lang}
        >
          <header className="fw-dialog-header">
            <div>
              <Dialog.Title>
                {p.sourceOpen
                  ? t('Fuentes y actualización', 'Sources & updates')
                  : t('Detalle del sismo', 'Earthquake details')}
              </Dialog.Title>
              <Dialog.Description>
                {p.sourceOpen
                  ? t(
                      'Origen de los datos y frecuencia de consulta.',
                      'Data sources and refresh frequency.',
                    )
                  : t(
                      'Datos publicados por el catálogo oficial.',
                      'Data published by the official catalog.',
                    )}
              </Dialog.Description>
            </div>
            <Dialog.Close className="fw-dialog-close" aria-label={t('Cerrar', 'Close')}>
              <XIcon size={21} />
            </Dialog.Close>
          </header>
          <div className="fw-dialog-body">
            {p.sourceOpen ? (
              <>
                <section
                  className="fw-source-summary"
                  aria-label={t('Consulta actual', 'Current data check')}
                >
                  <h3>{p.provider}</h3>
                  <dl className="fw-dialog-facts">
                    <div>
                      <dt>{t('Última respuesta correcta', 'Last successful response')}</dt>
                      <dd>
                        {p.fetched ? stamp(p.fetched) : t('Aún sin respuesta', 'No response yet')}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('Actualización automática', 'Automatic refresh')}</dt>
                      <dd>
                        {t(
                          'Cada 60 segundos con la página visible',
                          'Every 60 seconds while the page is visible',
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('Generación del catálogo', 'Catalog generated')}</dt>
                      <dd>
                        {p.generated
                          ? stamp(p.generated)
                          : t('La fuente no indica esta fecha', 'Not provided by the source')}
                      </dd>
                    </div>
                  </dl>
                </section>
                <div className="fw-source-sections">
                  <section>
                    <h3>IGC · Universidad de Panamá</h3>
                    <p>
                      {t(
                        'Listado oficial de sismos. Las horas corresponden a Panamá (UTC−5). No publica fecha de generación ni identifica relaciones de réplica.',
                        'Official earthquake listing. Times use Panama time (UTC−5). It does not publish a generation timestamp or identify aftershock relationships.',
                      )}
                    </p>
                  </section>
                  <section>
                    <h3>USGS</h3>
                    <p>
                      {t(
                        'Catálogo global. La publicación puede demorar varios minutos y no incluye todos los sismos pequeños fuera de sus redes.',
                        'Global catalog. Publication can take several minutes and does not include every small earthquake outside its networks.',
                      )}
                    </p>
                  </section>
                </div>
                <details className="fw-dialog-disclosure">
                  <summary>
                    {t(
                      'Cómo interpretar las fechas y la cobertura',
                      'Understanding dates and coverage',
                    )}
                  </summary>
                  <p>
                    {t(
                      'La hora del evento corresponde al sismo; la última consulta indica cuándo Faro recibió los datos. IGC y USGS se muestran por separado para evitar duplicados entre redes.',
                      'Event time is when the earthquake occurred; last checked is when Faro received the data. IGC and USGS are shown separately to avoid duplicates between networks.',
                    )}
                  </p>
                  <p>
                    {t(
                      'La región incluye un área alrededor del país y puede abarcar países vecinos. Los avisos requieren que la página esté abierta; no hay notificaciones en segundo plano.',
                      'A region covers an area around the country and may include neighboring countries. Updates require the page to stay open; there are no background notifications.',
                    )}
                  </p>
                </details>
                <details className="fw-dialog-disclosure">
                  <summary>{t('Ubicación y privacidad', 'Location & privacy')}</summary>
                  <p>
                    {t(
                      'La ubicación requiere permiso y no se guarda automáticamente. El mapa se carga automáticamente al abrir su vista; OpenStreetMap recibe tu IP y el área consultada. Tus datos del viaje se guardan en este navegador.',
                      'Location requires permission and is not saved automatically. The map loads automatically when its view opens; OpenStreetMap receives your IP and viewed area. Your trip data is stored in this browser.',
                    )}
                  </p>
                </details>
                <details className="fw-dialog-disclosure">
                  <summary>{t('Datos cartográficos y licencias', 'Map data and licenses')}</summary>
                  <p>
                    {t(
                      'Países: datos derivados de world-countries, bajo ODbL-1.0. Costa: Natural Earth, dominio público.',
                      'Countries: data derived from world-countries, under ODbL-1.0. Coastline: Natural Earth, public domain.',
                    )}
                  </p>
                  <a href="https://github.com/mledoze/countries" target="_blank" rel="noreferrer">
                    world-countries
                  </a>
                  {' · '}
                  <a
                    href="https://opendatacommons.org/licenses/odbl/1-0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ODbL-1.0
                  </a>
                </details>
              </>
            ) : q ? (
              <>
                <section
                  className="fw-quake-summary"
                  aria-label={t('Sismo seleccionado', 'Selected earthquake')}
                >
                  <div className="fw-quake-magnitude">
                    <span>{t('Magnitud', 'Magnitude')}</span>
                    <strong>{q.mag?.toFixed(1) ?? '—'}</strong>
                  </div>
                  <div className="fw-quake-location">
                    <h3>
                      {q.place.replace(/^Localizado en\s+/i, '').replace(/(\d)km\b/g, '$1 km')}
                    </h3>
                    <div className="fw-quake-source">
                      <span>{q.source || 'USGS'}</span>
                      <span className="fw-review-status">
                        {q.reviewed ? t('Revisado', 'Reviewed') : t('Preliminar', 'Preliminary')}
                      </span>
                    </div>
                  </div>
                </section>
                <details className="fw-magnitude-explainer">
                  <summary>{t('Cómo leer la magnitud', 'Understanding magnitude')}</summary>
                  <p>
                    {t(
                      'La magnitud expresa el tamaño del sismo. La intensidad describe cuánto se sintió en un lugar y puede variar entre localidades.',
                      'Magnitude describes the size of an earthquake. Intensity describes shaking at a location and can vary from place to place.',
                    )}
                  </p>
                  <p>
                    {q.magType && q.magType.toUpperCase() !== 'M'
                      ? `${t('Tipo publicado por la fuente', 'Type reported by the source')}: ${q.magType}.`
                      : t(
                          'La fuente no especifica el tipo de magnitud para este registro.',
                          'The source does not specify a magnitude type for this record.',
                        )}
                  </p>
                  <a
                    href="https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('Magnitud e intensidad · USGS', 'Magnitude and intensity · USGS')} ↗
                  </a>
                </details>
                <dl className="fw-dialog-facts">
                  <div>
                    <dt>
                      {t('Fecha y hora', 'Date & time')}
                      <small>{zone}</small>
                    </dt>
                    <dd>
                      <time dateTime={new Date(q.time).toISOString()}>{stamp(q.time)}</time>
                    </dd>
                  </div>
                  <div>
                    <dt>{t('Profundidad', 'Depth')}</dt>
                    <dd>{q.depth} km</dd>
                  </div>
                  <div>
                    <dt>{t('Coordenadas del epicentro', 'Epicenter coordinates')}</dt>
                    <dd>
                      {q.lat.toFixed(4)}, {q.lng.toFixed(4)}
                    </dd>
                  </div>
                  {p.geo && (
                    <div>
                      <dt>{t('Distancia a tu ubicación', 'Distance from your location')}</dt>
                      <dd>{Math.round(distanceKm([p.geo.lat, p.geo.lng], [q.lat, q.lng]))} km</dd>
                    </div>
                  )}
                </dl>
                <div className="fw-event-context">
                  <InfoIcon size={19} />
                  <p>
                    {t(
                      'La magnitud y la distancia no determinan el riesgo en tu ubicación. Este catálogo no indica si el evento es una réplica.',
                      'Magnitude and distance do not determine risk at your location. This catalog does not identify whether the event is an aftershock.',
                    )}
                  </p>
                </div>
                <details className="fw-dialog-disclosure">
                  <summary>{t('Datos del registro', 'Record details')}</summary>
                  <dl className="fw-dialog-facts">
                    <div>
                      <dt>{t('Hora UTC', 'UTC time')}</dt>
                      <dd>{stamp(q.time, true)} UTC</dd>
                    </div>
                    <div>
                      <dt>{t('Última revisión', 'Last revision')}</dt>
                      <dd>
                        {q.updated
                          ? stamp(q.updated)
                          : t('La fuente no indica esta fecha', 'Not provided by the source')}
                      </dd>
                    </div>
                    <div>
                      <dt>ID</dt>
                      <dd className="fw-record-id">{q.id}</dd>
                    </div>
                  </dl>
                </details>
              </>
            ) : (
              <p>
                {t(
                  'Este evento ya no está en el catálogo actual.',
                  'This event is no longer in the current catalog.',
                )}
              </p>
            )}
          </div>
          {(p.sourceOpen || q) && (
            <footer className="fw-dialog-actions">
              {p.sourceOpen ? (
                <>
                  <a
                    className="fw-secondary"
                    href="https://sismosgeociencias.up.ac.pa/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('Sitio oficial IGC', 'Official IGC site')}
                    <ArrowUpRightIcon size={18} />
                  </a>
                  <a
                    className="fw-secondary"
                    href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('Documentación USGS', 'USGS documentation')}
                    <ArrowUpRightIcon size={18} />
                  </a>
                </>
              ) : (
                q && (
                  <>
                    <button className="fw-primary" onClick={() => p.onMap(q)}>
                      <MapPinIcon size={18} />
                      {t('Ver epicentro', 'View epicenter')}
                    </button>
                    {q.url && (
                      <a className="fw-secondary" href={q.url} target="_blank" rel="noreferrer">
                        {t('Reporte oficial', 'Official report')}
                        <ArrowUpRightIcon size={18} />
                      </a>
                    )}
                  </>
                )
              )}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
