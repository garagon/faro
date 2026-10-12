import { useMemo, useState } from 'react';
import { ArrowUpRightIcon, MapPinIcon, NavigationArrowIcon } from '@phosphor-icons/react';
import { embassyFor, directionsUrl, consularFallback, type Embassy } from '../lib/embassies.ts';
import CountrySearch from './CountrySearch.tsx';
import WebMap from './WebMap.tsx';
import type { Quake } from '../lib/domain.ts';
const noEvents: Quake[] = [];
const noop = () => {};
const displayPhone = (number: string) =>
  number.startsWith('+507') ? `+507 ${number.slice(4, -4)} ${number.slice(-4)}` : number;
type Props = {
  savedNationality: string | null;
  onProfile: () => void;
  lang: 'es' | 'en';
  country: string;
  nationality: string;
  onNationalityChange: (value: string) => void;
  onMap: (e: Embassy) => void;
};
export default function EmbassyPanel({
  savedNationality,
  onProfile,
  lang,
  country,
  nationality,
  onNationalityChange,
  onMap,
}: Props) {
  const [mode, setMode] = useState<'walking' | 'driving'>('walking');
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const names = useMemo(() => new Intl.DisplayNames([lang], { type: 'region' }), [lang]);
  const countryName =
    country === 'WORLD' ? t('un país', 'a country') : names.of(country) || country;
  const embassy = embassyFor(country, nationality);
  const fallback = consularFallback(country, nationality);
  const markers = useMemo(() => (embassy ? [embassy] : []), [embassy]);
  const view = useMemo(
    () => ({ lat: embassy?.lat || 8.5, lng: embassy?.lng || -80, zoom: 15, key: 0 }),
    [embassy],
  );
  return (
    <section
      className={`fw-consular ${nationality ? 'has-nationality' : ''}`}
      aria-label={t('Asistencia consular', 'Consular assistance')}
    >
      <aside className="fw-nationality">
        <h2>{t('Asistencia consular', 'Consular assistance')}</h2>
        <p>
          {t(
            'Tu nacionalidad determina qué representación puede ayudarte.',
            'Your nationality determines which mission can assist you.',
          )}
        </p>
        <CountrySearch
          label={t('País de nacionalidad', 'Country of nationality')}
          lang={lang}
          value={nationality}
          onChange={onNationalityChange}
        />
        <div className="fw-nationality-context">
          <span>{t('Buscando representación en', 'Representation in')}</span>
          <strong>
            {country === 'WORLD' ? t('Selecciona una región', 'Select a region') : countryName}
          </strong>
        </div>
        <small>
          {savedNationality === nationality && nationality
            ? t('Nacionalidad guardada en tu perfil.', 'Nationality saved in your profile.')
            : t(
                'Esta selección se aplica a la consulta actual. Guárdala en tu perfil para otra visita.',
                'This selection applies to the current search. Save it in your profile for another visit.',
              )}
        </small>
        <button className="fw-text" onClick={onProfile}>
          {t('Editar perfil del viaje', 'Edit trip profile')}
        </button>
      </aside>
      {!nationality ? (
        <div className="fw-mission-empty">
          <span>{t('Asistencia consular', 'Consular assistance')}</span>
          <h2>{t('Encuentra tu embajada', 'Find your embassy')}</h2>
          <p>
            {t(
              'Consulta su ubicación, contacto oficial y ruta de acceso.',
              'View its location, official contact and directions.',
            )}
          </p>
          <small>
            {t(
              'Cobertura inicial: Argentina, Colombia, España, Estados Unidos y México en Panamá.',
              'Initial coverage: Argentina, Colombia, Spain, the United States and Mexico in Panama.',
            )}
          </small>
        </div>
      ) : nationality === country ? (
        <div className="fw-mission-empty">
          <span>{countryName}</span>
          <h2>{t('Asistencia en tu país', 'Assistance in your home country')}</h2>
          <p>
            {t(
              'Estás consultando tu país de nacionalidad. Usa los servicios de emergencia y las autoridades locales de esta página.',
              'You are viewing your country of nationality. Use the emergency services and local authorities on this page.',
            )}
          </p>
        </div>
      ) : !embassy ? (
        <div className="fw-mission-empty" role="status">
          <span>{names.of(nationality)}</span>
          <h2>
            {fallback
              ? t('Consulta el directorio oficial', 'Check the official directory')
              : t('Sin contacto verificado', 'No verified contact')}
          </h2>
          <p>
            {t(
              `No tenemos una representación de ${names.of(nationality)} verificada en ${countryName}. Consulta la cancillería de tu país.`,
              `We do not have a verified ${names.of(nationality)} mission in ${countryName}. Check your country's foreign ministry.`,
            )}
          </p>
          {fallback && (
            <div className="fw-consular-fallback">
              <a href={fallback.url} target="_blank" rel="noreferrer">
                {fallback.label[lang === 'es' ? 0 : 1]} ↗
              </a>
              {fallback.note && <p>{fallback.note[lang === 'es' ? 0 : 1]}</p>}
            </div>
          )}
          <small>
            {t(
              'No se marcó ninguna embajada en el mapa.',
              'No embassy has been marked on the map.',
            )}
          </small>
        </div>
      ) : (
        <div className="fw-mission" key={embassy.id}>
          <article className="fw-mission-info">
            <div className="fw-mission-kicker">
              {names.of(embassy.nation)}
              <span> / </span>
              {countryName}
            </div>
            <h2>{embassy.name[lang === 'es' ? 0 : 1]}</h2>
            <address>
              <MapPinIcon size={18} />
              <span>{embassy.address}</span>
            </address>
            {embassy.phone && (
              <div className="fw-consular-contacts">
                <a href={`tel:${embassy.phone}`}>
                  {t('Teléfono', 'Phone')}: {displayPhone(embassy.phone)}
                </a>
                {embassy.hours && <p>{embassy.hours[lang === 'es' ? 0 : 1]}</p>}
                {embassy.emergency && (
                  <div>
                    <span>
                      {t(
                        'Guardia consular · fuera de horario',
                        'Consular emergency line · after hours',
                      )}
                    </span>
                    <a href={`tel:${embassy.emergency}`}>{displayPhone(embassy.emergency)}</a>
                    <small>
                      {t(
                        'Solo emergencias que afecten a ciudadanos argentinos.',
                        'Only emergencies affecting Argentine citizens.',
                      )}
                    </small>
                    <a href={embassy.emergencySource} target="_blank" rel="noreferrer">
                      {t('Cuándo llamar', 'When to call')} ↗
                    </a>
                  </div>
                )}
              </div>
            )}
            {embassy.note && (
              <p className="fw-mission-notice">{embassy.note[lang === 'es' ? 0 : 1]}</p>
            )}
            <a
              className="fw-official-contact"
              href={embassy.source}
              target="_blank"
              rel="noreferrer"
            >
              {t('Contacto y horarios oficiales', 'Official contact and opening hours')}
              <ArrowUpRightIcon size={16} />
            </a>
            <div className="fw-route">
              <span>{t('Cómo llegar', 'Directions')}</span>
              <div className="fw-route-controls">
                <div
                  className="fw-route-modes"
                  role="group"
                  aria-label={t('Transporte', 'Transport')}
                >
                  <button aria-pressed={mode === 'walking'} onClick={() => setMode('walking')}>
                    {t('A pie', 'Walking')}
                  </button>
                  <button aria-pressed={mode === 'driving'} onClick={() => setMode('driving')}>
                    {t('En vehículo', 'Driving')}
                  </button>
                </div>
                <a
                  className="fw-primary"
                  href={directionsUrl(embassy, mode)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <NavigationArrowIcon size={17} />
                  {t('Abrir ruta', 'Open directions')}
                </a>
              </div>
              <small>
                {t(
                  'Google Maps solicitará tu punto de partida.',
                  'Google Maps will ask for your starting point.',
                )}
              </small>
            </div>
            <p className="fw-mission-safety">
              {t(
                'Confirma la atención antes de ir. La embajada no es un refugio y la ruta no está verificada tras el sismo.',
                'Confirm services before travelling. The embassy is not a shelter and the route has not been verified after the earthquake.',
              )}
            </p>
            <details className="fw-mission-source">
              <summary>{t('Fuente y verificación', 'Source and verification')}</summary>
              <p>
                {t(
                  'Dirección revisada el 11 oct 2026. El marcador indica el edificio de forma aproximada, no la entrada.',
                  'Address checked on Oct 11, 2026. The marker indicates the approximate building location, not its entrance.',
                )}
              </p>
              <a href={embassy.mapSource} target="_blank" rel="noreferrer">
                OpenStreetMap
              </a>
            </details>
          </article>
          <div className="fw-mission-map">
            <WebMap
              label={t('Ubicación de tu embajada', 'Your embassy location')}
              lang={lang}
              embassies={markers}
              events={noEvents}
              view={view}
              geo={null}
              point={null}
              selected={undefined}
              onSelect={noop}
              onBounds={noop}
            />
            <div>
              <span>{t('Ubicación aproximada', 'Approximate location')}</span>
              <button onClick={() => onMap(embassy)}>
                {t('Ver en mapa de sismos', 'View on earthquake map')}
                <ArrowUpRightIcon size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
