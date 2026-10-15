import InstallFaro from './components/InstallFaro.tsx';
import NearbyCare from './components/NearbyCare.tsx';
import EvacuationPlan from './components/EvacuationPlan.tsx';
import MagnitudeLegend from './components/MagnitudeLegend.tsx';
import { magnitudeBand } from './lib/magnitude.ts';
import CountrySearch from './components/CountrySearch.tsx';
import DestinationInfo from './components/DestinationInfo.tsx';
import { WORLD, countryCodes, regionFor, regionScope } from './lib/regions.ts';
import EmergencyScreen from './components/EmergencyScreen.tsx';
import TsunamiBanner from './components/TsunamiBanner.tsx';
import { officialRowId } from './components/OfficialNow.tsx';
import Pagination from './components/Pagination.tsx';
import SourcesScreen, { type SourceRow } from './components/SourcesScreen.tsx';
import { sourceState } from './lib/sourceStatus.ts';
import { sourceSites } from './data/sourceSites.ts';
import { paging } from './lib/paging.ts';
import { SINAPROC_HOME, floodPosts, parseCivil, postTitle, reviveCivil } from './lib/civil.ts';
import LocalDataInfo from './components/LocalDataInfo.tsx';
import { writeLocal, removeLocal, pruneOfficialCopies } from './lib/browserStorage.ts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InformationDialog from './components/InformationDialog.tsx';
import {
  ArrowUpRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MapPinIcon,
  CrosshairIcon,
  BuildingsIcon,
  BookOpenTextIcon,
  UsersThreeIcon,
  XIcon,
  FlagIcon,
  BookmarkSimpleIcon,
  BackpackIcon,
  InfoIcon,
  ChatCircleTextIcon,
  UserCircleIcon,
  PhoneIcon,
  WifiSlashIcon,
  PulseIcon,
} from '@phosphor-icons/react';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-serif-display/latin-400.css';
import countries from './data/countries.json';
import {
  displayPlace,
  distanceKm,
  filterEvents,
  type CatalogId,
  type Quake,
  type Bounds,
} from './lib/domain.ts';
import { useLiveFeed } from './hooks/useLiveFeed.ts';
import LiveActivity from './components/LiveActivity.tsx';
import TripProfile from './components/TripProfile.tsx';
import OfflineMap from './components/OfflineMap.tsx';
import { boundsView } from './lib/offlineMap.ts';
import EmergencyKit from './components/EmergencyKit.tsx';
import { forgetEmergencyInfo } from './lib/emergencyProfile.ts';
import {
  readPreferences,
  readSiteLanguage,
  storePreferences,
  forgetPreferences,
  type Preferences,
} from './lib/preferences.ts';
import WebMap, {
  type Geo,
  type MapArea,
  type MapHazard,
  type MapView,
} from './components/WebMap.tsx';
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
import './styles/situation.css';
import './styles/help.css';
import './styles/home.css';
import './styles/layout.css';
import { useIGC } from './hooks/useIGC.ts';
import { useEMSC } from './hooks/useEMSC.ts';
import { usePolled } from './hooks/usePolled.ts';
import {
  ACTIVE_WINDOW,
  alertLevelLabels,
  readableSeverity,
  alertsFor,
  alertSubject,
  alertTypeLabels,
  parseAlerts,
} from './lib/alerts.ts';
import { atLabel } from './lib/time.ts';
import { confirmFresh, earthquakeSummary, gdacsStatus, tsunamiStatus } from './lib/hazards.ts';
import SituationBriefing from './components/SituationBriefing.tsx';
import { destinationFor } from './data/destinations/index.ts';
import { classifyBulletins, parseTsunamiData, reviveTsunami } from './lib/tsunami.ts';
import { receivedAt } from './lib/http.ts';
import { scrollMotion } from './lib/motion.ts';
import { NHC_REGION, graphicsUrl, parseStorms, stormClassLabels, windKmh } from './lib/storms.ts';
import StormsPanel from './components/StormsPanel.tsx';
import NwsPanel from './components/NwsPanel.tsx';
import {
  NATIONAL_COUNTRIES,
  activeWarnings,
  floodWarnings,
  parseNational,
  readableEvent,
  reviveNational,
} from './lib/national.ts';
import { NWS_COUNTRIES, nwsUrl, parseNws } from './lib/nws.ts';
import AlertsPanel from './components/AlertsPanel.tsx';
import FamilyLinks from './components/FamilyLinks.tsx';
import CoastalPanel from './components/CoastalPanel.tsx';
import EmbassyPanel from './components/EmbassyPanel.tsx';
import SafetyGuide from './components/SafetyGuide.tsx';
import { ExternalLink } from './components/Ui.tsx';
import TravelerStatus from './components/TravelerStatus.tsx';
import TravelContacts from './components/TravelContacts.tsx';
import EmergencyNumbers from './components/EmergencyNumbers.tsx';
import ResponsePanel from './components/ResponsePanel.tsx';
import HomeActions from './components/HomeActions.tsx';
import HomeTabs from './components/HomeTabs.tsx';
import SetupCard from './components/SetupCard.tsx';
import { responsesFor } from './data/responses.ts';
import { readCheckIns, checkInDue } from './lib/traveler.ts';
import { type Embassy } from './lib/embassies.ts';
import { mappedMissions } from './data/consularMissions.ts';
import { langIndex, langTag, pick } from './lib/i18n.ts';
import type { EmergencyKind } from './data/firstMinutes.ts';
// Panama opens on EMSC while IGC is not publishing: its table had no record after 10 October 2026
// and its site was in maintenance on 14 October. IGC stays one tap away. Set back to 'IGC' once
// its table updates again (docs/release-readiness.md).
const PANAMA_CATALOG: CatalogId = 'EMSC';
// USGS is the national authority for the United States and its territories. Elsewhere it lists
// few small earthquakes, so a quiet USGS list read as "none in 24 h" during the Costa Rica and
// Guatemala activity that EMSC did list: EMSC opens there.
const US_AREAS = new Set(['US', 'PR', 'VI', 'GU', 'AS', 'MP']);
const defaultCatalog = (country: string): CatalogId =>
  country === 'PA' ? PANAMA_CATALOG : US_AREAS.has(country) ? 'USGS' : 'EMSC';
// GDACS changes slowly; every five minutes keeps requests low.
async function readAlerts(signal: AbortSignal) {
  const response = await fetch('/api/alerts', { signal, cache: 'no-cache' });
  if (!response.ok) throw Error('GDACS unavailable');
  return parseAlerts(await response.json(), receivedAt(response));
}
// NOAA/PTWC bulletins through the same-origin adapter, every minute while visible.
async function readTsunami(signal: AbortSignal) {
  const response = await fetch('/api/tsunami', { signal, cache: 'no-cache' });
  if (!response.ok) throw Error('NOAA unavailable');
  return parseTsunamiData(await response.json(), receivedAt(response));
}
// Active NHC/CPHC cyclones through the same-origin adapter, every five minutes while visible.
async function readStorms(signal: AbortSignal) {
  const response = await fetch('/api/storms', { signal, cache: 'no-cache' });
  if (!response.ok) throw Error('NHC unavailable');
  return parseStorms(await response.json(), receivedAt(response));
}
function setupCardDismissed() {
  try {
    return localStorage.getItem('faro-setup-card-v1') === 'dismissed';
  } catch {
    return false;
  }
}
const SCREENS = [
  'activity',
  'detail',
  'emergency',
  'sources',
  'help',
  'hotel',
  'kit',
  'guide',
  'status',
] as const;
type Screen = (typeof SCREENS)[number];
const isScreen = (value: unknown): value is Screen => SCREENS.includes(value as Screen);
const providerNames: Record<CatalogId, string> = {
  IGC: 'IGC · UP',
  EMSC: 'EMSC',
  USGS: 'USGS',
};
function readPlan() {
  try {
    const p = JSON.parse(localStorage.getItem('faro-hotel-v1') || 'null');
    return validPlan(p) ? p : null;
  } catch {
    return null;
  }
}
// National warnings and SINAPROC: a 10-minute adapter cache plus a 10-minute poll. Older than
// this, the copy is not current.
const OFFICIAL_MAX_AGE = 25 * 60000;

