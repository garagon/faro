import NearbyCare from './components/NearbyCare.tsx';
import EvacuationPlan from './components/EvacuationPlan.tsx';
import MagnitudeLegend from './components/MagnitudeLegend.tsx';
import { magnitudeBand } from './lib/magnitude.ts';
import CountrySearch from './components/CountrySearch.tsx';
import DestinationInfo from './components/DestinationInfo.tsx';
import { hasCountryBoundary, inCountryScope } from './lib/countryScope.ts';
import { WORLD, countryCodes, regionFor, regionScope } from './lib/regions.ts';
import EmergencyDialog from './components/EmergencyDialog.tsx';
import LocalDataInfo from './components/LocalDataInfo.tsx';
import { writeLocal, removeLocal } from './lib/browserStorage.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import InformationDialog from './components/InformationDialog.tsx';
import {
  ArrowUpRightIcon,
  ArrowClockwiseIcon,
  MapPinIcon,
  CrosshairIcon,
  BuildingsIcon,
  BookOpenTextIcon,
  UsersThreeIcon,
  XIcon,
  GlobeHemisphereWestIcon,
  FlagIcon,
  DownloadSimpleIcon,
  CheckCircleIcon,
  InfoIcon,
  ChatCircleTextIcon,
  UserCircleIcon,
  PhoneIcon,
} from '@phosphor-icons/react';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-serif-display/latin-400.css';
import countries from './data/countries.json';
import { distanceKm, filterEvents, type Quake, type Bounds } from './lib/domain.ts';
import { useLiveFeed } from './hooks/useLiveFeed.ts';
import LiveActivity from './components/LiveActivity.tsx';
import TravelSetup from './components/TravelSetup.tsx';
import {
  readPreferences,
  storePreferences,
  forgetPreferences,
  type Preferences,
} from './lib/preferences.ts';
import WebMap, { type Geo, type MapView } from './components/WebMap.tsx';
import {
  resources,
  validPlan,
  planCoordinates,
  type HotelPlan,
  type Lang,
} from './lib/resources.ts';
import './styles/web.css';
import './styles/professional.css';
import './styles/workspace.css';
import './styles/liveActivity.css';
import './styles/travelSetup.css';
import './styles/countrySearch.css';
import './styles/dialogs.css';
import './styles/urgentFlows.css';
import './styles/checkIn.css';
import { useIGC } from './hooks/useIGC.ts';
import CoastalPanel from './components/CoastalPanel.tsx';
import EmbassyPanel from './components/EmbassyPanel.tsx';
import SafetyGuide from './components/SafetyGuide.tsx';
import TravelerStatus from './components/TravelerStatus.tsx';
import TravelContacts from './components/TravelContacts.tsx';
import EmergencyNumbers from './components/EmergencyNumbers.tsx';
import { readCheckIns, checkInDue } from './lib/traveler.ts';
import { type Embassy } from './lib/embassies.ts';
import { mappedMissions } from './data/consularMissions.ts';
function setupSkipped() {
  try {
    return sessionStorage.getItem('faro-setup-skipped') === 'yes';
  } catch {
    return false;
  }
}
type Screen = 'activity' | 'help' | 'hotel' | 'guide' | 'status';
const emptyPlan: HotelPlan = {
  name: '',
  meeting: '',
  notes: '',
  lat: '',
  lng: '',
  savedAt: 0,
  country: 'PA',
};
function readPlan() {
  try {
    const p = JSON.parse(localStorage.getItem('faro-hotel-v1') || 'null');
    return validPlan(p) ? p : null;
  } catch {
    return null;
  }
}
function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function App() {
  const [profile, setProfile] = useState(() => readPreferences(countryCodes));
  const [setupOpen, setSetupOpen] = useState(
      () => (!profile || !profile.nationality) && !setupSkipped(),
    ),
    [profileFeedback, setProfileFeedback] = useState<'saved' | 'deleted' | 'storage' | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  useEffect(() => {
    if (!profileFeedback || profileFeedback === 'storage') return;
    const timer = setTimeout(() => setProfileFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [profileFeedback]);
  const initialRegion = useMemo(() => regionFor(profile?.destination ?? 'PA'), []);
  const [checkIns, setCheckIns] = useState(readCheckIns);
  const [lang, setLang] = useState<Lang>(() => {
    if (profile) return profile.language;
    try {
      return localStorage.getItem('faro-lang') === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  });
  const t = (es: string, en: string) => (lang === 'es' ? es : en),
    idx = lang === 'es' ? 0 : 1;
  const [catalog, setCatalog] = useState<'USGS' | 'IGC'>(
      profile && profile.destination !== 'PA' ? 'USGS' : 'IGC',
    ),
    [timeZone, setTimeZone] = useState<'local' | 'utc'>('local'),
    [showEmbassies, setShowEmbassies] = useState(false),
    [nationality, setNationality] = useState(profile?.nationality ?? '');
  const usgs = useLiveFeed(),
    igc = useIGC();
  const live = catalog === 'IGC' ? igc : usgs,
    provider = catalog === 'IGC' ? 'IGC · UP' : 'USGS';
  const appRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('activity'),
    [country, setCountry] = useState(profile?.destination ?? 'PA'),
    [hours, setHours] = useState(24),
    [minMag, setMinMag] = useState(0),
    [maxDepth, setMaxDepth] = useState(800),
    [order, setOrder] = useState('time'),
    [radius, setRadius] = useState(300),
    [scope, setScope] = useState<'country' | 'area' | 'nearby'>('country'),
    [limit, setLimit] = useState(20),
    [listOnly, setListOnly] = useState(() => window.matchMedia('(max-width:760px)').matches);
  const [bounds, setBounds] = useState<Bounds>(initialRegion.bounds),
    [pending, setPending] = useState<Bounds>(initialRegion.bounds),
    [view, setView] = useState<MapView>(initialRegion.view),
    [detail, setDetail] = useState<string | null>(null),
    [sourceOpen, setSourceOpen] = useState(false),
    [geo, setGeo] = useState<Geo | null>(null),
    [tracking, setTracking] = useState(false),
    [geoState, setGeoState] = useState<'idle' | 'pending' | 'active' | 'denied' | 'failed'>('idle');
  const watch = useRef<number | null>(null),
    firstFix = useRef(true);
  const [plan, setPlan] = useState<HotelPlan | null>(readPlan),
    [draft, setDraft] = useState<HotelPlan>(() => readPlan() || emptyPlan),
    [message, setMessage] = useState<'saved' | 'storage' | 'invalid' | null>(null);
  const [savedCountries, setSavedCountries] = useState<string[]>(() => {
    try {
      const a = JSON.parse(localStorage.getItem('faro-zones-v1') || '[]');
      return Array.isArray(a) ? a.filter((v) => typeof v === 'string') : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    appRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);
  const names = useMemo(() => new Intl.DisplayNames([lang], { type: 'region' }), [lang]);
  const countryName =
    country === 'WORLD' ? t('Todo el mundo', 'Worldwide') : names.of(country) || country;
  const stamp = (n: number) =>
    new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'medium' }).format(n);
  const shortTime = (n: number) =>
    new Intl.DateTimeFormat(lang, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZone === 'utc' ? 'UTC' : undefined,
    }).format(n);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t(
      'Faro by Oktsec · Sismos y ayuda para viajeros',
      'Faro by Oktsec · Earthquakes and travel preparedness',
    );
    try {
      writeLocal('faro-lang', lang);
    } catch {
      setProfileFeedback('storage');
    }
  }, [lang]);
  useEffect(
    () => () => {
      if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    },
    [],
  );
  const center = (lat: number, lng: number, zoom = 8) =>
    setView((v) => ({ lat, lng, zoom, key: v.key + 1 }));
  const stopLocation = () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    setTracking(false);
    setGeo(null);
    setGeoState('idle');
    setScope('country');
  };
  const locate = () => {
    if (!navigator.geolocation) {
      setGeoState('failed');
      return;
    }
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    firstFix.current = true;
    setTracking(true);
    setGeoState('pending');
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        const g = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          at: p.timestamp,
        };
        setGeo(g);
        setGeoState('active');
        if (firstFix.current) {
          setScope('nearby');
          center(g.lat, g.lng, 7);
          firstFix.current = false;
        }
      },
      (e) => {
        setGeoState(e.code === 1 ? 'denied' : 'failed');
        setTracking(false);
        setGeo(null);
        setScope('country');
        if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
        watch.current = null;
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };
  const changeCountry = (code: string) => {
    const region = regionFor(code);
    setCountry(code);
    setCatalog(code === 'PA' ? 'IGC' : 'USGS');
    // Browsing another country must not discard a separately enabled location fix.
    firstFix.current = false;
    setScope('country');
    setLimit(20);
    setFocused(null);
    setDetail(null);
    setBounds(region.bounds);
    setPending(region.bounds);
    center(region.view.lat, region.view.lng, region.view.zoom);
  };
  const closeSetup = () => {
    setSetupOpen(false);
    try {
      sessionStorage.setItem('faro-setup-skipped', 'yes');
    } catch {}
  };
  const saveProfile = (value: Preferences) => {
    const saved = storePreferences(value, countryCodes);
    setProfile(saved);
    setLang(saved.language);
    setNationality(saved.nationality);
    setShowEmbassies(!!saved.nationality);
    changeCountry(saved.destination);
    setSetupOpen(false);
    setProfileFeedback('saved');
  };
  const changeLanguage = (value: Lang) => {
    if (profile) {
      try {
        setProfile(
          storePreferences({ ...profile, language: value, savedAt: Date.now() }, countryCodes),
        );
      } catch {
        setProfileFeedback('storage');
        return;
      }
    }
    setLang(value);
  };
  const deleteProfile = () => {
    forgetPreferences();
    setProfile(null);
    setNationality('');
    setShowEmbassies(false);
    closeSetup();
    setProfileFeedback('deleted');
  };

  const temporal = useMemo(
    () => filterEvents(live.events, WORLD, hours, minMag, maxDepth, live.now),
    [live.events, hours, minMag, maxDepth, Math.floor(live.now / 10000)],
  );
  const results = useMemo(() => {
    const arr =
      scope === 'nearby' && geo
        ? temporal.filter((e) => distanceKm([geo.lat, geo.lng], [e.lat, e.lng]) <= radius)
        : scope === 'country' && (country === 'WORLD' || hasCountryBoundary(country))
          ? temporal.filter((e) => inCountryScope(e, country))
          : filterEvents(temporal, bounds, hours, minMag, maxDepth, live.now);
    if (order === 'magnitude') arr.sort((a, b) => (b.mag ?? -Infinity) - (a.mag ?? -Infinity));
    if (order === 'distance' && geo)
      arr.sort(
        (a, b) =>
          distanceKm([geo.lat, geo.lng], [a.lat, a.lng]) -
          distanceKm([geo.lat, geo.lng], [b.lat, b.lng]),
      );
    return arr;
  }, [temporal, bounds, scope, country, geo, radius, order]);
  const newIds = new Set(
    live.updates.filter((u) => live.now - u.receivedAt < 600000).map((u) => u.event.id),
  );
  const showEpicentre = (q: Quake) => {
    setDetail(null);
    setFocused(q.id);
    setListOnly(false);
    center(q.lat, q.lng, 9);
    requestAnimationFrame(() =>
      appRef.current
        ?.querySelector('.fw-map-card')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    );
  };
  const point = useMemo(() => planCoordinates(plan), [plan]);
  const availableEmbassy = mappedMissions(country, nationality)[0];
  const mappedEmbassies = useMemo(
    () => (showEmbassies ? mappedMissions(country, nationality) : []),
    [showEmbassies, country, nationality],
  );
  const selected = live.events.find((q) => q.id === detail),
    visiblePoint = plan?.country === country ? point : null;
  const regionResources = resources.filter((r) => r.country === country || r.country === '*');
  const stale =
      live.failed ||
      !live.online ||
      (live.fetched > 0 && live.now - live.fetched > 120000) ||
      (live.generated > 0 && live.now - live.generated > 600000),
    dirty =
      Math.abs(bounds.west - pending.west) > 0.5 || Math.abs(bounds.north - pending.north) > 0.5;
  const saveCountry = () => {
    const list = savedCountries.includes(country)
      ? savedCountries.filter((x) => x !== country)
      : [...savedCountries, country];
    try {
      writeLocal('faro-zones-v1', JSON.stringify(list));
      setSavedCountries(list);
    } catch {
      setProfileFeedback('storage');
    }
  };
  const savePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if ((draft.lat.trim() || draft.lng.trim()) && !planCoordinates(draft)) {
      setMessage('invalid');
      return;
    }
    const p = {
      ...draft,
      name: draft.name.trim(),
      meeting: draft.meeting.trim(),
      savedAt: Date.now(),
      country,
    };
    try {
      writeLocal('faro-hotel-v1', JSON.stringify(p));
      setPlan(p);
      setDraft(p);
      setMessage('saved');
    } catch {
      setMessage('storage');
    }
  };
  const exportPlan = () => {
    if (!plan) return;
    download(
      `FARO · ${t('Plan personal del hotel', 'Personal hotel plan')}\n${t('No es un punto seguro certificado. Confirma la ruta y disponibilidad con recepción.', 'Not a certified safe point. Confirm the route and availability with reception.')}\n\n${plan.name}\n${plan.meeting}\n${plan.notes}\n${point ? point.join(', ') : ''}\n${t('Guardado', 'Saved')}: ${stamp(plan.savedAt)}`,
      'faro-hotel.txt',
    );
  };
  const nav = [
    { id: 'activity', title: t('Actividad', 'Activity'), Icon: MapPinIcon },
    { id: 'help', title: t('Ayuda local', 'Local help'), Icon: UsersThreeIcon },
    {
      id: 'status',
      title: t('Mi estado', 'My status'),
      Icon: ChatCircleTextIcon,
      UserCircleIcon,
      PhoneIcon,
    },
    { id: 'hotel', title: t('Mi viaje', 'My trip'), Icon: BuildingsIcon },
    { id: 'guide', title: t('Qué hacer', 'What to do'), Icon: BookOpenTextIcon },
  ] as const;
  return (
    <div className="fw-app" ref={appRef} data-screen={screen}>
      <a className="fw-skip" href="#main">
        {t('Saltar al contenido', 'Skip to content')}
      </a>
      <header className="fw-header">
        <button
          className="fw-brand"
          onClick={() => setScreen('activity')}
          aria-label={t('Faro, inicio', 'Faro, home')}
        >
          <img src="/faro-mark.svg" alt="" />
          Faro
        </button>
        <span className="fw-nav-caption">{t('EN ESTE VIAJE', 'ON THIS TRIP')}</span>
        <nav aria-label={t('Navegación principal', 'Main navigation')}>
          {nav.map(({ id, title, Icon }) => (
            <button
              key={id}
              className={screen === id ? 'current' : ''}
              aria-current={screen === id ? 'page' : undefined}
              onClick={() => setScreen(id)}
            >
              <Icon size={19} />
              <span>{title}</span>
            </button>
          ))}
        </nav>
        <div className="fw-sidebar-foot">
          <button
            className="fw-emergency-trigger fw-emergency-persistent"
            onClick={() => setEmergencyOpen(true)}
          >
            <PhoneIcon size={19} aria-hidden="true" />
            {t('Emergencias', 'Emergency')}
          </button>
          <button
            className="fw-profile-button"
            onClick={() => setSetupOpen(true)}
            aria-label={t('Configurar mi viaje', 'Trip preferences')}
          >
            <UserCircleIcon size={22} />
            <span>
              {t('Datos de mi viaje', 'My trip preferences')}
              <small>{profile ? names.of(profile.destination) : t('Configurar', 'Set up')}</small>
            </span>
          </button>
          <button className="fw-source-access" onClick={() => setSourceOpen(true)}>
            <InfoIcon size={19} />
            <span>
              {t('Fuentes y cobertura', 'Sources & coverage')}
              <small>IGC · USGS · NOAA</small>
            </span>
          </button>
          <div className="fw-language" aria-label={t('Idioma', 'Language')}>
            <button aria-pressed={lang === 'es'} onClick={() => changeLanguage('es')}>
              ES
            </button>
            <button aria-pressed={lang === 'en'} onClick={() => changeLanguage('en')}>
              EN
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="fw-main" data-screen={screen}>
        {profileFeedback && (
          <div className="fw-save-feedback">
            <span role="status">
              {profileFeedback === 'storage'
                ? t(
                    'No se pudo guardar el cambio en este navegador. Inténtalo de nuevo.',
                    'Could not save the change in this browser. Please retry.',
                  )
                : profileFeedback === 'saved'
                  ? t(
                      'Datos del viaje guardados en este navegador.',
                      'Trip preferences saved in this browser.',
                    )
                  : t(
                      'Perfil borrado. Tus contactos y planes se conservaron.',
                      'Profile deleted. Your contacts and plans were kept.',
                    )}
            </span>
            {profileFeedback === 'saved' && (
              <button
                onClick={() => {
                  setScreen('hotel');
                  setProfileFeedback(null);
                }}
              >
                {t('Preparar mi viaje', 'Prepare my trip')}
              </button>
            )}
            <button
              aria-label={t('Cerrar confirmación', 'Dismiss confirmation')}
              onClick={() => setProfileFeedback(null)}
            >
              <XIcon size={18} />
            </button>
          </div>
        )}
        <div className="fw-context">
          <div className="fw-country">
            <GlobeHemisphereWestIcon size={22} />
            <CountrySearch
              label={t('País de consulta', 'Country to view')}
              value={country}
              lang={lang}
              includeWorld
              onChange={(code) => {
                if (code) changeCountry(code);
              }}
            />
            <button
              className="fw-icon"
              onClick={saveCountry}
              aria-label={
                savedCountries.includes(country)
                  ? t('Quitar zona guardada', 'Remove saved area')
                  : t('Guardar zona', 'Save area')
              }
            >
              <FlagIcon size={20} weight={savedCountries.includes(country) ? 'fill' : 'regular'} />
            </button>
          </div>
          {screen === 'activity' && (
            <button className="fw-live" onClick={() => setSourceOpen(true)}>
              <i className={stale ? 'stale' : ''} />
              {!live.fetched
                ? `${provider} · ${t('Conectando…', 'Connecting…')}`
                : stale
                  ? `${provider} · ${t('datos anteriores', 'older data')}`
                  : `${provider} · ${t('consulta cada 60 s', 'checked every 60 s')}`}
              <span>
                {live.busy ? t('Consultando…', 'Refreshing…') : t('Ver fuente', 'View source')}
              </span>
            </button>
          )}
        </div>
        {screen !== 'guide' && screen !== 'status' && savedCountries.length > 0 && (
          <div className="fw-saved">
            <small>{t('Guardados', 'Saved')}</small>
            {savedCountries
              .filter((c) => c === 'WORLD' || countries.some((x) => x.code === c))
              .map((c) => (
                <button key={c} onClick={() => changeCountry(c)}>
                  {c === 'WORLD' ? t('Mundo', 'World') : names.of(c)}
                </button>
              ))}
          </div>
        )}
        {screen === 'activity' && stale && (
          <div className="fw-warning" role="status">
            {t(
              'No hay una actualización reciente. Estos registros pueden estar desactualizados.',
              'No recent update. These records may be out of date.',
            )}{' '}
            {live.fetched
              ? `${t('Última consulta correcta', 'Last successful check')}: ${stamp(live.fetched)}`
              : t('Todavía no se recibieron datos.', 'No data received yet.')}
            <button onClick={() => void live.refresh()}>{t('Reintentar', 'Retry')}</button>
          </div>
        )}
        {screen !== 'status' && checkInDue(checkIns[0], live.now) && (
          <div className="fw-checkin-reminder" role="status">
            <span>
              {t('Tienes pendiente avisar cómo estás.', 'Your planned check-in is overdue.')}
            </span>
            <button onClick={() => setScreen('status')}>
              {t('Actualizar mi estado', 'Update my status')} →
            </button>
          </div>
        )}
        <div className="fw-heading">
          <div>
            <h1>
              {screen === 'activity'
                ? t('Actividad sísmica', 'Earthquake activity')
                : screen === 'help'
                  ? t('Ayuda local', 'Local help')
                  : screen === 'status'
                    ? t('Avisar cómo estoy', 'Send a status update')
                    : screen === 'hotel'
                      ? t('Mi viaje', 'My trip')
                      : t('Qué hacer ante un sismo', 'What to do in an earthquake')}
            </h1>
            <p>
              {screen === 'activity'
                ? t(
                    'Consulta los eventos publicados y su ubicación.',
                    'See published events and their location.',
                  )
                : screen === 'help'
                  ? t(
                      'Teléfonos de emergencia, avisos oficiales y asistencia consular.',
                      'Emergency numbers, official notices and consular assistance.',
                    )
                  : screen === 'status'
                    ? t(
                        'Diles dónde estás, qué necesitas y cuándo volverás a escribir.',
                        'Tell them where you are, what you need and when you will check in again.',
                      )
                    : screen === 'hotel'
                      ? t(
                          'Contactos, punto de encuentro e instrucciones del alojamiento.',
                          'Contacts, assembly point and accommodation instructions.',
                        )
                      : t(
                          'Información general. Sigue las instrucciones de las autoridades locales.',
                          'General information. Follow local authority instructions.',
                        )}
            </p>
          </div>
        </div>
        {((screen !== 'guide' && screen !== 'status') || tracking) && (
          <div className={`fw-location ${geoState === 'idle' ? 'fw-location-idle' : ''}`}>
            <InfoIcon size={16} />
            <span>
              {geo
                ? `${t('Precisión aproximada', 'Approximate accuracy')}: ${Math.round(geo.accuracy)} m · ${t('Ubicación', 'Location')}: ${shortTime(geo.at)}`
                : geoState === 'denied'
                  ? t(
                      'Permiso de ubicación denegado. Puedes seguir usando el selector de país.',
                      'Location permission denied. You can still choose a country.',
                    )
                  : geoState === 'failed'
                    ? t(
                        'No se pudo obtener la ubicación. Elige un país o inténtalo otra vez.',
                        'Could not get your location. Choose a country or try again.',
                      )
                    : t(
                        'La ubicación es opcional. Las distancias se calculan en tu dispositivo; el GPS no se guarda automáticamente.',
                        'Location is optional. Distances are calculated on your device; GPS is not saved automatically.',
                      )}
            </span>
            {tracking && (
              <button onClick={stopLocation}>{t('Detener ubicación', 'Stop location')}</button>
            )}
          </div>
        )}
        {screen === 'activity' && (
          <>
            <div className="fw-query-controls">
              <details className="fw-query-filters">
                <summary>
                  <strong>{t('Filtros', 'Filters')}</strong>
                  <span>
                    {catalog} · {hours === 168 ? t('7 días', '7 days') : `${hours} h`} ·{' '}
                    {minMag
                      ? `${t('Magnitud', 'Magnitude')} ≥ ${minMag}`
                      : t('Todas las magnitudes', 'All magnitudes')}
                    {maxDepth < 800 ? ` · ≤ ${maxDepth} km` : ''}
                    {scope === 'nearby' ? ` · ${radius} km` : ''}
                  </span>
                </summary>{' '}
                <div className="fw-toolbar fw-catalog-toolbar">
                  <label>
                    {t('Fuente', 'Source')}
                    <select
                      value={catalog}
                      onChange={(e) => {
                        setCatalog(e.target.value as 'USGS' | 'IGC');
                        setDetail(null);
                      }}
                    >
                      {country === 'PA' && <option value="IGC">IGC · UP · Panamá</option>}
                      <option value="USGS">USGS · {t('Mundo', 'Worldwide')}</option>
                    </select>
                  </label>
                  <label>
                    {t('Período', 'Period')}
                    <select
                      value={hours}
                      onChange={(e) => {
                        setHours(+e.target.value);
                        setLimit(20);
                      }}
                    >
                      <option value={1}>{t('1 hora', '1 hour')}</option>
                      <option value={24}>{t('24 horas', '24 hours')}</option>
                      <option value={168}>{t('7 días', '7 days')}</option>
                    </select>
                  </label>
                  <label>
                    {t('Magnitud', 'Magnitude')}
                    <select value={minMag} onChange={(e) => setMinMag(+e.target.value)}>
                      <option value={0}>{t('Todas', 'All')}</option>
                      {[2.5, 4, 5, 6].map((m) => (
                        <option key={m} value={m}>
                          ≥ {m}
                        </option>
                      ))}
                    </select>
                  </label>
                  <details className="fw-filter-extra">
                    <summary>{t('Más filtros', 'More filters')}</summary>
                    <div>
                      <label>
                        {t('Zona horaria', 'Time zone')}
                        <select
                          value={timeZone}
                          onChange={(e) => setTimeZone(e.target.value as 'local' | 'utc')}
                        >
                          <option value="local">
                            {t('Local', 'Local')} ·{' '}
                            {Intl.DateTimeFormat().resolvedOptions().timeZone}
                          </option>
                          <option value="utc">UTC</option>
                        </select>
                      </label>
                      <label>
                        {t('Profundidad', 'Depth')}
                        <select value={maxDepth} onChange={(e) => setMaxDepth(+e.target.value)}>
                          <option value={800}>{t('Todas', 'All')}</option>
                          <option value={70}>≤ 70 km</option>
                          <option value={30}>≤ 30 km</option>
                        </select>
                      </label>
                      {geo && (
                        <label>
                          {t('Área', 'Area')}
                          <select
                            value={scope === 'nearby' ? radius : 0}
                            onChange={(e) => {
                              setScope(+e.target.value ? 'nearby' : 'area');
                              if (+e.target.value) setRadius(+e.target.value);
                            }}
                          >
                            <option value={0}>{t('Área seleccionada', 'Selected area')}</option>
                            {[50, 100, 300, 500].map((k) => (
                              <option key={k} value={k}>
                                {k} km · {t('cerca de mí', 'near me')}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  </details>
                </div>
                <div className="fw-filter-location">
                  <button
                    className="fw-secondary"
                    onClick={locate}
                    disabled={geoState === 'pending'}
                  >
                    <CrosshairIcon size={18} />
                    {geoState === 'pending'
                      ? t('Buscando ubicación…', 'Finding location…')
                      : t('Sismos cerca de mí', 'Earthquakes near me')}
                  </button>
                  <button className="fw-text" onClick={() => setSourceOpen(true)}>
                    {t('Fuentes y cobertura', 'Sources & coverage')}
                  </button>
                  <small>
                    {t(
                      'La ubicación es opcional y requiere tu permiso.',
                      'Location is optional and requires your permission.',
                    )}
                  </small>
                </div>
              </details>
              <button
                className="fw-secondary fw-view"
                aria-pressed={listOnly}
                onClick={() => setListOnly((v) => !v)}
              >
                {listOnly ? t('Mostrar mapa', 'Show map') : t('Solo lista', 'List only')}
              </button>
            </div>
            <p className="fw-area-scope" role="status">
              {scope === 'country' && hasCountryBoundary(country)
                ? t(
                    `${countryName}: territorio y hasta 100 km mar adentro. Límites aproximados; no indican riesgo.`,
                    `${countryName}: land and up to 100 km offshore. Approximate boundaries; not a risk zone.`,
                  )
                : scope === 'nearby'
                  ? t(
                      `Sismos a menos de ${radius} km de tu ubicación.`,
                      `Earthquakes within ${radius} km of your location.`,
                    )
                  : scope === 'area'
                    ? t(
                        'Área del mapa: incluye todos los países visibles.',
                        'Map area: includes all visible countries.',
                      )
                    : regionScope(country, lang)}
            </p>
            <MagnitudeLegend lang={lang} />
            <LiveActivity
              events={results}
              updates={live.updates.filter((u) => results.some((e) => e.id === u.event.id))}
              provider={provider}
              catalog={catalog}
              lang={lang}
              now={live.now}
              next={live.next}
              checked={live.checked}
              fetched={live.fetched}
              busy={live.busy}
              online={live.online}
              stale={stale}
              formatTime={(n) =>
                `${shortTime(n)} ${timeZone === 'utc' ? 'UTC' : new Intl.DateTimeFormat(lang, { timeZoneName: 'short' }).formatToParts(n).find((p) => p.type === 'timeZoneName')?.value || ''}`
              }
              onRefresh={() => void live.refresh()}
              onDetails={(q) => setDetail(q.id)}
              onMap={showEpicentre}
            />
            <div className={`fw-workspace ${listOnly ? 'list-only' : ''}`}>
              {!listOnly && (
                <section className="fw-map-card">
                  <div className="fw-map-head">
                    <span>
                      <MapPinIcon size={17} />
                      {scope === 'nearby'
                        ? `${radius} km · ${t('cerca de ti', 'near you')}`
                        : scope === 'area'
                          ? t('Área del mapa', 'Map area')
                          : countryName}
                    </span>
                    <small>
                      {t('Epicentros, no zonas de riesgo', 'Epicentres, not hazard zones')}
                    </small>
                  </div>
                  <WebMap
                    embassies={mappedEmbassies}
                    lang={lang}
                    events={results}
                    view={view}
                    geo={geo}
                    point={visiblePoint}
                    selected={detail || focused || undefined}
                    onSelect={(q) => setDetail(q.id)}
                    onBounds={setPending}
                  />
                  <div className="fw-map-foot">
                    <span>
                      <i />
                      {t('Marcador: magnitud', 'Pin: magnitude')}{' '}
                      <b>{t('Círculo: cantidad de sismos', 'Circle: earthquake count')}</b>
                      {visiblePoint && (
                        <b className="fw-personal-legend">
                          {t(
                            'Bandera: punto personal no verificado',
                            'Flag: unverified personal point',
                          )}
                        </b>
                      )}
                    </span>
                    {dirty && (
                      <button
                        onClick={() => {
                          setBounds(pending);
                          setScope('area');
                          setLimit(20);
                        }}
                      >
                        {t('Buscar en esta área', 'Search this area')}
                      </button>
                    )}
                  </div>
                </section>
              )}
              <section className="fw-events" aria-label={t('Lista de sismos', 'Earthquake list')}>
                <div className="fw-events-title">
                  <div>
                    <h2>
                      {results.length}{' '}
                      {results.length === 1 ? t('sismo', 'earthquake') : t('sismos', 'earthquakes')}
                    </h2>
                  </div>
                  <select
                    aria-label={t('Ordenar eventos', 'Sort events')}
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                  >
                    <option value="time">{t('Más recientes', 'Most recent')}</option>
                    <option value="magnitude">{t('Mayor magnitud', 'Largest magnitude')}</option>
                    {geo && <option value="distance">{t('Más cercanos', 'Nearest')}</option>}
                  </select>
                </div>
                <div className="fw-event-list">
                  {results.slice(0, limit).map((q) => (
                    <button
                      key={q.id}
                      className={`fw-event ${newIds.has(q.id) ? 'is-new' : ''}`}
                      onClick={() => setDetail(q.id)}
                    >
                      <strong className={`fw-mag fw-mag-band-${magnitudeBand(q.mag)}`}>
                        {q.mag?.toFixed(1) ?? '—'}
                        <small>{t('Magnitud', 'Magnitude')}</small>
                      </strong>
                      <span>
                        <b>
                          {q.place}
                          {newIds.has(q.id) && (
                            <em className="fw-event-new">
                              {t('Recibido recientemente', 'Recently received')}
                            </em>
                          )}
                        </b>
                        <small>
                          {shortTime(q.time)} {timeZone === 'utc' ? 'UTC' : ''} ·{' '}
                          {q.source || 'USGS'} · {q.depth.toFixed(0)} km {t('prof.', 'deep')}
                          {geo
                            ? ` · ${Math.round(distanceKm([geo.lat, geo.lng], [q.lat, q.lng]))} km ${t('de ti', 'away')}`
                            : ''}
                        </small>
                      </span>
                      <ArrowUpRightIcon size={18} />
                    </button>
                  ))}
                  {!results.length && (
                    <div className="fw-empty">
                      <MapPinIcon size={32} />
                      <h3>
                        {!live.online
                          ? t('Sin conexión', 'Offline')
                          : live.busy
                            ? `${t('Consultando', 'Checking')} ${provider}…`
                            : live.failed
                              ? t('No pudimos consultar la fuente', 'Could not reach the source')
                              : t('Sin registros en esta consulta', 'No records in this query')}
                      </h3>
                      <p>
                        {!live.online
                          ? t(
                              'Cuando vuelva la conexión, intentaremos actualizar los datos. La ayuda y tus datos guardados siguen disponibles en esta página.',
                              'When the connection returns, we will try to update. Help and your saved data remain available on this page.',
                            )
                          : live.failed
                            ? t(
                                'La consulta falló; esto no significa que no haya sismos. Puedes reintentar o elegir otra fuente.',
                                'The request failed; this does not mean there are no earthquakes. Retry or choose another source.',
                              )
                            : t(
                                'Amplía el período o el área. La ausencia de registros no significa ausencia de peligro.',
                                'Widen the period or area. No records does not mean no danger.',
                              )}
                      </p>
                      <button
                        className="fw-secondary"
                        onClick={() => {
                          setHours(24);
                          setMinMag(0);
                          setMaxDepth(800);
                          setScope('country');
                          setBounds(regionFor(country).bounds);
                          setLimit(20);
                        }}
                      >
                        {t('Restablecer filtros', 'Reset filters')}
                      </button>
                    </div>
                  )}
                  {results.length > limit && (
                    <button
                      className="fw-secondary fw-load"
                      onClick={() => setLimit((n) => n + 30)}
                    >
                      {t('Ver más eventos', 'Load more events')} ({results.length - limit})
                    </button>
                  )}
                </div>
                <div className="fw-feed-foot">
                  <span>
                    {live.fetched
                      ? `${t('Consultado', 'Checked')} ${new Intl.DateTimeFormat(lang, { timeStyle: 'medium' }).format(live.fetched)}`
                      : t('Conectando…', 'Connecting…')}
                    <small>
                      {!live.online
                        ? t('Sin conexión', 'Offline')
                        : live.busy
                          ? t('Actualizando…', 'Updating…')
                          : `${t('Próxima consulta en', 'Next check in')} ${Math.max(0, Math.ceil((live.next - live.now) / 1000))} s`}
                    </small>
                  </span>
                  <button
                    className="fw-icon"
                    disabled={live.busy || !live.online}
                    onClick={() => void live.refresh()}
                    aria-label={`${t('Actualizar', 'Refresh')} ${provider}`}
                  >
                    <ArrowClockwiseIcon size={21} />
                  </button>
                </div>
              </section>
            </div>
            <button
              className="fw-secondary fw-embassy-toggle"
              aria-pressed={!!availableEmbassy && showEmbassies}
              onClick={() => {
                if (!availableEmbassy) {
                  setScreen('help');
                  return;
                }
                setShowEmbassies((v) => !v);
              }}
            >
              <FlagIcon size={17} />
              {!availableEmbassy
                ? t('Consultar mi embajada', 'Find my embassy')
                : showEmbassies
                  ? t('Ocultar mi embajada', 'Hide my embassy')
                  : t('Mostrar mi embajada', 'Show my embassy')}
            </button>
            <div className="fw-disclaimer">
              <InfoIcon size={18} />
              <p>
                {t(
                  'Los registros se publican después del sismo. No son alertas tempranas. La relación entre sismos y réplicas no está disponible.',
                  'Records are published after an earthquake. They are not early warnings. Aftershock relationships are not available.',
                )}
              </p>
              <button onClick={() => setSourceOpen(true)}>
                {t('Fuentes y cobertura', 'Sources & coverage')}
              </button>
            </div>
            <CoastalPanel lang={lang} geo={geo} country={country} />
          </>
        )}
        {screen === 'help' && (
          <>
            <EmergencyNumbers country={country} lang={lang} />
            <NearbyCare
              key={country}
              country={country}
              lang={lang}
              onEmergency={() => setEmergencyOpen(true)}
            />
            <DestinationInfo country={country} lang={lang} />
            <EmbassyPanel
              onProfile={() => setSetupOpen(true)}
              savedNationality={profile?.nationality ?? null}
              lang={lang}
              country={country}
              nationality={nationality}
              onNationalityChange={(value) => {
                setNationality(value);
                setShowEmbassies(!!value);
              }}
              onMap={(e: Embassy) => {
                setNationality(e.nation);
                setShowEmbassies(true);
                center(e.lat, e.lng, 14);
                setScreen('activity');
              }}
            />
            <details className="fw-local-directory">
              <summary>
                {t('Más recursos y preparación', 'More resources and preparedness')}
              </summary>
              <p className="fw-help-region">
                {t('Recursos para la región seleccionada', 'Resources for the selected region')}:{' '}
                <strong>{countryName}</strong>.{' '}
                {t(
                  'Cambia el país en el buscador de arriba.',
                  'Change the country using the search above.',
                )}
              </p>
              <div className="fw-help-summary">
                <FlagIcon size={29} />
                <div>
                  <h2>{t('Refugios: sin datos verificados', 'Shelters: no verified data')}</h2>
                  <p>
                    {t(
                      'No hay refugios confirmados en este directorio. Consulta a las autoridades antes de desplazarte.',
                      'This directory has no confirmed shelters. Check with local authorities before travelling.',
                    )}
                  </p>
                </div>
                <button className="fw-secondary" onClick={() => setScreen('hotel')}>
                  {t('Preparar mi plan', 'Prepare my plan')}
                </button>
              </div>
              <div className="fw-resource-grid">
                {regionResources.map((r) => (
                  <article key={r.url} className="fw-resource">
                    <span className="fw-eyebrow">{r.category[idx]}</span>
                    <h2>{r.name}</h2>
                    <p>{r.description[idx]}</p>
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {t('Sitio oficial', 'Official website')}
                      <ArrowUpRightIcon size={18} />
                    </a>
                    <small>
                      {r.name === 'USGS'
                        ? t('Consulta automática cada 60 s', 'Checked automatically every 60 s')
                        : `${t('Datos revisados', 'Information reviewed')}: ${new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(r.reviewedAt + 'T12:00:00Z'))}`}
                    </small>
                  </article>
                ))}
              </div>
              <div className="fw-note">
                <UsersThreeIcon size={24} />
                <div>
                  <h3>{t('Voluntariado', 'Volunteering')}</h3>
                  <p>
                    {t(
                      'Sin convocatorias verificadas. Consulta la disponibilidad y los requisitos con la universidad o el municipio.',
                      'No verified openings. Contact the university or municipality for availability and requirements.',
                    )}
                  </p>
                </div>
              </div>
            </details>
          </>
        )}
        {screen === 'hotel' && (
          <>
            <section className="fw-trip-profile" aria-label={t('Perfil del viaje', 'Trip profile')}>
              <div>
                <h2>{t('Datos de mi viaje', 'My trip preferences')}</h2>
                <p>
                  {profile
                    ? `${t('Destino guardado', 'Saved destination')}: ${names.of(profile.destination)} · ${t('Nacionalidad', 'Nationality')}: ${profile.nationality ? names.of(profile.nationality) : t('Sin indicar', 'Not specified')}`
                    : t(
                        'Guarda tu destino, idioma y nacionalidad para la próxima visita.',
                        'Save your destination, language and nationality for your next visit.',
                      )}
                </p>
              </div>
              <button className="fw-secondary" onClick={() => setSetupOpen(true)}>
                {profile
                  ? t('Editar datos', 'Edit preferences')
                  : t('Configurar mi viaje', 'Set up my trip')}
              </button>
            </section>
            <LocalDataInfo lang={lang} />
            <TravelContacts
              key={country}
              country={country}
              lang={lang}
              plan={plan}
              profile={profile}
            />
            <div className="fw-hotel-layout">
              <form className="fw-form" onSubmit={savePlan}>
                <span className="fw-eyebrow">
                  {t('GUARDADO SOLO EN ESTE DISPOSITIVO', 'SAVED ONLY ON THIS DEVICE')}
                </span>
                <h2>{t('Punto de encuentro', 'Assembly point')}</h2>
                <p>
                  {t(
                    'Completa los datos con recepción. El punto guardado es personal y no está verificado.',
                    'Confirm these details with reception. The saved point is personal and unverified.',
                  )}
                </p>
                <label>
                  {t('Nombre del hotel', 'Hotel name')}
                  <input
                    required
                    maxLength={120}
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </label>
                <label>
                  {t(
                    'Punto de encuentro indicado por recepción',
                    'Assembly point provided by reception',
                  )}
                  <input
                    required
                    maxLength={300}
                    value={draft.meeting}
                    onChange={(e) => setDraft({ ...draft, meeting: e.target.value })}
                  />
                </label>
                <details className="fw-coordinate-fields">
                  <summary>
                    {t('Añadir coordenadas al mapa · opcional', 'Add map coordinates · optional')}
                  </summary>
                  <div className="fw-form-row">
                    <label>
                      {t('Latitud (opcional)', 'Latitude (optional)')}
                      <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        value={draft.lat}
                        onChange={(e) => setDraft({ ...draft, lat: e.target.value })}
                      />
                    </label>
                    <label>
                      {t('Longitud (opcional)', 'Longitude (optional)')}
                      <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        value={draft.lng}
                        onChange={(e) => setDraft({ ...draft, lng: e.target.value })}
                      />
                    </label>
                  </div>
                  <small>
                    {t(
                      'Coordenadas del punto acordado, no de la habitación. Si no las conoces, guarda solo la descripción.',
                      'Coordinates of the agreed assembly point, not your room. If unknown, save just the description.',
                    )}
                  </small>
                  {geo && (
                    <button
                      type="button"
                      className="fw-text"
                      onClick={() =>
                        setDraft({ ...draft, lat: geo.lat.toFixed(6), lng: geo.lng.toFixed(6) })
                      }
                    >
                      {t(
                        'Estoy en el punto acordado: usar mi ubicación',
                        'I am at the agreed point: use my location',
                      )}
                    </button>
                  )}
                </details>
                <label>
                  {t('Ruta e instrucciones del hotel', 'Hotel route and instructions')}
                  <textarea
                    maxLength={1500}
                    rows={3}
                    value={draft.notes}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  />
                </label>
                <button className="fw-primary" type="submit">
                  <CheckCircleIcon size={19} />
                  {t('Guardar mi plan', 'Save my plan')}
                </button>
                {message && (
                  <p role="status" className="fw-form-status">
                    {message === 'saved'
                      ? t('Plan guardado en este dispositivo.', 'Plan saved on this device.')
                      : message === 'invalid'
                        ? t(
                            'Completa ambas coordenadas dentro de sus rangos.',
                            'Complete both coordinates within their valid ranges.',
                          )
                        : t(
                            'El navegador no permitió guardar. No se almacenó el plan.',
                            'Browser storage is unavailable. The plan was not saved.',
                          )}
                  </p>
                )}
              </form>
              <aside className="fw-hotel-aside">
                <EvacuationPlan country={country} lang={lang} />
                {plan && (
                  <article className="fw-plan-card">
                    <FlagIcon size={29} />
                    <span className="fw-eyebrow">
                      {t('PUNTO PERSONAL · NO VERIFICADO', 'PERSONAL POINT · NOT VERIFIED')}
                    </span>
                    <h2>{plan.name}</h2>
                    <h3>{plan.meeting}</h3>
                    <p>{plan.notes}</p>
                    <small>
                      {t('Guardado', 'Saved')}: {stamp(plan.savedAt)}
                    </small>
                    {point && (
                      <button
                        className="fw-secondary"
                        onClick={() => {
                          changeCountry(plan.country);
                          center(point[0], point[1], 15);
                          setScreen('activity');
                        }}
                      >
                        {t('Ver mi punto en el mapa', 'See my point on the map')}
                      </button>
                    )}
                    <button className="fw-secondary" onClick={exportPlan}>
                      <DownloadSimpleIcon size={18} />
                      {t('Descargar plan', 'Download plan')}
                    </button>
                    <button
                      className="fw-text"
                      onClick={() => {
                        try {
                          removeLocal('faro-hotel-v1');
                          setPlan(null);
                          setDraft(emptyPlan);
                          setMessage(null);
                        } catch {
                          setMessage('storage');
                        }
                      }}
                    >
                      {t('Borrar mi plan de este dispositivo', 'Delete my plan from this device')}
                    </button>
                  </article>
                )}
                <div className="fw-checklist">
                  <h3>{t('Confirmar con recepción', 'Confirm with reception')}</h3>
                  <ol>
                    <li>
                      {t(
                        '¿Dónde está la salida y el punto de encuentro?',
                        'Where are the exit and assembly point?',
                      )}
                    </li>
                    <li>
                      {t(
                        '¿Cuál es el plan si hay un aviso de tsunami?',
                        'What is the plan for a tsunami warning?',
                      )}
                    </li>
                    <li>
                      {t(
                        '¿Cómo recibiremos instrucciones si no hay internet?',
                        'How will we receive instructions without internet?',
                      )}
                    </li>
                  </ol>
                </div>
              </aside>
            </div>
          </>
        )}
        {screen === 'guide' && (
          <SafetyGuide
            lang={lang}
            country={country}
            onHotel={() => setScreen('hotel')}
            onStatus={() => setScreen('status')}
          />
        )}
        <div hidden={screen !== 'status'}>
          <TravelerStatus
            profile={profile}
            plan={plan}
            events={results.slice(0, 10)}
            location={geo}
            lang={lang}
            history={checkIns}
            onHistory={setCheckIns}
            now={live.now}
            onHelp={() => setEmergencyOpen(true)}
          />
        </div>
        <footer className="fw-footer">
          <span>
            Faro · {t('Creado por', 'Created by')}{' '}
            <a href="https://oktsec.com" target="_blank" rel="noopener">
              Oktsec
            </a>{' '}
            · <a href="/about.html">{t('Acerca de Faro', 'About Faro')}</a>
          </span>
          <span>
            {screen === 'status'
              ? t('Mensajes personales · Envío manual', 'Personal messages · Sent manually')
              : screen === 'guide'
                ? t('Recomendaciones: SENAPRED, CDC y NOAA', 'Guidance: SENAPRED, CDC and NOAA')
                : t(
                    'Eventos: IGC-UP / USGS · Tsunami: NOAA · Mapa: OpenStreetMap',
                    'Events: IGC-UP / USGS · Tsunami: NOAA · Map: OpenStreetMap',
                  )}
          </span>
        </footer>
      </main>

      {setupOpen && (
        <TravelSetup
          saved={profile}
          language={lang}
          destination={country}
          nationality={nationality}
          onSave={saveProfile}
          onClose={closeSetup}
          onDelete={deleteProfile}
          onHelp={(code) => {
            if (countryCodes.includes(code)) changeCountry(code);
            closeSetup();
            setEmergencyOpen(true);
          }}
        />
      )}
      {emergencyOpen && (
        <EmergencyDialog
          country={country}
          lang={lang}
          onCountry={changeCountry}
          onClose={() => setEmergencyOpen(false)}
          onGuide={() => {
            setEmergencyOpen(false);
            setScreen('guide');
          }}
          onStatus={() => {
            setEmergencyOpen(false);
            setScreen('status');
          }}
        />
      )}
      <InformationDialog
        open={!!detail || sourceOpen}
        sourceOpen={sourceOpen}
        selected={selected}
        geo={geo}
        lang={lang}
        provider={provider}
        fetched={live.fetched}
        generated={live.generated}
        onClose={() => {
          setDetail(null);
          setSourceOpen(false);
        }}
        onMap={showEpicentre}
      />
    </div>
  );
}