export default function App() {
  const [profile, setProfile] = useState(() => readPreferences(countryCodes));
  // Setup never blocks the app: the home shows a card instead of opening a dialog.
  const [setupDismissed, setSetupDismissed] = useState(setupCardDismissed),
    [profileFeedback, setProfileFeedback] = useState<'saved' | 'deleted' | 'storage' | null>(null);
  useEffect(() => {
    if (!profileFeedback || profileFeedback === 'storage') return;
    const timer = setTimeout(() => setProfileFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [profileFeedback]);
  const initialRegion = useMemo(() => regionFor(profile?.destination ?? 'PA'), []);
  const [checkIns, setCheckIns] = useState(readCheckIns);
  const [lang, setLang] = useState<Lang>(() => readSiteLanguage(profile?.language));
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    idx = langIndex(lang);
  const [catalog, setCatalog] = useState<CatalogId>(defaultCatalog(profile?.destination ?? 'PA')),
    [timeZone, setTimeZone] = useState<'local' | 'utc'>('local'),
    [showEmbassies, setShowEmbassies] = useState(false),
    [nationality, setNationality] = useState(profile?.nationality ?? '');
  // Set once the person picks a catalog; until then each place opens on its default.
  const catalogChosen = useRef(false);
  // Only the selected catalog polls; the other keeps its last snapshot.
  const usgs = useLiveFeed(catalog === 'USGS'),
    igc = useIGC(catalog === 'IGC'),
    emsc = useEMSC(catalog === 'EMSC');
  const alerts = usePolled(readAlerts, 300000),
    // Kept on the device: after an offline reload an open threat stays on screen, as old data.
    tsunami = usePolled(readTsunami, 60000, true, { key: 'faro-tsunami', revive: reviveTsunami }),
    storms = usePolled(readStorms, 300000);
  const live = catalog === 'IGC' ? igc : catalog === 'EMSC' ? emsc : usgs,
    provider = providerNames[catalog];
  const appRef = useRef<HTMLDivElement>(null);
  // Losing or regaining the connection is announced once through a region that is always on the
  // page; the banner itself appears already filled in, which screen readers often skip.
  const [connection, setConnection] = useState<'' | 'lost' | 'back'>('');
  const wasOnline = useRef(true);
  useEffect(() => {
    if (live.online === wasOnline.current) return;
    wasOnline.current = live.online;
    setConnection(live.online ? 'back' : 'lost');
  }, [live.online]);
  const [focused, setFocused] = useState<string | null>(null);
  // Set when the offline copy confirms this version (src/sw.ts), never assumed.
  const [offlineReady, setOfflineReady] = useState(false);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const ready = (e: MessageEvent) => {
      if ((e.data as { type?: unknown } | null)?.type === 'faro-offline-ready')
        setOfflineReady(true);
    };
    navigator.serviceWorker.addEventListener('message', ready);
    return () => navigator.serviceWorker.removeEventListener('message', ready);
  }, []);
  // The emergency screen's hazard choice and where it opens; the guide topic it leads to.
  const [emergencyKind, setEmergencyKind] = useState<EmergencyKind>('earthquake'),
    [emergencyStart, setEmergencyStart] = useState<'call' | 'steps'>('call'),
    [guideTopic, setGuideTopic] = useState('during');
  const openEmergency = (start: 'call' | 'steps') => {
    setEmergencyStart(start);
    setScreen('emergency');
  };
  const [screen, setScreen] = useState<Screen>('activity'),
    [country, setCountry] = useState(profile?.destination ?? 'PA'),
    [hours, setHours] = useState(24),
    [minMag, setMinMag] = useState(0),
    [maxDepth, setMaxDepth] = useState(800),
    [order, setOrder] = useState('time'),
    [radius, setRadius] = useState(300),
    [scope, setScope] = useState<'country' | 'area' | 'nearby'>('country'),
    [page, setPage] = useState(1),
    [homeTab, setHomeTab] = useState('quakes');
  const inNws = NWS_COUNTRIES.includes(country);
  // Requested from the browser only while a U.S. state or territory is selected.
  const readNws = useCallback(
    async (signal: AbortSignal) => {
      const response = await fetch(nwsUrl(country), { signal, cache: 'no-cache' });
      if (!response.ok) throw Error('NWS unavailable');
      return parseNws(await response.json());
    },
    [country],
  );
  const nws = usePolled(readNws, 60000, inNws);
  const inNational = NATIONAL_COUNTRIES.includes(country);
  const readNational = useCallback(
    async (signal: AbortSignal) => {
      const response = await fetch(`/api/national?country=${encodeURIComponent(country)}`, {
        signal,
        cache: 'no-cache',
      });
      if (!response.ok) throw Error('National warnings unavailable');
      return parseNational(await response.json(), country, receivedAt(response));
    },
    [country],
  );
  // Agencies update warnings a few times a day; ten minutes keeps requests low.
  // Warnings in force are kept on the device so they stay visible offline until they expire.
  const national = usePolled(readNational, 600000, inNational, {
    key: `faro-national-${country}`,
    revive: (value) => reviveNational(value, country),
  });
  // SINAPROC posts (Panama only): communiqués, prevention notices and incident reports.
  const inCivil = country === 'PA';
  const readCivil = useCallback(async (signal: AbortSignal) => {
    const response = await fetch('/api/sinaproc', { signal, cache: 'no-cache' });
    if (!response.ok) throw Error('SINAPROC unavailable');
    return parseCivil(await response.json(), receivedAt(response));
  }, []);
  const civil = usePolled(readCivil, 600000, inCivil, {
    key: 'faro-sinaproc',
    revive: (value) => reviveCivil(value),
  });
  const [bounds, setBounds] = useState<Bounds>(initialRegion.bounds),
    [pending, setPending] = useState<Bounds>(initialRegion.bounds),
    [view, setView] = useState<MapView>(initialRegion.view),
    [detail, setDetail] = useState<string | null>(null),
    [geo, setGeo] = useState<Geo | null>(null),
    [tracking, setTracking] = useState(false),
    [geoState, setGeoState] = useState<'idle' | 'pending' | 'active' | 'denied' | 'failed'>('idle');
  const watch = useRef<number | null>(null),
    firstFix = useRef(true);
  const [plan, setPlan] = useState<HotelPlan | null>(readPlan);
  const [savedCountries, setSavedCountries] = useState<string[]>(() => {
    try {
      const a = JSON.parse(localStorage.getItem('faro-zones-v1') || '[]');
      return Array.isArray(a) ? a.filter((v) => typeof v === 'string') : [];
    } catch {
      return [];
    }
  });
  // A new screen starts at the top. After the first render, focus moves to its heading so
  // keyboard and screen-reader users know the screen changed (Emergency focuses its call button
  // and the detail page its tab instead).
  // Each screen is a browser history entry, so the phone's Back button returns to the previous
  // screen instead of leaving Faro (people often arrive from a link in a chat).
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const fromHistory = useRef(false);
  useEffect(() => {
    history.replaceState({ ...(history.state ?? {}), faroScreen: screenRef.current }, '');
    const back = (e: PopStateEvent) => {
      const target = (e.state as { faroScreen?: unknown } | null)?.faroScreen;
      const next = isScreen(target) ? target : 'activity';
      if (next === screenRef.current) return;
      fromHistory.current = true;
      // An open earthquake sheet belongs to the screen being left.
      setDetail(null);
      setScreen(next);
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, []);
  useEffect(() => {
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if ((history.state as { faroScreen?: unknown } | null)?.faroScreen === screen) return;
    history.pushState({ faroScreen: screen }, '');
  }, [screen]);
  const firstScreen = useRef(true);
  useEffect(() => {
    appRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (firstScreen.current) {
      firstScreen.current = false;
      return;
    }
    if (screen === 'emergency' || screen === 'detail') return;
    requestAnimationFrame(() =>
      appRef.current?.querySelector<HTMLElement>('.fw-main h1')?.focus({ preventScroll: true }),
    );
  }, [screen]);
  const names = useMemo(() => new Intl.DisplayNames([lang], { type: 'region' }), [lang]);
  const countryName =
    country === 'WORLD'
      ? t('Todo el mundo', 'Worldwide', 'Mundo inteiro')
      : names.of(country) || country;
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
    document.documentElement.lang = langTag(lang);
  }, [lang]);
  // Official copies kept for offline use last a week at most.
  useEffect(() => {
    try {
      pruneOfficialCopies();
    } catch {
      // Storage blocked: nothing was kept either.
    }
  }, []);
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
  // One reading of the location to choose the country. Worked out on this device from the land
  // borders; the coordinates are neither kept nor sent anywhere.
  const [placeState, setPlaceState] = useState<
    | { kind: 'pending' }
    | { kind: 'found'; code: string }
    | { kind: 'failed' | 'denied' | 'unknown' }
    | null
  >(null);
  const countryFromLocation = () => {
    if (!navigator.geolocation) {
      setPlaceState({ kind: 'failed' });
      return;
    }
    setPlaceState({ kind: 'pending' });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lookup = borders ?? (await import('./lib/countryScope.ts'));
          const code = lookup.countryOnLand({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          if (code) {
            changeCountry(code);
            setPlaceState({ kind: 'found', code });
          } else setPlaceState({ kind: 'unknown' });
        } catch {
          setPlaceState({ kind: 'failed' });
        }
      },
      (error) => setPlaceState({ kind: error.code === 1 ? 'denied' : 'failed' }),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  };
  // The result line clears itself after a few seconds.
  useEffect(() => {
    if (!placeState || placeState.kind === 'pending') return;
    const timer = setTimeout(() => setPlaceState(null), 8000);
    return () => clearTimeout(timer);
  }, [placeState]);
  const changeCountry = (code: string) => {
    const region = regionFor(code);
    setCountry(code);
    // A catalog the person chose stays (EMSC and USGS are worldwide); otherwise the new place's
    // default. IGC only covers Panama.
    setCatalog((c) =>
      catalogChosen.current && !(c === 'IGC' && code !== 'PA') ? c : defaultCatalog(code),
    );
    // Browsing another country must not discard a separately enabled location fix.
    firstFix.current = false;
    setScope('country');
    setPage(1);
    setFocused(null);
    setDetail(null);
    setBounds(region.bounds);
    setPending(region.bounds);
    center(region.view.lat, region.view.lng, region.view.zoom);
  };
  const saveProfile = (value: Preferences) => {
    let saved: Preferences;
    try {
      saved = storePreferences(value, countryCodes);
    } catch {
      // Blocked or full storage: say so instead of failing silently.
      setProfileFeedback('storage');
      return;
    }
    setProfile(saved);
    setLang(saved.language);
    setNationality(saved.nationality);
    setShowEmbassies(!!saved.nationality);
    changeCountry(saved.destination);
    setProfileFeedback('saved');
  };
  // The language is stored only when the person chooses it.
  const changeLanguage = (value: Lang) => {
    setLang(value);
    try {
      writeLocal('faro-lang', value);
    } catch {
      setProfileFeedback('storage');
    }
  };
  const showSetupCard = !profile?.nationality && !setupDismissed && country !== 'WORLD';
  const saveNationality = (value: string) =>
    saveProfile({
      version: 1,
      language: lang,
      destination: countryCodes.includes(country) ? country : (profile?.destination ?? 'PA'),
      nationality: value,
      savedAt: Date.now(),
      ...(profile?.name ? { name: profile.name } : {}),
      ...(profile?.phone ? { phone: profile.phone } : {}),
      ...(profile?.email ? { email: profile.email } : {}),
    });
  // A nationality chosen on the emergency or local help screen is kept like the one from the home
  // card, without moving the country being viewed or changing the rest of the profile.
  const rememberNationality = (code: string) => {
    setNationality(code);
    setShowEmbassies(!!code);
    if (!code) return;
    try {
      setProfile(
        storePreferences(
          {
            version: 1,
            language: lang,
            destination: countryCodes.includes(country) ? country : 'PA',
            ...profile,
            nationality: code,
            savedAt: Date.now(),
          },
          countryCodes,
        ),
      );
    } catch {
      setProfileFeedback('storage');
    }
  };
  const dismissSetupCard = () => {
    setSetupDismissed(true);
    try {
      writeLocal('faro-setup-card-v1', 'dismissed');
    } catch {
      setProfileFeedback('storage');
    }
  };
  // Opens the detail page (earthquakes, tsunami, cyclones, alerts) on one of its tabs.
  const openTab = (id: string) => {
    setHomeTab(id);
    setScreen('detail');
    // After the screen change has reset the scroll, focus the tab for keyboards and readers.
    setTimeout(
      () =>
        appRef.current?.querySelector<HTMLElement>(`#fw-tab-${id}`)?.focus({ preventScroll: true }),
      150,
    );
  };
  // Saves the trip form: profile and meeting plan together, without leaving the screen.
  const saveTrip = (value: Preferences, nextPlan: HotelPlan | null) => {
    try {
      const saved = storePreferences(value, countryCodes);
      if (nextPlan) writeLocal('faro-hotel-v1', JSON.stringify(nextPlan));
      else removeLocal('faro-hotel-v1');
      setProfile(saved);
      setNationality(saved.nationality);
      setShowEmbassies(!!saved.nationality);
      setPlan(nextPlan);
      if (saved.destination !== country) changeCountry(saved.destination);
      // Asks the browser to keep the trip and the offline copy instead of clearing them when
      // space runs low or the site goes unused. The browser decides; nothing depends on it.
      void navigator.storage?.persist?.().catch(() => false);
      return true;
    } catch {
      return false;
    }
  };
  const deleteTrip = () => {
    // Each part is removed on its own so one blocked key never leaves the rest behind.
    const failed = [
      forgetPreferences,
      forgetEmergencyInfo,
      () => removeLocal('faro-hotel-v1'),
    ].filter((remove) => {
      try {
        remove();
        return false;
      } catch {
        return true;
      }
    });
    if (failed.length) setProfileFeedback('storage');
    setProfile(null);
    setPlan(null);
    setNationality('');
    setShowEmbassies(false);
  };

  const temporal = useMemo(
    () => filterEvents(live.events, WORLD, hours, minMag, maxDepth, live.now),
    [live.events, hours, minMag, maxDepth, Math.floor(live.now / 10000)],
  );
  // Country borders (1.4 MB) load after the app starts, so calling and first steps never wait
  // for them. Until then the country's region rectangle is used, as for countries without borders.
  const [borders, setBorders] = useState<typeof import('./lib/countryScope.ts') | null>(null);
  useEffect(() => {
    import('./lib/countryScope.ts').then(setBorders, () => {});
  }, []);
  const hasBorders = (code: string) => !!borders?.hasCountryBoundary(code);
  const results = useMemo(() => {
    const arr =
      scope === 'nearby' && geo
        ? temporal.filter((e) => distanceKm([geo.lat, geo.lng], [e.lat, e.lng]) <= radius)
        : scope === 'country' && borders && (country === 'WORLD' || hasBorders(country))
          ? temporal.filter((e) => borders.inCountryScope(e, country))
          : filterEvents(temporal, bounds, hours, minMag, maxDepth, live.now);
    if (order === 'magnitude') arr.sort((a, b) => (b.mag ?? -Infinity) - (a.mag ?? -Infinity));
    if (order === 'distance' && geo)
      arr.sort(
        (a, b) =>
          distanceKm([geo.lat, geo.lng], [a.lat, a.lng]) -
          distanceKm([geo.lat, geo.lng], [b.lat, b.lng]),
      );
    return arr;
  }, [temporal, bounds, scope, country, geo, radius, order, borders]);
  // Earthquake list pages; the page stays in range when new data shortens the list.
  const listPage = paging(results.length, page);
  const newIds = new Set(
    live.updates.filter((u) => live.now - u.receivedAt < 600000).map((u) => u.event.id),
  );
  // The map lives on the home: go there, centre on the epicentre and bring the map into view.
  const showEpicentre = (q: Quake) => {
    setDetail(null);
    setFocused(q.id);
    center(q.lat, q.lng, 9);
    setScreen('activity');
    setTimeout(
      () =>
        appRef.current
          ?.querySelector('.fw-map-card')
          ?.scrollIntoView({ block: 'center', behavior: scrollMotion() }),
      150,
    );
  };
  // Opens a screen; optionally brings one of its sections into view.
  const go = (target: Screen, section?: string) => {
    setScreen(target);
    if (section)
      setTimeout(
        () =>
          appRef.current
            ?.querySelector(section)
            ?.scrollIntoView({ block: 'start', behavior: scrollMotion() }),
        80,
      );
  };
  const periodLabel =
    hours === 168
      ? t('7 días', '7 days', '7 dias')
      : hours === 1
        ? t('1 hora', '1 hour', '1 hora')
        : '24 h';
  const quakeSummary = earthquakeSummary(results);
  const countryAlerts = alerts.data
    ? alertsFor(alerts.data.events, country, regionFor(country).bounds, live.now)
    : null;
  // A "none" older than a few polling cycles, or while offline, is shown as not confirmed.
  // The most recent NOAA threat (or unreadable) message that no later message closed.
  const tsunamiAlert = tsunami.data
    ? classifyBulletins(tsunami.data, live.now, tsunami.failed).find((r) => r.needsReview)?.bulletin
    : undefined;
  // Polled every minute: older than a few cycles, offline or failing, the banner says so.
  const tsunamiLastData =
    tsunami.data && (!live.online || tsunami.failed || live.now - tsunami.data.fetched > 3 * 60000)
      ? tsunami.data.fetched
      : undefined;
  const hazardStates = [
    confirmFresh(
      tsunamiStatus(tsunami.data, tsunami.failed, live.now),
      tsunami.data?.fetched,
      live.now,
      live.online,
      3 * 60000,
    ),
    ...(['cyclone', 'flood', 'volcano'] as const).map((key) =>
      confirmFresh(
        // A partial GDACS answer cannot confirm "no alerts".
        gdacsStatus(key, countryAlerts, alerts.failed || !!alerts.data?.partial, live.now),
        alerts.data?.fetched,
        live.now,
        live.online,
        20 * 60000,
      ),
    ),
  ];
  // Active GDACS points (updated in 72 h) for cyclones, floods and volcanoes in the place.
  const kinds = { TC: 'cyclone', FL: 'flood', VO: 'volcano' } as const;
  const mapHazards: MapHazard[] = (countryAlerts ?? []).flatMap((a) =>
    a.lat !== null &&
    a.lng !== null &&
    live.now - a.to <= ACTIVE_WINDOW &&
    (a.type === 'TC' || a.type === 'FL' || a.type === 'VO')
      ? [
          {
            id: a.id,
            lat: a.lat,
            lng: a.lng,
            kind: kinds[a.type],
            level: a.level,
            title: `${alertTypeLabels[a.type][idx]} · ${alertSubject(a, (c) => names.of(c), lang)}`,
            detail: [alertLevelLabels[a.level][idx], readableSeverity(a.severity, lang)]
              .filter(Boolean)
              .join(' · '),
            source: 'GDACS',
            url: a.url,
          },
        ]
      : [],
  );
  // NHC storms are shown as context in its forecast basins; Faro does not judge local impact.
  const inNhcRegion = NHC_REGION.includes(country);
  const activeStorms = inNhcRegion ? (storms.data?.storms ?? []) : [];
  mapHazards.push(
    ...activeStorms.map((st): MapHazard => ({
      id: `nhc-${st.id}`,
      lat: st.lat,
      lng: st.lng,
      kind: 'cyclone',
      level: 'info',
      title: `${stormClassLabels[st.classification][idx]} ${st.name}`,
      detail:
        st.intensityKt !== null
          ? `${t('Viento máx.', 'Max. wind', 'Vento máx.')} ${windKmh(st.intensityKt)} km/h`
          : '',
      source: 'NHC',
      url: graphicsUrl(st),
    })),
  );
  // National warnings in force, used by the home rows and the warning areas on the map.
  const nationalActive =
    inNational && national.data?.country === country
      ? activeWarnings(national.data.warnings, live.now)
      : [];
  const firstFloodWarning = floodWarnings(nationalActive)[0];
  const floodAdvice = firstFloodWarning
    ? { agency: national.data!.agency, rowId: officialRowId('w', firstFloodWarning.id) }
    : undefined;
  // Without a flood warning in force, a SINAPROC post from the last 48 hours that mentions
  // rain or flooding is pointed out, with its title and publication time.
  const latestFloodPost =
    !floodAdvice && inCivil && civil.data ? floodPosts(civil.data.posts, live.now)[0] : undefined;
  const floodNotice = latestFloodPost
    ? {
        agency: 'SINAPROC',
        title: postTitle(latestFloodPost.title),
        published: latestFloodPost.published,
        rowId: officialRowId('p', latestFloodPost.id),
      }
    : undefined;
  const until = (n: number) =>
    new Intl.DateTimeFormat(lang, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(n);
  const warningAreas: MapArea[] = nationalActive
    .filter((w) => w.polygons.length > 0)
    .map((w) => ({
      id: w.id,
      polygons: w.polygons,
      title: readableEvent(w.event),
      detail: t(
        `Área bajo aviso de ${national.data!.agency} hasta el ${until(w.expires)}.`,
        `${national.data!.agency} warning area, until ${until(w.expires)}.`,
        `Área sob aviso (${national.data!.agency}) até ${until(w.expires)}.`,
      ),
      url: w.url,
      source: national.data!.agency,
    }));
  const nwsCount = (kind: 'tropical' | 'flood') =>
    inNws && nws.data ? nws.data.filter((a) => a.kind === kind).length : null;
  const notes = (...parts: (string | false | null)[]) =>
    parts.filter(Boolean).join(' · ') || undefined;
  const hazardNotes = {
    cyclone: notes(
      inNhcRegion &&
        !!storms.data &&
        (activeStorms.length
          ? t(
              `NHC: ${activeStorms.length} activo${activeStorms.length > 1 ? 's' : ''} en la cuenca`,
              `NHC: ${activeStorms.length} active in the basin`,
              `NHC: ${activeStorms.length} ativo${activeStorms.length > 1 ? 's' : ''} na bacia`,
            )
          : t('NHC: ninguno activo', 'NHC: none active', 'NHC: nenhum ativo')),
      nwsCount('tropical') !== null &&
        t(
          `NWS: ${nwsCount('tropical')} avisos`,
          `NWS: ${nwsCount('tropical')} alerts`,
          `NWS: ${nwsCount('tropical')} avisos`,
        ),
    ),
    flood: notes(
      nwsCount('flood') !== null &&
        t(
          `NWS: ${nwsCount('flood')} avisos`,
          `NWS: ${nwsCount('flood')} alerts`,
          `NWS: ${nwsCount('flood')} avisos`,
        ),
    ),
  };
  const latestEvent = results.reduce<Quake | undefined>(
    (a, q) => (!a || q.time > a.time ? q : a),
    undefined,
  );
  // The newest record in the whole answer. A catalog whose newest record is more than a day old
  // may have stopped publishing (IGC did during the October 2026 sequence): said with its date.
  const newestRecord = live.events.reduce((a, q) => Math.max(a, q.time), 0);
  const quietSince =
    newestRecord > 0 && live.now - newestRecord > 24 * 3600000 ? newestRecord : undefined;
  // Other catalogs to offer when the selected one fails. IGC only covers Panama.
  const alternatives = (['EMSC', 'USGS', 'IGC'] as const).filter(
    (c) => c !== catalog && (c !== 'IGC' || country === 'PA'),
  );
  const switchCatalog = (c: CatalogId) => {
    catalogChosen.current = true;
    setCatalog(c);
    setDetail(null);
    setPage(1);
  };
  const point = useMemo(() => planCoordinates(plan), [plan]);
  // Without a nationality there is no "my" embassy: never show every embassy under that label.
  const availableEmbassy = nationality ? mappedMissions(country, nationality)[0] : undefined;
  const mappedEmbassies = useMemo(
    () => (showEmbassies ? mappedMissions(country, nationality) : []),
    [showEmbassies, country, nationality],
  );
  const selected = live.events.find((q) => q.id === detail),
    visiblePoint = plan?.country === country ? point : null;
  // The area to save for offline use: the stay when known, otherwise what the map last showed.
  // Then where the person is, if they shared it: a country-wide map has no useful centre.
  const offlineArea = (stay: [number, number] | null) =>
    stay
      ? { view: { lat: stay[0], lng: stay[1], zoom: 13 }, around: 'stay' as const }
      : geo
        ? { view: { lat: geo.lat, lng: geo.lng, zoom: 13 }, around: 'here' as const }
        : { view: boundsView(pending), around: 'map' as const };
  const regionResources = resources.filter((r) => r.country === country || r.country === '*');
  const stale =
      live.failed ||
      !live.online ||
      (live.fetched > 0 && live.now - live.fetched > 120000) ||
      (live.generated > 0 && live.now - live.generated > 600000),
    dirty =
      Math.abs(bounds.west - pending.west) > 0.5 || Math.abs(bounds.north - pending.north) > 0.5;
  const otherSaved = savedCountries.filter(
    (c) => c !== country && (c === 'WORLD' || countries.some((x) => x.code === c)),
  );
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
  // One title and one plain sentence per screen, saying what the person can do there.
  // One row per official source for the sources page, with its state on this device.
  const sourceRow = (
    row: Omit<SourceRow, 'state'>,
    status: { failed: boolean; partial?: boolean; stale?: boolean; maxAge: number; idle?: boolean },
  ): SourceRow => ({
    ...row,
    state: sourceState({ ...status, checked: row.checked, online: live.online, now: live.now }),
  });
  const nationalHere = national.data?.country === country ? national.data : null;
  const civilProtection = destinationFor(country)?.civilProtection;
  const sourceRows: SourceRow[] = [
    ...(['IGC', 'EMSC', 'USGS'] as const)
      .filter((c) => c !== 'IGC' || country === 'PA' || catalog === 'IGC')
      .map((c) => {
        const feed = c === 'IGC' ? igc : c === 'EMSC' ? emsc : usgs;
        return sourceRow(
          {
            id: c,
            name: c === 'IGC' ? 'IGC · Universidad de Panamá' : c,
            covers:
              c === catalog
                ? t(
                    'Sismos · fuente elegida',
                    'Earthquakes · selected source',
                    'Terremotos · fonte escolhida',
                  )
                : t(
                    'Sismos · otra fuente disponible',
                    'Earthquakes · another source',
                    'Terremotos · outra fonte disponível',
                  ),
            url: sourceSites[c],
            checked: feed.fetched || null,
            every: c === catalog ? t('cada 60 s', 'every 60 s', 'a cada 60 s') : '',
          },
          { failed: c === catalog && feed.failed, maxAge: 3 * 60000, idle: c !== catalog },
        );
      }),
    ...(inNational
      ? [
          sourceRow(
            {
              id: 'national',
              name: nationalHere?.agency ?? destinationFor(country)?.weatherAgency?.name ?? '',
              covers: t(
                'Avisos meteorológicos vigentes',
                'Weather warnings in force',
                'Avisos meteorológicos em vigor',
              ),
              url: destinationFor(country)?.weatherAgency?.url ?? '',
              checked: nationalHere?.fetched ?? null,
              every: t('cada 10 min', 'every 10 min', 'a cada 10 min'),
            },
            {
              failed: national.failed,
              partial: nationalHere?.partial,
              stale: nationalHere?.stale,
              maxAge: OFFICIAL_MAX_AGE,
            },
          ),
        ]
      : []),
    ...(inCivil
      ? [
          sourceRow(
            {
              id: 'sinaproc',
              name: 'SINAPROC',
              covers: t(
                'Comunicados y avisos de Protección Civil',
                'Civil protection communiqués and notices',
                'Comunicados e avisos da Proteção Civil',
              ),
              url: SINAPROC_HOME,
              checked: civil.data?.fetched ?? null,
              every: t('cada 10 min', 'every 10 min', 'a cada 10 min'),
            },
            { failed: civil.failed, stale: civil.data?.stale, maxAge: OFFICIAL_MAX_AGE },
          ),
        ]
      : []),
    ...(inNws
      ? [
          sourceRow(
            {
              id: 'nws',
              name: 'NWS · NOAA',
              covers: t(
                'Alertas de tsunami, huracán e inundación en EE. UU.',
                'U.S. tsunami, hurricane and flood alerts',
                'Alertas de tsunami, furacão e inundação nos EUA',
              ),
              url: sourceSites.nws,
              checked: nws.at,
              every: t('cada 60 s', 'every 60 s', 'a cada 60 s'),
            },
            { failed: nws.failed, maxAge: 3 * 60000 },
          ),
        ]
      : []),
    sourceRow(
      {
        id: 'tsunami',
        name: 'NOAA · PTWC',
        covers: t(
          'Boletines de tsunami del Pacífico y el Caribe',
          'Pacific and Caribbean tsunami bulletins',
          'Boletins de tsunami do Pacífico e do Caribe',
        ),
        url: sourceSites.tsunami,
        checked: tsunami.data?.fetched ?? null,
        every: t('cada 60 s', 'every 60 s', 'a cada 60 s'),
      },
      { failed: tsunami.failed, partial: tsunami.data?.partial, maxAge: 3 * 60000 },
    ),
    sourceRow(
      {
        id: 'nhc',
        name: t(
          'NOAA · Centro Nacional de Huracanes',
          'NOAA · National Hurricane Center',
          'NOAA · Centro Nacional de Furacões',
        ),
        covers: t(
          'Ciclones tropicales activos',
          'Active tropical cyclones',
          'Ciclones tropicais ativos',
        ),
        url: sourceSites.nhc,
        checked: storms.data?.fetched ?? null,
        every: t('cada 5 min', 'every 5 min', 'a cada 5 min'),
      },
      { failed: storms.failed, maxAge: 20 * 60000 },
    ),
    sourceRow(
      {
        id: 'gdacs',
        name: 'GDACS',
        covers: t(
          'Alertas internacionales: ciclones, inundaciones y volcanes',
          'International alerts: cyclones, floods and volcanoes',
          'Alertas internacionais: ciclones, inundações e vulcões',
        ),
        url: sourceSites.gdacs,
        checked: alerts.data?.fetched ?? null,
        every: t('cada 5 min', 'every 5 min', 'a cada 5 min'),
      },
      { failed: alerts.failed, partial: alerts.data?.partial, maxAge: 20 * 60000 },
    ),
  ];
  const headings: Record<Exclude<Screen, 'activity'>, [string, string]> = {
    detail:
      homeTab === 'tsunami'
        ? [
            t('Tsunami', 'Tsunami', 'Tsunami'),
            t(
              'Boletines de NOAA/PTWC y qué hacer si estás en la costa.',
              'NOAA/PTWC bulletins and what to do if you are on the coast.',
              'Boletins da NOAA/PTWC e o que fazer se você estiver no litoral.',
            ),
          ]
        : homeTab === 'storms'
          ? [
              t('Ciclones tropicales', 'Tropical cyclones', 'Ciclones tropicais'),
              t(
                'Ciclones activos del Centro Nacional de Huracanes de NOAA.',
                'Active cyclones from the NOAA National Hurricane Center.',
                'Ciclones ativos do Centro Nacional de Furacões da NOAA.',
              ),
            ]
          : homeTab === 'nws'
            ? [
                t('Avisos del NWS', 'NWS alerts', 'Avisos do NWS'),
                t(
                  'Alertas del Servicio Meteorológico Nacional de EE. UU. para esta zona.',
                  'U.S. National Weather Service alerts for this area.',
                  'Alertas do Serviço Meteorológico Nacional dos EUA para esta área.',
                ),
              ]
            : homeTab === 'alerts'
              ? [
                  t('Alertas internacionales', 'International alerts', 'Alertas internacionais'),
                  t(
                    'Alertas de GDACS sobre ciclones, inundaciones y volcanes. No son avisos locales.',
                    'GDACS alerts for cyclones, floods and volcanoes. They are not local warnings.',
                    'Alertas do GDACS sobre ciclones, inundações e vulcões. Não são avisos locais.',
                  ),
                ]
              : [
                  t(
                    `Sismos en ${countryName}`,
                    `Earthquakes in ${countryName}`,
                    `Terremotos · ${countryName}`,
                  ),
                  t(
                    'Cada sismo como lo publica la fuente elegida, con filtros y por páginas.',
                    'Each earthquake as the selected source publishes it, with filters and pages.',
                    'Cada terremoto como a fonte escolhida o publica, com filtros e por páginas.',
                  ),
                ],
    sources: [
      t('Fuentes y actualización', 'Sources & updates', 'Fontes e atualizações'),
      t(
        'De dónde viene cada dato, cuándo se consultó por última vez y qué cubre.',
        'Where each piece of data comes from, when it was last checked and what it covers.',
        'De onde vem cada dado, quando foi consultado pela última vez e o que cobre.',
      ),
    ],
    emergency: [
      country === 'WORLD'
        ? t('Emergencia', 'Emergency', 'Emergência')
        : t(
            `Emergencia en ${countryName}`,
            `Emergency in ${countryName}`,
            `Emergência · ${countryName}`,
          ),
      t(
        'Al tocar un número se abre tu teléfono. Faro no llama ni pide ayuda por ti.',
        'Tapping a number opens your phone. Faro does not call or request help for you.',
        'Tocar em um número abre o seu telefone. O Faro não liga nem pede ajuda por você.',
      ),
    ],
    help: [
      t('Ayuda local', 'Local help', 'Ajuda local'),
      t(
        'Teléfonos de emergencia, farmacias y hospitales, fuentes oficiales y tu embajada.',
        'Emergency numbers, pharmacies and hospitals, official sources and your embassy.',
        'Telefones de emergência, farmácias e hospitais, fontes oficiais e sua embaixada.',
      ),
    ],
    status: [
      t('Avisar cómo estoy', 'Tell people how I am', 'Avisar como estou'),
      t(
        'Prepara un mensaje para tu familia o tu equipo: cómo estás, dónde y cuándo volverás a escribir.',
        'Prepare a message for your family or team: how you are, where, and when you will write again.',
        'Prepare uma mensagem para sua família ou sua equipe: como você está, onde e quando vai escrever de novo.',
      ),
    ],
    kit: [
      t('Mochila de emergencia', 'Go bag', 'Mochila de emergência'),
      t(
        'Calcula tu reserva, marca lo que ya tienes y encuentra dónde comprar lo que falta.',
        'Work out your supplies, tick what you have and find where to buy what is missing.',
        'Calcule sua reserva, marque o que você já tem e encontre onde comprar o que falta.',
      ),
    ],
    hotel: [
      t('Mi viaje', 'My trip', 'Minha viagem'),
      t(
        'Tus datos para una emergencia, listos para enviar por WhatsApp, Telegram, SMS o correo. Todo es opcional.',
        'Your details for an emergency, ready to send by WhatsApp, Telegram, SMS or email. Everything is optional.',
        'Seus dados para uma emergência, prontos para enviar por WhatsApp, Telegram, SMS ou e-mail. Tudo é opcional.',
      ),
    ],
    guide: [
      t(
        'Qué hacer en una emergencia',
        'What to do in an emergency',
        'O que fazer em uma emergência',
      ),
      t(
        'Pasos generales por tipo de emergencia. Sigue siempre las instrucciones de las autoridades locales.',
        'General steps by type of emergency. Always follow instructions from local authorities.',
        'Passos gerais por tipo de emergência. Siga sempre as instruções das autoridades locais.',
      ),
    ],
  };
  // Each screen has its own page title, read first by screen readers and shown in tabs.
  const pageTitle =
    screen === 'activity'
      ? t(
          `Faro · ${countryName}: emergencias y ayuda local`,
          `Faro · ${countryName}: emergencies and local help`,
          `Faro · ${countryName}: emergências e ajuda local`,
        )
      : `${headings[screen][0]} · Faro`;
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  const nav = [
    { id: 'activity', title: t('Situación', 'Situation', 'Situação'), Icon: PulseIcon },
    { id: 'help', title: t('Ayuda local', 'Local help', 'Ajuda local'), Icon: UsersThreeIcon },
    { id: 'status', title: t('Mi estado', 'My status', 'Meu status'), Icon: ChatCircleTextIcon },
    { id: 'kit', title: t('Mochila', 'Go bag', 'Mochila'), Icon: BackpackIcon },
    { id: 'hotel', title: t('Mi viaje', 'My trip', 'Minha viagem'), Icon: BuildingsIcon },
    { id: 'guide', title: t('Guía', 'Guide', 'Guia'), Icon: BookOpenTextIcon },
  ] as const;
  return (
    <div className="fw-app" ref={appRef} data-screen={screen}>
      <a className="fw-skip" href="#main">
        {t('Saltar al contenido', 'Skip to content', 'Pular para o conteúdo')}
      </a>
      <header className="fw-header">
        <button
          className="fw-brand"
          onClick={() => setScreen('activity')}
          aria-label={t('Faro, inicio', 'Faro, home', 'Faro, início')}
        >
          <img src="/faro-mark.svg" alt="" />
          Faro
        </button>
        <span className="fw-nav-caption">{t('En este viaje', 'On this trip', 'Nesta viagem')}</span>
        <nav aria-label={t('Navegación principal', 'Main navigation', 'Navegação principal')}>
          {nav.map(({ id, title, Icon }) => (
            <button
              key={id}
              // The detail page belongs to the situation screen.
              className={
                screen === id || (id === 'activity' && screen === 'detail') ? 'current' : ''
              }
              aria-current={
                screen === id
                  ? 'page'
                  : id === 'activity' && screen === 'detail'
                    ? 'true'
                    : undefined
              }
              onClick={() => setScreen(id)}
            >
              <Icon size={19} />
              <span>{title}</span>
            </button>
          ))}
        </nav>
        <div className="fw-sidebar-foot">
          <button
            className={`fw-emergency-trigger fw-emergency-persistent ${screen === 'emergency' ? 'current' : ''}`}
            aria-current={screen === 'emergency' ? 'page' : undefined}
            onClick={() => openEmergency('call')}
          >
            <PhoneIcon size={19} aria-hidden="true" />
            {t('Emergencias', 'Emergency', 'Emergência')}
          </button>
          {/* On phones only the icon shows, so the name comes from the label. */}
          <button
            className="fw-profile-button"
            aria-label={`${t('Mis datos', 'My details', 'Meus dados')}: ${
              profile
                ? names.of(profile.destination)
                : t('Sin configurar', 'Not set up', 'Não configurado')
            }`}
            onClick={() => setScreen('hotel')}
          >
            <UserCircleIcon size={22} />
            <span>
              {t('Mis datos', 'My details', 'Meus dados')}
              <small>
                {profile
                  ? names.of(profile.destination)
                  : t('Sin configurar', 'Not set up', 'Não configurado')}
              </small>
            </span>
          </button>
          <button
            className={`fw-source-access ${screen === 'sources' ? 'current' : ''}`}
            aria-current={screen === 'sources' ? 'page' : undefined}
            onClick={() => setScreen('sources')}
          >
            <InfoIcon size={19} />
            <span>
              {t('Fuentes y actualización', 'Sources & updates', 'Fontes e atualizações')}
              <small>IGC · EMSC · USGS · NOAA · GDACS</small>
            </span>
          </button>
          <div className="fw-language" role="group" aria-label={t('Idioma', 'Language', 'Idioma')}>
            <button aria-pressed={lang === 'es'} onClick={() => changeLanguage('es')}>
              ES
            </button>
            <button aria-pressed={lang === 'en'} onClick={() => changeLanguage('en')}>
              EN
            </button>
            <button aria-pressed={lang === 'pt'} onClick={() => changeLanguage('pt')}>
              PT
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="fw-main" data-screen={screen}>
        <p className="fw-visually-hidden" role="status">
          {connection === 'lost'
            ? t(
                'Sin conexión. Los números de emergencia y la guía siguen disponibles.',
                'Offline. Emergency numbers and guidance are still available.',
                'Sem conexão. Os números de emergência e o guia continuam disponíveis.',
              )
            : connection === 'back'
              ? t(
                  'Conexión recuperada. Los datos oficiales se están actualizando.',
                  'Back online. Official data is updating.',
                  'Conexão restabelecida. Os dados oficiais estão sendo atualizados.',
                )
              : ''}
        </p>
        {!live.online && (
          <div className="fw-offline">
            <WifiSlashIcon size={20} aria-hidden="true" />
            <p>
              <strong>{t('Sin conexión', 'Offline', 'Sem conexão')}</strong>
              {t(
                'Puedes usar lo guardado en este dispositivo: números de emergencia, guía, tu plan y tus contactos. Los datos oficiales no se actualizan hasta que vuelva la conexión.',
                'You can use what is stored on this device: emergency numbers, guidance, your plan and contacts. Official data will not update until the connection returns.',
                'Você pode usar o que está salvo neste dispositivo: números de emergência, guia, seu plano e seus contatos. Os dados oficiais não são atualizados até a conexão voltar.',
              )}
            </p>
          </div>
        )}
        {profileFeedback && (
          <div className="fw-save-feedback">
            <span role="status">
              {profileFeedback === 'storage'
                ? t(
                    'No se pudo guardar el cambio en este navegador. Inténtalo de nuevo.',
                    'Could not save the change in this browser. Please retry.',
                    'Não foi possível salvar a alteração neste navegador. Tente de novo.',
                  )
                : profileFeedback === 'saved'
                  ? t(
                      'Perfil guardado en este navegador.',
                      'Profile saved in this browser.',
                      'Perfil salvo neste navegador.',
                    )
                  : t(
                      'Perfil borrado. Tus contactos y planes se conservaron.',
                      'Profile deleted. Your contacts and plans were kept.',
                      'Perfil apagado. Seus contatos e planos foram mantidos.',
                    )}
            </span>
            {profileFeedback === 'saved' && (
              <button
                onClick={() => {
                  setScreen('hotel');
                  setProfileFeedback(null);
                }}
              >
                {t('Preparar mi viaje', 'Prepare my trip', 'Preparar minha viagem')}
              </button>
            )}
            <button
              aria-label={t('Cerrar confirmación', 'Dismiss confirmation', 'Fechar confirmação')}
              onClick={() => setProfileFeedback(null)}
            >
              <XIcon size={18} />
            </button>
          </div>
        )}
        <div className="fw-context">
          <div className="fw-country">
            <CountrySearch
              label={t('País', 'Country', 'País')}
              value={country}
              lang={lang}
              includeWorld
              onChange={(code) => {
                if (code) changeCountry(code);
              }}
            />
            <button
              className="fw-country-locate"
              onClick={countryFromLocation}
              disabled={placeState?.kind === 'pending'}
              aria-label={t(
                'Usar mi ubicación para elegir el país',
                'Use my location to choose the country',
                'Usar minha localização para escolher o país',
              )}
            >
              <CrosshairIcon size={18} aria-hidden="true" />
              <span>
                {placeState?.kind === 'pending'
                  ? t('Ubicando…', 'Locating…', 'Localizando…')
                  : t('Mi ubicación', 'My location', 'Minha localização')}
              </span>
            </button>
            {/* Saves the country for one-tap switching later; the label says so. */}
            <button
              className="fw-country-save"
              onClick={saveCountry}
              aria-pressed={savedCountries.includes(country)}
              aria-label={
                savedCountries.includes(country)
                  ? t(
                      'Quitar de mis países guardados',
                      'Remove from my saved countries',
                      'Remover dos meus países salvos',
                    )
                  : t('Guardar este país', 'Save this country', 'Salvar este país')
              }
            >
              <BookmarkSimpleIcon
                size={18}
                weight={savedCountries.includes(country) ? 'fill' : 'regular'}
                aria-hidden="true"
              />
              <span>
                {savedCountries.includes(country)
                  ? t('País guardado', 'Country saved', 'País salvo')
                  : t('Guardar país', 'Save country', 'Salvar país')}
              </span>
            </button>
          </div>
          <InstallFaro lang={lang} />
          {placeState && placeState.kind !== 'pending' && (
            <p className="fw-context-status" role="status">
              {placeState.kind === 'found'
                ? t(
                    `Según tu ubicación: ${names.of(placeState.code)}.`,
                    `Based on your location: ${names.of(placeState.code)}.`,
                    `Pela sua localização: ${names.of(placeState.code)}.`,
                  )
                : placeState.kind === 'denied'
                  ? t(
                      'No diste permiso de ubicación. Elige el país en la lista.',
                      'Location permission was not given. Choose the country from the list.',
                      'Você não deu permissão de localização. Escolha o país na lista.',
                    )
                  : placeState.kind === 'unknown'
                    ? t(
                        'No pudimos saber en qué país estás. Elígelo en la lista.',
                        'We could not tell which country you are in. Choose it from the list.',
                        'Não conseguimos saber em que país você está. Escolha-o na lista.',
                      )
                    : t(
                        'No se pudo obtener tu ubicación. Elige el país en la lista.',
                        'Your location could not be found. Choose the country from the list.',
                        'Não foi possível obter sua localização. Escolha o país na lista.',
                      )}
            </p>
          )}
        </div>
        {/* One-tap switches to other saved countries; the one on screen is not repeated. */}
        {screen !== 'guide' && screen !== 'status' && otherSaved.length > 0 && (
          <div className="fw-saved">
            <small>{t('Guardados', 'Saved', 'Salvos')}</small>
            {otherSaved.map((c) => (
              <button key={c} onClick={() => changeCountry(c)}>
                {c === 'WORLD' ? t('Mundo', 'World', 'Mundo') : names.of(c)}
              </button>
            ))}
          </div>
        )}
        {/* A source that answers but whose newest record is more than a day old: said with its
            date, with the other catalogs one tap away. Never read as "no earthquakes". */}
        {screen === 'detail' && homeTab === 'quakes' && !stale && quietSince && live.online && (
          <div className="fw-warning" role="status">
            {t(
              `El registro más reciente de ${provider} es del ${stamp(quietSince)}. Otras fuentes pueden tener datos más nuevos:`,
              `${provider}'s most recent record is from ${stamp(quietSince)}. Other sources may have newer data:`,
              `O registro mais recente de ${provider} é de ${stamp(quietSince)}. Outras fontes podem ter dados mais novos:`,
            )}{' '}
            <span className="fw-source-fallback">
              {alternatives.map((c) => (
                <button key={c} onClick={() => switchCatalog(c)}>
                  {providerNames[c]}
                </button>
              ))}
            </span>
          </div>
        )}
        {/* Offline is already explained by the banner above; this box is for a failing source. */}
        {screen === 'detail' && homeTab === 'quakes' && stale && live.online && (
          <div className="fw-warning" role="status">
            {t(
              'No hay una actualización reciente. Estos registros pueden estar desactualizados.',
              'No recent update. These records may be out of date.',
              'Não há uma atualização recente. Estes registros podem estar desatualizados.',
            )}{' '}
            {live.fetched
              ? `${t('Última consulta correcta', 'Last successful check', 'Última consulta bem-sucedida')}: ${stamp(live.fetched)}`
              : t(
                  'Todavía no se recibieron datos.',
                  'No data received yet.',
                  'Ainda não foram recebidos dados.',
                )}
            <button onClick={() => void live.refresh()}>
              {t('Reintentar', 'Retry', 'Tentar de novo')}
            </button>
            {live.online && (
              <span className="fw-source-fallback">
                {t(
                  'Mientras tanto, consulta otra fuente:',
                  'Meanwhile, check another source:',
                  'Enquanto isso, consulte outra fonte:',
                )}
                {alternatives.map((c) => (
                  <button key={c} onClick={() => switchCatalog(c)}>
                    {providerNames[c]}
                  </button>
                ))}
              </span>
            )}
          </div>
        )}
        {screen !== 'status' && checkInDue(checkIns[0], live.now) && (
          <div className="fw-checkin-reminder" role="status">
            <span>
              {t(
                'Tienes pendiente avisar cómo estás.',
                'Your planned check-in is overdue.',
                'Você ainda precisa avisar como está.',
              )}
            </span>
            <button onClick={() => setScreen('status')}>
              {t('Actualizar mi estado', 'Update my status', 'Atualizar meu status')}
            </button>
          </div>
        )}
        {screen !== 'activity' && (
          <div className="fw-heading">
            <div>
              {screen === 'detail' && (
                <button className="fw-back" onClick={() => setScreen('activity')}>
                  <CaretLeftIcon size={16} aria-hidden="true" />
                  {t(
                    `Situación en ${countryName}`,
                    `Situation in ${countryName}`,
                    `Situação · ${countryName}`,
                  )}
                </button>
              )}
              <h1 tabIndex={-1}>{headings[screen][0]}</h1>
              <p>{headings[screen][1]}</p>
            </div>
          </div>
        )}
        {/* Location matters where distances are shown: the earthquake list and local help. */}
        {((screen === 'detail' && homeTab === 'quakes') || screen === 'help' || tracking) && (
          <div className={`fw-location ${geoState === 'idle' ? 'fw-location-idle' : ''}`}>
            <InfoIcon size={16} />
            <span>
              {geo
                ? `${t('Precisión aproximada', 'Approximate accuracy', 'Precisão aproximada')}: ${Math.round(geo.accuracy)} m · ${t('Ubicación', 'Location', 'Localização')}: ${shortTime(geo.at)}`
                : geoState === 'denied'
                  ? t(
                      'Permiso de ubicación denegado. Puedes seguir usando el selector de país.',
                      'Location permission denied. You can still choose a country.',
                      'Permissão de localização negada. Você ainda pode usar o seletor de país.',
                    )
                  : geoState === 'failed'
                    ? t(
                        'No se pudo obtener la ubicación. Elige un país o inténtalo otra vez.',
                        'Could not get your location. Choose a country or try again.',
                        'Não foi possível obter a localização. Escolha um país ou tente de novo.',
                      )
                    : t(
                        'La ubicación es opcional. Las distancias se calculan en tu dispositivo; el GPS no se guarda automáticamente.',
                        'Location is optional. Distances are calculated on your device; GPS is not saved automatically.',
                        'A localização é opcional. As distâncias são calculadas no seu dispositivo; o GPS não é salvo automaticamente.',
                      )}
            </span>
            {tracking && (
              <button onClick={stopLocation}>
                {t('Detener ubicación', 'Stop location', 'Parar localização')}
              </button>
            )}
          </div>
        )}
        {screen === 'activity' && (
          <>
            <SituationBriefing
              lang={lang}
              countryName={countryName}
              quakes={{
                count: quakeSummary.count,
                largest: quakeSummary.largest,
                latest: latestEvent,
                // After "Search this area" the row counts the map area, not the country: said.
                period:
                  scope === 'area'
                    ? `${periodLabel} ${t('en el área del mapa', 'in the map area', 'na área do mapa')}`
                    : scope === 'nearby'
                      ? `${periodLabel} ${t(`a ${radius} km`, `within ${radius} km`, `a ${radius} km`)}`
                      : periodLabel,
                provider,
                // Never answered: "checking" while online, "no data" offline, never "none".
                loading: !live.fetched,
                offline: !live.fetched && !live.online,
                failed: live.failed,
                staleSince: live.fetched && stale ? live.fetched : undefined,
                quietSince,
              }}
              monitor={{
                state: !live.online
                  ? 'offline'
                  : !live.checked
                    ? live.failed
                      ? 'failed'
                      : 'checking'
                    : stale
                      ? 'stale'
                      : 'live',
                // The time of the data itself: an old copy served during an outage keeps its age.
                checked: live.fetched || live.checked || null,
              }}
              alert={
                tsunamiAlert && (
                  <TsunamiBanner
                    lang={lang}
                    now={live.now}
                    bulletin={tsunamiAlert}
                    lastData={tsunamiLastData}
                    onOpen={() => openTab('tsunami')}
                  />
                )
              }
              hazards={hazardStates}
              notes={hazardNotes}
              nwsArea={inNws}
              onFloodGuide={() => {
                setGuideTopic('flood-during');
                go('guide');
              }}
              leads={{
                flood: nwsCount('flood')
                  ? t(
                      `NWS: ${nwsCount('flood')} avisos de inundación en vigor`,
                      `NWS: ${nwsCount('flood')} flood alerts in force`,
                      `NWS: ${nwsCount('flood')} avisos de inundação em vigor`,
                    )
                  : undefined,
                cyclone: nwsCount('tropical')
                  ? t(
                      `NWS: ${nwsCount('tropical')} avisos tropicales en vigor`,
                      `NWS: ${nwsCount('tropical')} tropical alerts in force`,
                      `NWS: ${nwsCount('tropical')} avisos tropicais em vigor`,
                    )
                  : undefined,
              }}
              national={
                inNational
                  ? {
                      // Only an answer for this country names its agency or counts as checked.
                      agency:
                        (national.data?.country === country ? national.data.agency : undefined) ??
                        destinationFor(country)?.weatherAgency?.name ??
                        '',
                      warnings:
                        national.data?.country === country
                          ? activeWarnings(national.data.warnings, live.now)
                          : null,
                      failed: national.failed,
                      partial: national.data?.country === country && national.data.partial,
                      checked: national.data?.country === country ? national.data.fetched : null,
                      // The adapter's previous copy during an outage never reads as "no warnings".
                      stale:
                        !live.online ||
                        (national.data?.country === country &&
                          (national.data.stale ||
                            live.now - national.data.fetched > OFFICIAL_MAX_AGE)),
                    }
                  : undefined
              }
              stormsInBasin={inNhcRegion && storms.data ? activeStorms.length : undefined}
              floodAdvice={floodAdvice}
              floodNotice={floodNotice}
              civil={
                inCivil
                  ? {
                      agency: 'SINAPROC',
                      posts: civil.data?.posts ?? null,
                      failed: civil.failed,
                      stale:
                        !live.online ||
                        !!civil.data?.stale ||
                        (!!civil.data && live.now - civil.data.fetched > OFFICIAL_MAX_AGE),
                      checked: civil.data?.fetched ?? null,
                      offline: !live.online,
                    }
                  : undefined
              }
              // U.S. territories follow the U.S. agencies, as their emergency numbers do.
              authority={destinationFor(US_AREAS.has(country) ? 'US' : country)?.civilProtection}
              weather={destinationFor(US_AREAS.has(country) ? 'US' : country)?.weatherAgency}
              services={destinationFor(country)?.services}
              now={live.now}
              updated={
                <>
                  <span className={stale ? 'is-stale' : ''}>
                    {!live.fetched
                      ? !live.online
                        ? t(
                            'Sin conexión: todavía no hay datos oficiales',
                            'Offline: no official data yet',
                            'Sem conexão: ainda não há dados oficiais',
                          )
                        : live.failed
                          ? // Only the earthquake catalog is behind this line: it is named, so the
                            // other sources that did answer are not reported as down.
                            t(
                              `La fuente de sismos (${provider}) no responde`,
                              `The earthquake source (${provider}) is not responding`,
                              `A fonte de terremotos (${provider}) não responde`,
                            )
                          : t(
                              'Consultando fuentes oficiales…',
                              'Checking official sources…',
                              'Consultando fontes oficiais…',
                            )
                      : stale
                        ? t(
                            `Sismos (${provider}): sin actualizar desde ${atLabel(live.fetched, live.now, lang)}`,
                            `Earthquakes (${provider}): not updated since ${atLabel(live.fetched, live.now, lang)}`,
                            `Terremotos (${provider}): sem atualização desde ${atLabel(live.fetched, live.now, lang)}`,
                          )
                        : t(
                            `Datos oficiales consultados a ${atLabel(live.fetched, live.now, lang)}`,
                            `Official data checked at ${atLabel(live.fetched, live.now, lang)}`,
                            `Dados oficiais consultados: ${atLabel(live.fetched, live.now, lang)}`,
                          )}
                  </span>
                  <button className="fw-text" onClick={() => setScreen('sources')}>
                    {t('Fuentes', 'Sources', 'Fontes')}
                  </button>
                </>
              }
              actions={
                <HomeActions
                  lang={lang}
                  country={country}
                  onEmergency={() => openEmergency('call')}
                  onSteps={() => openEmergency('steps')}
                  onStatus={() => setScreen('status')}
                />
              }
              setup={
                showSetupCard ? (
                  <SetupCard
                    lang={lang}
                    countryName={countryName}
                    onSave={saveNationality}
                    onMore={() => setScreen('hotel')}
                    onDismiss={dismissSetupCard}
                  />
                ) : undefined
              }
              map={
                <section className="fw-map-card">
                  <div className="fw-map-head">
                    <span>
                      <MapPinIcon size={17} />
                      {scope === 'nearby'
                        ? `${radius} km · ${t('cerca de ti', 'near you', 'perto de você')}`
                        : scope === 'area'
                          ? t('Área del mapa', 'Map area', 'Área do mapa')
                          : countryName}
                    </span>
                    <small>
                      {t(
                        'Puntos publicados, no zonas de riesgo',
                        'Published points, not hazard zones',
                        'Pontos publicados, não zonas de risco',
                      )}
                    </small>
                  </div>
                  {/* The map's markers are focusable; keyboard users can pass them in one step. */}
                  <a className="fw-skip" href="#fw-map-foot">
                    {t('Saltar el mapa', 'Skip the map', 'Pular o mapa')}
                  </a>
                  <WebMap
                    embassies={mappedEmbassies}
                    hazards={mapHazards}
                    areas={warningAreas}
                    lang={lang}
                    events={results}
                    view={view}
                    geo={geo}
                    point={visiblePoint}
                    selected={detail || focused || undefined}
                    onSelect={(q) => setDetail(q.id)}
                    onBounds={setPending}
                  />
                  <div className="fw-map-foot" id="fw-map-foot" tabIndex={-1}>
                    {/* Each entry with a small copy of what it describes on the map. */}
                    <span className="fw-map-legend">
                      <span>
                        <i className="fw-legend-pin" aria-hidden="true" />
                        {t('Marcador: magnitud', 'Pin: magnitude', 'Marcador: magnitude')}
                      </span>
                      <span>
                        <i className="fw-legend-count" aria-hidden="true" />
                        {t(
                          'Círculo: cantidad de sismos',
                          'Circle: earthquake count',
                          'Círculo: quantidade de terremotos',
                        )}
                      </span>
                      {mapHazards.length > 0 && (
                        <span>
                          <i className="fw-legend-hazard" aria-hidden="true" />
                          {t(
                            'Ícono redondo: alerta GDACS',
                            'Round icon: GDACS alert',
                            'Ícone redondo: alerta do GDACS',
                          )}
                        </span>
                      )}
                      {warningAreas.length > 0 && (
                        <span>
                          <i className="fw-legend-area" aria-hidden="true" />
                          {t(
                            `Área sombreada: bajo aviso de ${national.data!.agency}`,
                            `Shaded area: ${national.data!.agency} warning area`,
                            `Área sombreada: sob aviso (${national.data!.agency})`,
                          )}
                        </span>
                      )}
                      {visiblePoint && (
                        <span className="fw-personal-legend">
                          <FlagIcon size={14} aria-hidden="true" />
                          {t(
                            'Bandera: punto personal no verificado',
                            'Flag: unverified personal point',
                            'Bandeira: ponto pessoal não verificado',
                          )}
                        </span>
                      )}
                    </span>
                    {availableEmbassy && (
                      <button
                        className="fw-map-embassy"
                        aria-pressed={showEmbassies}
                        onClick={() => setShowEmbassies((v) => !v)}
                      >
                        <FlagIcon size={15} aria-hidden="true" />
                        {showEmbassies
                          ? t('Ocultar mi embajada', 'Hide my embassy', 'Ocultar minha embaixada')
                          : t('Mostrar mi embajada', 'Show my embassy', 'Mostrar minha embaixada')}
                      </button>
                    )}
                    {dirty && (
                      <button
                        onClick={() => {
                          setBounds(pending);
                          setScope('area');
                          setPage(1);
                        }}
                      >
                        {t('Buscar en esta área', 'Search this area', 'Buscar nesta área')}
                      </button>
                    )}
                  </div>
                </section>
              }
              response={
                <>
                  {responsesFor(country, live.now).map((r) => (
                    <ResponsePanel
                      key={r.id}
                      lang={lang}
                      response={r}
                      nationality={profile?.nationality || nationality}
                      now={live.now}
                    />
                  ))}
                </>
              }
              onOpen={(key) =>
                openTab(
                  key === 'earthquake'
                    ? 'quakes'
                    : key === 'tsunami'
                      ? 'tsunami'
                      : key === 'cyclone' && nwsCount('tropical')
                        ? 'nws'
                        : key === 'cyclone' && inNhcRegion
                          ? 'storms'
                          : key === 'cyclone' && inNws
                            ? 'nws'
                            : key === 'flood' && inNws
                              ? 'nws'
                              : 'alerts',
                )
              }
            />
          </>
        )}
        {screen === 'detail' && (
          <div className="fw-detail">
            <HomeTabs
              label={t('Detalle por fuente', 'Detail by source', 'Detalhe por fonte')}
              active={homeTab}
              onChange={setHomeTab}
              tabs={[
                {
                  id: 'quakes',
                  label: t('Sismos', 'Earthquakes', 'Terremotos'),
                  // No answer yet (or a failing source): no count, never a "0".
                  // No count from old data: "0" would read as "no earthquakes".
                  count: (live.checked || live.fetched) && !stale ? results.length : undefined,
                  content: (
                    <div className="fw-quakes" id="sismos">
                      <div className="fw-query-controls">
                        <details className="fw-query-filters">
                          <summary>
                            <strong>{t('Filtros', 'Filters', 'Filtros')}</strong>
                            <span>
                              {catalog} ·{' '}
                              {hours === 168 ? t('7 días', '7 days', '7 dias') : `${hours} h`} ·{' '}
                              {minMag
                                ? `${t('Magnitud', 'Magnitude', 'Magnitude')} ≥ ${minMag}`
                                : t(
                                    'Todas las magnitudes',
                                    'All magnitudes',
                                    'Todas as magnitudes',
                                  )}
                              {maxDepth < 800 ? ` · ≤ ${maxDepth} km` : ''}
                              {scope === 'nearby' ? ` · ${radius} km` : ''}
                            </span>
                          </summary>{' '}
                          <div className="fw-toolbar fw-catalog-toolbar">
                            <label>
                              {t('Fuente', 'Source', 'Fonte')}
                              <select
                                value={catalog}
                                onChange={(e) => switchCatalog(e.target.value as CatalogId)}
                              >
                                {country === 'PA' && <option value="IGC">IGC · UP · Panamá</option>}
                                <option value="EMSC">
                                  EMSC · {t('Mundo, M2.5+', 'Worldwide, M2.5+', 'Mundo, M2.5+')}
                                </option>
                                <option value="USGS">
                                  USGS · {t('Mundo', 'Worldwide', 'Mundo')}
                                </option>
                              </select>
                            </label>
                            <label>
                              {t('Período', 'Period', 'Período')}
                              <select
                                value={hours}
                                onChange={(e) => {
                                  setHours(+e.target.value);
                                  setPage(1);
                                }}
                              >
                                <option value={1}>{t('1 hora', '1 hour', '1 hora')}</option>
                                <option value={24}>{t('24 horas', '24 hours', '24 horas')}</option>
                                <option value={168}>{t('7 días', '7 days', '7 dias')}</option>
                              </select>
                            </label>
                            <label>
                              {t('Magnitud', 'Magnitude', 'Magnitude')}
                              <select value={minMag} onChange={(e) => setMinMag(+e.target.value)}>
                                <option value={0}>{t('Todas', 'All', 'Todas')}</option>
                                {[2.5, 4, 5, 6].map((m) => (
                                  <option key={m} value={m}>
                                    ≥ {m}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <details className="fw-filter-extra">
                              <summary>{t('Más filtros', 'More filters', 'Mais filtros')}</summary>
                              <div>
                                <label>
                                  {t('Zona horaria', 'Time zone', 'Fuso horário')}
                                  <select
                                    value={timeZone}
                                    onChange={(e) => setTimeZone(e.target.value as 'local' | 'utc')}
                                  >
                                    <option value="local">
                                      {t('Local', 'Local', 'Local')} ·{' '}
                                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                    </option>
                                    <option value="utc">UTC</option>
                                  </select>
                                </label>
                                <label>
                                  {t('Profundidad', 'Depth', 'Profundidade')}
                                  <select
                                    value={maxDepth}
                                    onChange={(e) => setMaxDepth(+e.target.value)}
                                  >
                                    <option value={800}>{t('Todas', 'All', 'Todas')}</option>
                                    <option value={70}>≤ 70 km</option>
                                    <option value={30}>≤ 30 km</option>
                                  </select>
                                </label>
                                {geo && (
                                  <label>
                                    {t('Área', 'Area', 'Área')}
                                    <select
                                      value={scope === 'nearby' ? radius : 0}
                                      onChange={(e) => {
                                        setScope(+e.target.value ? 'nearby' : 'area');
                                        if (+e.target.value) setRadius(+e.target.value);
                                      }}
                                    >
                                      <option value={0}>
                                        {t(
                                          'Área seleccionada',
                                          'Selected area',
                                          'Área selecionada',
                                        )}
                                      </option>
                                      {[50, 100, 300, 500].map((k) => (
                                        <option key={k} value={k}>
                                          {k} km · {t('cerca de mí', 'near me', 'perto de mim')}
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
                                ? t(
                                    'Buscando ubicación…',
                                    'Finding location…',
                                    'Buscando localização…',
                                  )
                                : t(
                                    'Sismos cerca de mí',
                                    'Earthquakes near me',
                                    'Terremotos perto de mim',
                                  )}
                            </button>
                            <button className="fw-text" onClick={() => setScreen('sources')}>
                              {t('Fuentes y cobertura', 'Sources & coverage', 'Fontes e cobertura')}
                            </button>
                            <small>
                              {t(
                                'La ubicación es opcional y requiere tu permiso.',
                                'Location is optional and requires your permission.',
                                'A localização é opcional e precisa da sua permissão.',
                              )}
                            </small>
                          </div>
                        </details>
                      </div>
                      <LiveActivity
                        events={results}
                        updates={live.updates.filter((u) =>
                          results.some((e) => e.id === u.event.id),
                        )}
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
                        period={periodLabel}
                        formatTime={(n) =>
                          `${shortTime(n)} ${timeZone === 'utc' ? 'UTC' : new Intl.DateTimeFormat(lang, { timeZoneName: 'short' }).formatToParts(n).find((p) => p.type === 'timeZoneName')?.value || ''}`
                        }
                        onRefresh={() => void live.refresh()}
                        onDetails={(q) => setDetail(q.id)}
                        onMap={showEpicentre}
                      />
                      <div className="fw-quake-meta">
                        <p className="fw-area-scope" role="status">
                          {scope === 'country' && hasBorders(country)
                            ? t(
                                `${countryName} y hasta 100 km mar adentro. Límites aproximados.`,
                                `${countryName} and up to 100 km offshore. Approximate boundaries.`,
                                `${countryName} e até 100 km mar adentro. Limites aproximados.`,
                              )
                            : scope === 'nearby'
                              ? t(
                                  `Sismos a menos de ${radius} km de tu ubicación.`,
                                  `Earthquakes within ${radius} km of your location.`,
                                  `Terremotos a menos de ${radius} km da sua localização.`,
                                )
                              : scope === 'area'
                                ? t(
                                    'Área del mapa: incluye todos los países visibles.',
                                    'Map area: includes all visible countries.',
                                    'Área do mapa: inclui todos os países visíveis.',
                                  )
                                : regionScope(country, lang)}
                        </p>
                        <MagnitudeLegend lang={lang} />
                      </div>
                      <section
                        className="fw-events"
                        aria-label={t('Lista de sismos', 'Earthquake list', 'Lista de terremotos')}
                      >
                        <div className="fw-events-title">
                          <div>
                            <h2 id="fw-events-title" tabIndex={-1}>
                              {/* No count before the catalog has answered: "0" would read as none. */}
                              {!live.fetched
                                ? t('Sismos', 'Earthquakes', 'Terremotos')
                                : `${results.length} ${
                                    results.length === 1
                                      ? t('sismo', 'earthquake', 'terremoto')
                                      : t('sismos', 'earthquakes', 'terremotos')
                                  }`}
                            </h2>
                            {listPage.pages > 1 && (
                              <p>
                                {t(
                                  `Mostrando ${listPage.start + 1}–${listPage.end}`,
                                  `Showing ${listPage.start + 1}–${listPage.end}`,
                                  `Mostrando ${listPage.start + 1}–${listPage.end}`,
                                )}
                              </p>
                            )}
                          </div>
                          <select
                            aria-label={t('Ordenar eventos', 'Sort events', 'Ordenar eventos')}
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                          >
                            <option value="time">
                              {t('Más recientes', 'Most recent', 'Mais recentes')}
                            </option>
                            <option value="magnitude">
                              {t('Mayor magnitud', 'Largest magnitude', 'Maior magnitude')}
                            </option>
                            {geo && (
                              <option value="distance">
                                {t('Más cercanos', 'Nearest', 'Mais próximos')}
                              </option>
                            )}
                          </select>
                        </div>
                        <div className="fw-event-list">
                          {results.slice(listPage.start, listPage.end).map((q) => (
                            <button
                              key={q.id}
                              className={`fw-event ${newIds.has(q.id) ? 'is-new' : ''}`}
                              onClick={() => setDetail(q.id)}
                            >
                              <strong className={`fw-mag fw-mag-band-${magnitudeBand(q.mag)}`}>
                                {q.mag?.toFixed(1) ?? '—'}
                                <small className="fw-visually-hidden">
                                  {t('Magnitud', 'Magnitude', 'Magnitude')}
                                </small>
                              </strong>
                              <span>
                                <b>
                                  {displayPlace(q.place)}
                                  {newIds.has(q.id) && (
                                    <em className="fw-event-new">
                                      {t(
                                        'Recibido recientemente',
                                        'Recently received',
                                        'Recebido recentemente',
                                      )}
                                    </em>
                                  )}
                                </b>
                                <small>
                                  {shortTime(q.time)} {timeZone === 'utc' ? 'UTC' : ''} ·{' '}
                                  {q.source || 'USGS'} · {q.depth.toFixed(0)} km{' '}
                                  {t('prof.', 'deep', 'de prof.')}
                                  {geo
                                    ? ` · ${Math.round(distanceKm([geo.lat, geo.lng], [q.lat, q.lng]))} km ${t('de ti', 'away', 'de você')}`
                                    : ''}
                                </small>
                              </span>
                              <CaretRightIcon size={18} aria-hidden="true" />
                            </button>
                          ))}
                          {!results.length && (
                            <div className="fw-empty">
                              <MapPinIcon size={32} />
                              <h3>
                                {!live.online
                                  ? t('Sin conexión', 'Offline', 'Sem conexão')
                                  : live.busy
                                    ? `${t('Consultando', 'Checking', 'Consultando')} ${provider}…`
                                    : live.failed
                                      ? t(
                                          'No pudimos consultar la fuente',
                                          'Could not reach the source',
                                          'Não conseguimos consultar a fonte',
                                        )
                                      : t(
                                          'Sin registros en esta consulta',
                                          'No records in this query',
                                          'Sem registros nesta consulta',
                                        )}
                              </h3>
                              <p>
                                {!live.online
                                  ? t(
                                      'Cuando vuelva la conexión, intentaremos actualizar los datos. La ayuda y tus datos guardados siguen disponibles en esta página.',
                                      'When the connection returns, we will try to update. Help and your saved data remain available on this page.',
                                      'Quando a conexão voltar, vamos tentar atualizar os dados. A ajuda e seus dados salvos continuam disponíveis nesta página.',
                                    )
                                  : live.busy && !live.fetched
                                    ? t(
                                        'Esperando la respuesta de la fuente. Tras un sismo, los sitios oficiales pueden tardar más.',
                                        'Waiting for the source to respond. After an earthquake, official sites can be slower.',
                                        'Aguardando a resposta da fonte. Depois de um terremoto, os sites oficiais podem demorar mais.',
                                      )
                                    : live.failed
                                      ? t(
                                          'La consulta falló; esto no significa que no haya sismos. Puedes reintentar o elegir otra fuente.',
                                          'The request failed; this does not mean there are no earthquakes. Retry or choose another source.',
                                          'A consulta falhou; isso não significa que não haja terremotos. Você pode tentar de novo ou escolher outra fonte.',
                                        )
                                      : t(
                                          'Amplía el período o el área. La ausencia de registros no significa ausencia de peligro.',
                                          'Widen the period or area. No records does not mean no danger.',
                                          'Amplie o período ou a área. A ausência de registros não significa ausência de perigo.',
                                        )}
                              </p>
                              {(live.failed || stale || quietSince) && live.online && (
                                <div className="fw-empty-fallback">
                                  {alternatives.map((c) => (
                                    <button
                                      key={c}
                                      className="fw-primary"
                                      onClick={() => switchCatalog(c)}
                                    >
                                      {t('Ver', 'Use', 'Usar')} {providerNames[c]}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button
                                className="fw-secondary"
                                onClick={() => {
                                  setHours(24);
                                  setMinMag(0);
                                  setMaxDepth(800);
                                  setScope('country');
                                  setBounds(regionFor(country).bounds);
                                  setPage(1);
                                }}
                              >
                                {t('Restablecer filtros', 'Reset filters', 'Redefinir filtros')}
                              </button>
                            </div>
                          )}
                          <Pagination
                            lang={lang}
                            label={t(
                              'Páginas de sismos',
                              'Earthquake pages',
                              'Páginas de terremotos',
                            )}
                            current={listPage.current}
                            pages={listPage.pages}
                            onPage={(n) => {
                              setPage(n);
                              // The new page starts at the top of the list, with focus there.
                              const title = document.getElementById('fw-events-title');
                              title?.focus({ preventScroll: true });
                              title
                                ?.closest('.fw-events')
                                ?.scrollIntoView({ block: 'start', behavior: scrollMotion() });
                            }}
                          />
                        </div>
                      </section>
                      <div className="fw-disclaimer">
                        <InfoIcon size={18} />
                        <p>
                          {t(
                            'Faro muestra sismos que ya ocurrieron y fueron publicados. No es un sistema de alerta temprana y no identifica réplicas.',
                            'Faro shows earthquakes that already happened and were published. It is not an early warning system and does not identify aftershocks.',
                            'O Faro mostra terremotos que já aconteceram e foram publicados. Não é um sistema de alerta antecipado e não identifica réplicas.',
                          )}
                        </p>
                        <button onClick={() => setScreen('sources')}>
                          {t('Fuentes y cobertura', 'Sources & coverage', 'Fontes e cobertura')}
                        </button>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'tsunami',
                  label: t('Tsunami', 'Tsunami', 'Tsunami'),
                  content: (
                    <CoastalPanel
                      lang={lang}
                      geo={geo}
                      country={country}
                      data={tsunami.data}
                      failed={tsunami.failed}
                      busy={tsunami.busy}
                      online={live.online}
                      now={live.now}
                      onRefresh={() => void tsunami.refresh()}
                      onLocate={locate}
                      locating={geoState === 'pending'}
                      nws={inNws ? { data: nws.data, failed: nws.failed } : null}
                    />
                  ),
                },
                ...(inNhcRegion
                  ? [
                      {
                        id: 'storms',
                        label: t('Ciclones', 'Cyclones', 'Ciclones'),
                        // No count: storms active in the basin read as storms affecting the place,
                        // and the row may say none has an alert here. The tab explains both.
                        count: undefined,
                        content: (
                          <StormsPanel
                            lang={lang}
                            data={storms.data}
                            failed={storms.failed}
                            online={live.online}
                            now={live.now}
                            weather={destinationFor(country)?.weatherAgency}
                          />
                        ),
                      },
                    ]
                  : []),
                ...(inNws
                  ? [
                      {
                        id: 'nws',
                        label: t('Avisos NWS', 'NWS alerts', 'Avisos do NWS'),
                        content: (
                          <NwsPanel
                            lang={lang}
                            country={country}
                            data={nws.data}
                            failed={nws.failed}
                          />
                        ),
                      },
                    ]
                  : []),
                {
                  id: 'alerts',
                  label: t(
                    'Alertas internacionales',
                    'International alerts',
                    'Alertas internacionais',
                  ),
                  content: (
                    <AlertsPanel
                      lang={lang}
                      country={country}
                      countryName={countryName}
                      bounds={regionFor(country).bounds}
                      data={alerts.data}
                      failed={alerts.failed}
                      online={live.online}
                      now={live.now}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
        {screen === 'sources' && (
          <SourcesScreen lang={lang} now={live.now} countryName={countryName} rows={sourceRows} />
        )}
        {screen === 'emergency' && (
          <EmergencyScreen
            country={country}
            lang={lang}
            nationality={nationality}
            plan={plan}
            latest={latestEvent}
            latestStaleSince={live.fetched && stale ? live.fetched : undefined}
            alert={
              tsunamiAlert && (
                <TsunamiBanner
                  lang={lang}
                  now={live.now}
                  bulletin={tsunamiAlert}
                  lastData={tsunamiLastData}
                  onOpen={() => {
                    go('activity');
                    openTab('tsunami');
                  }}
                />
              )
            }
            provider={provider}
            now={live.now}
            onCountry={changeCountry}
            onNationality={rememberNationality}
            kind={emergencyKind}
            onKind={setEmergencyKind}
            start={emergencyStart}
            onGuide={(kind) => {
              setGuideTopic(
                kind === 'hurricane'
                  ? 'hurricane-during'
                  : kind === 'flood'
                    ? 'flood-during'
                    : 'during',
              );
              go('guide');
            }}
            onStatus={() => go('status')}
            onHelp={() => go('help')}
            onTrip={() => go('hotel')}
            onActivity={(section) => {
              go('activity');
              if (section === 'tsunami') openTab('tsunami');
            }}
          />
        )}
        {screen === 'help' && (
          <>
            <EmergencyNumbers country={country} lang={lang} />
            <EmbassyPanel
              onProfile={() => setScreen('hotel')}
              savedNationality={profile?.nationality ?? null}
              lang={lang}
              country={country}
              nationality={nationality}
              onNationalityChange={rememberNationality}
              onMap={(e: Embassy) => {
                setNationality(e.nation);
                setShowEmbassies(true);
                center(e.lat, e.lng, 14);
                setScreen('activity');
              }}
            />
            <NearbyCare key={country} country={country} lang={lang} />
            <OfflineMap lang={lang} {...offlineArea(visiblePoint)} />
            <DestinationInfo country={country} lang={lang} />
            <FamilyLinks country={country} lang={lang} onStatus={() => setScreen('status')} />
            {/* Shelters: who announces them, never a list Faro cannot verify. */}
            <div className="fw-help-summary">
              <FlagIcon size={29} aria-hidden="true" />
              <div>
                <h2>{t('Albergues', 'Shelters', 'Abrigos')}</h2>
                <p>
                  {civilProtection ? (
                    <>
                      {t(
                        `Los albergues abiertos los anuncia ${civilProtection.name}. Faro no los verifica; pregunta también en tu alojamiento.`,
                        `Open shelters are announced by ${civilProtection.name}. Faro does not verify them; also ask where you are staying.`,
                        `Quem anuncia os abrigos abertos: ${civilProtection.name}. O Faro não os verifica; pergunte também na sua hospedagem.`,
                      )}{' '}
                      <ExternalLink href={civilProtection.url}>
                        {t('Sitio oficial', 'Official website', 'Site oficial')}
                      </ExternalLink>
                    </>
                  ) : (
                    t(
                      'Faro no tiene datos verificados de albergues aquí. Pregunta a las autoridades locales o en tu alojamiento antes de desplazarte.',
                      'Faro has no verified shelter data here. Ask local authorities or where you are staying before you travel.',
                      'O Faro não tem dados verificados de abrigos aqui. Pergunte às autoridades locais ou na sua hospedagem antes de se deslocar.',
                    )
                  )}
                </p>
              </div>
              <button className="fw-secondary" onClick={() => setScreen('hotel')}>
                {t('Preparar mi plan', 'Prepare my plan', 'Preparar meu plano')}
              </button>
            </div>
            <details className="fw-local-directory">
              <summary>
                {t(
                  'Más recursos y preparación',
                  'More resources and preparedness',
                  'Mais recursos e preparação',
                )}
              </summary>
              <p className="fw-help-region">
                {t(
                  'Recursos para la región seleccionada',
                  'Resources for the selected region',
                  'Recursos para a região selecionada',
                )}
                : <strong>{countryName}</strong>.{' '}
                {t(
                  'Cambia el país en el buscador de arriba.',
                  'Change the country using the search above.',
                  'Altere o país na busca acima.',
                )}
              </p>
              <div className="fw-resource-grid">
                {regionResources.map((r) => (
                  <article key={r.url} className="fw-resource">
                    <span className="fw-eyebrow">{r.category[idx]}</span>
                    <h2>{r.name}</h2>
                    <p>{r.description[idx]}</p>
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {t('Sitio oficial', 'Official website', 'Site oficial')}
                      <ArrowUpRightIcon size={18} />
                    </a>
                    <small>
                      {r.name === 'USGS'
                        ? t(
                            'Consulta automática cada 60 s',
                            'Checked automatically every 60 s',
                            'Consulta automática a cada 60 s',
                          )
                        : `${t('Datos revisados', 'Information reviewed', 'Dados revisados')}: ${new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(r.reviewedAt + 'T12:00:00Z'))}`}
                    </small>
                  </article>
                ))}
              </div>
              <div className="fw-note">
                <UsersThreeIcon size={24} />
                <div>
                  <h3>{t('Voluntariado', 'Volunteering', 'Voluntariado')}</h3>
                  <p>
                    {t(
                      'Sin convocatorias verificadas. Consulta la disponibilidad y los requisitos con la universidad o el municipio.',
                      'No verified openings. Contact the university or municipality for availability and requirements.',
                      'Sem chamadas verificadas. Consulte a disponibilidade e os requisitos com a universidade ou o município.',
                    )}
                  </p>
                </div>
              </div>
            </details>
          </>
        )}
        {screen === 'hotel' && (
          <>
            <TripProfile
              lang={lang}
              country={country}
              countryCodes={countryCodes}
              profile={profile}
              plan={plan}
              geo={geo}
              onSave={saveTrip}
              onDeleteAll={deleteTrip}
            />
            <OfflineMap lang={lang} {...offlineArea(point)} />
            <TravelContacts key={country} country={country} lang={lang} />
            <EvacuationPlan country={country} lang={lang} />
            <LocalDataInfo lang={lang} />
          </>
        )}
        {screen === 'kit' && <EmergencyKit lang={lang} country={country} />}
        {screen === 'guide' && (
          <SafetyGuide
            lang={lang}
            country={country}
            topic={guideTopic}
            onHotel={() => setScreen('hotel')}
            onStatus={() => setScreen('status')}
            onKit={() => setScreen('kit')}
          />
        )}
        <div hidden={screen !== 'status'}>
          <TravelerStatus
            countryAt={borders?.countryOnLand}
            profile={profile}
            plan={plan}
            events={results.slice(0, 10)}
            location={geo}
            lang={lang}
            history={checkIns}
            onHistory={setCheckIns}
            now={live.now}
            onHelp={() => openEmergency('call')}
            country={country}
          />
        </div>
        <footer className="fw-footer">
          <span>
            Faro · {t('Creado por', 'Created by', 'Criado por')}{' '}
            <a href="https://oktsec.com" target="_blank" rel="noopener">
              Oktsec
            </a>{' '}
            · <a href="/about.html">{t('Acerca de Faro', 'About Faro', 'Sobre o Faro')}</a> ·{' '}
            <a href="/privacy.html">
              {t('Privacidad y condiciones', 'Privacy and terms', 'Privacidade e termos')}
            </a>{' '}
            ·{' '}
            <button className="fw-footer-link" onClick={() => setScreen('sources')}>
              {t('Fuentes y actualización', 'Sources & updates', 'Fontes e atualizações')}
            </button>
            {offlineReady && (
              <>
                {' '}
                ·{' '}
                <span className="fw-offline-ready">
                  {t(
                    'Disponible sin conexión en este dispositivo',
                    'Available offline on this device',
                    'Disponível sem conexão neste dispositivo',
                  )}
                </span>
              </>
            )}
          </span>
          <span>
            {screen === 'status'
              ? t(
                  'Mensajes personales · Envío manual',
                  'Personal messages · Sent manually',
                  'Mensagens pessoais · Envio manual',
                )
              : screen === 'guide'
                ? t(
                    'Recomendaciones: SENAPRED, CDC, NOAA, Ready.gov y FCC',
                    'Guidance: SENAPRED, CDC, NOAA, Ready.gov and FCC',
                    'Recomendações: SENAPRED, CDC, NOAA, Ready.gov e FCC',
                  )
                : t(
                    'Sismos: IGC-UP / EMSC / USGS · Tsunami y ciclones: NOAA · Avisos: servicios meteorológicos y GDACS · Mapa: OpenStreetMap',
                    'Earthquakes: IGC-UP / EMSC / USGS · Tsunami and cyclones: NOAA · Warnings: weather services and GDACS · Map: OpenStreetMap',
                    'Terremotos: IGC-UP / EMSC / USGS · Tsunami e ciclones: NOAA · Avisos: serviços meteorológicos e GDACS · Mapa: OpenStreetMap',
                  )}
          </span>
        </footer>
      </main>

      <InformationDialog
        open={!!detail}
        selected={selected}
        geo={geo}
        lang={lang}
        provider={provider}
        fetched={live.fetched}
        generated={live.generated}
        onClose={() => setDetail(null)}
        onMap={showEpicentre}
        onTsunami={() => {
          setDetail(null);
          go('activity');
          openTab('tsunami');
        }}
      />
    </div>
  );
}
