import InstallFaro from './components/InstallFaro.tsx';
import NearbyCare from './components/NearbyCare.tsx';
import EvacuationPlan from './components/EvacuationPlan.tsx';
import MagnitudeLegend from './components/MagnitudeLegend.tsx';
import CountryScreen from './components/CountryScreen.tsx';
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
  CrosshairIcon,
  BookOpenTextIcon,
  UsersThreeIcon,
  XIcon,
  BackpackIcon,
  ChatCircleTextIcon,
  WifiSlashIcon,
  PulseIcon,
  SuitcaseRollingIcon,
  DatabaseIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react';
import {
  displayPlace,
  distanceKm,
  filterEvents,
  placeLang,
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
import { ageLabel } from './lib/feedUpdates.ts';
import { confirmFresh, earthquakeSummary, gdacsStatus, tsunamiStatus } from './lib/hazards.ts';
import SituationBriefing from './components/SituationBriefing.tsx';
import { destinationFor } from './data/destinations/index.ts';
import { classifyBulletins, parseTsunamiData, reviveTsunami } from './lib/tsunami.ts';
import { receivedAt } from './lib/http.ts';
import { scrollMotion } from './lib/motion.ts';
import { NHC_REGION, graphicsUrl, parseStorms, stormClassLabels, wind } from './lib/storms.ts';
import { distance, shortDistance } from './lib/units.ts';
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
import TravelerStatus from './components/TravelerStatus.tsx';
import TravelContacts from './components/TravelContacts.tsx';
import EmergencyNumbers from './components/EmergencyNumbers.tsx';
import ResponsePanel from './components/ResponsePanel.tsx';
import HomeActions, { HomeCall } from './components/HomeActions.tsx';
import HomeTabs from './components/HomeTabs.tsx';
import {
  Actions,
  AppFrame,
  BackLink,
  Badge,
  Button,
  Header,
  List,
  ListRow,
  Magnitude,
  MapFrame,
  Note,
  OutLink,
  ScopeNote,
  ScreenHead,
  Section,
  Segmented,
  SelectField,
  Sidebar,
  SourceStamp,
  StatusBar,
  TabBar,
  Text,
  type Tab,
} from './ui/index.ts';
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
const SCREENS = [
  'activity',
  'country',
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
// "em" + the country's article in Portuguese, for the earthquake page title.
const PT_IN: Record<string, string> = Object.fromEntries(
  Object.entries({
    no: ['PA', 'MX', 'PE', 'EC', 'CL', 'BR', 'PY', 'UY', 'CA', 'JP'],
    na: ['AR', 'CO', 'CR', 'GT', 'NI', 'VE', 'BO', 'DO', 'JM'],
    nos: ['US'],
    em: ['HN', 'SV', 'CU', 'PR', 'PT'],
  }).flatMap(([prep, codes]) => codes.map((code) => [code, prep])),
);
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
  // Setup never blocks the app: the nationality is asked once, from the embassy row.
  const [profileFeedback, setProfileFeedback] = useState<'saved' | 'deleted' | 'storage' | null>(
    null,
  );
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
  const appRef = useRef<HTMLElement>(null);
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
  // A new screen starts at the top; going back returns to where the person was on that screen.
  // After the first render, focus moves to its heading so keyboard and screen-reader users know
  // the screen changed (Emergency focuses its call button and the detail page its tab instead).
  // Each screen is a browser history entry, so the phone's Back button returns to the previous
  // screen instead of leaving Faro (people often arrive from a link in a chat).
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const fromHistory = useRef(false);
  const restoring = useRef(false);
  const scrollMemory = useRef<Partial<Record<Screen, number>>>({});
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const remember = () => (scrollMemory.current[screenRef.current] = app.scrollTop);
    app.addEventListener('scroll', remember, { passive: true });
    return () => app.removeEventListener('scroll', remember);
  }, []);
  // An open earthquake sheet is a history entry of its own: Back closes the sheet and leaves the
  // list, its filters and position as they were.
  const sheetOpen = useRef(false);
  sheetOpen.current = !!detail;
  useEffect(() => {
    if (detail && !(history.state as { faroSheet?: boolean } | null)?.faroSheet)
      history.pushState({ faroScreen: screenRef.current, faroSheet: true }, '');
  }, [detail]);
  const closeSheet = () => {
    if ((history.state as { faroSheet?: boolean } | null)?.faroSheet) history.back();
    else setDetail(null);
  };
  useEffect(() => {
    // A reload while a sheet was open starts without the sheet.
    history.replaceState(
      { ...(history.state ?? {}), faroScreen: screenRef.current, faroSheet: false },
      '',
    );
    const back = (e: PopStateEvent) => {
      const entry = e.state as { faroScreen?: unknown; faroSheet?: boolean } | null;
      // A sheet entry left behind (the sheet was closed by moving to the map) is skipped.
      if (entry?.faroSheet && !sheetOpen.current) {
        history.back();
        return;
      }
      const target = entry?.faroScreen;
      const next = isScreen(target) ? target : 'activity';
      if (sheetOpen.current && next === screenRef.current) {
        setDetail(null);
        return;
      }
      if (next === screenRef.current) return;
      fromHistory.current = true;
      restoring.current = true;
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
    const top = restoring.current ? (scrollMemory.current[screen] ?? 0) : 0;
    restoring.current = false;
    // Content can arrive a moment later (lists, the map): restore again on the next frame.
    appRef.current?.scrollTo({ top, left: 0, behavior: 'instant' });
    if (top) requestAnimationFrame(() => appRef.current?.scrollTo({ top, behavior: 'instant' }));
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
  // A country found from the location takes the person back to where they were; a failure stays
  // on the country screen until they act, as messages that ask for an action must.
  useEffect(() => {
    if (placeState?.kind !== 'found') return;
    if (screenRef.current === 'country') history.back();
    setPlaceState(null);
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
  // The language is stored only when the person chooses it.
  const changeLanguage = (value: Lang) => {
    setLang(value);
    try {
      writeLocal('faro-lang', value);
    } catch {
      setProfileFeedback('storage');
    }
  };
  // A nationality chosen on the emergency or local help screen is kept, without moving the country
  // being viewed or changing the rest of the profile.
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
    // On the same screen the sheet's history entry goes with it; from another screen, Back skips it.
    if (screenRef.current === 'activity') closeSheet();
    else setDetail(null);
    setFocused(q.id);
    center(q.lat, q.lng, 9);
    setScreen('activity');
    setTimeout(
      () =>
        appRef.current
          ?.querySelector('.f-map-block')
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
          ? `${t('Viento máx.', 'Max. wind', 'Vento máx.')} ${wind(st.intensityKt, lang)}`
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
    ? {
        agency: national.data!.agency,
        rowId: officialRowId('w', firstFloodWarning.id),
        event: firstFloodWarning.event,
        severity: firstFloodWarning.severity,
      }
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
                    // Portuguese contracts "em" with the country's article ("no Panamá", "na
                    // Colômbia"); a country not listed keeps the neutral form.
                    PT_IN[country]
                      ? `Terremotos ${PT_IN[country]} ${countryName}`
                      : `Terremotos · ${countryName}`,
                  ),
                  t(
                    'Cada sismo como lo publica la fuente elegida, con filtros y por páginas.',
                    'Each earthquake as the selected source publishes it, with filters and pages.',
                    'Cada terremoto como a fonte escolhida o publica, com filtros e por páginas.',
                  ),
                ],
    // The same word as its menu entry.
    sources: [
      t('Fuentes', 'Sources', 'Fontes'),
      t(
        'De dónde viene cada dato, cuándo se consultó por última vez y qué cubre.',
        'Where each piece of data comes from, when it was last checked and what it covers.',
        'De onde vem cada dado, quando foi consultado pela última vez e o que cobre.',
      ),
    ],
    country: [t('País', 'Country', 'País'), ''],
    emergency: [
      t('Emergencia', 'Emergency', 'Emergência'),
      t(
        'Al tocar un número se abre tu teléfono. Faro no llama ni pide ayuda por ti.',
        'Tapping a number opens your phone. Faro does not call or request help for you.',
        'Tocar em um número abre o seu telefone. O Faro não liga nem pede ajuda por você.',
      ),
    ],
    help: [
      t('Ayuda', 'Help', 'Ajuda'),
      t(
        'Teléfonos de emergencia, farmacias y hospitales, fuentes oficiales y tu embajada.',
        'Emergency numbers, pharmacies and hospitals, official sources and your embassy.',
        'Telefones de emergência, farmácias e hospitais, fontes oficiais e sua embaixada.',
      ),
    ],
    status: [
      t('Avisar', 'Check in', 'Avisar'),
      t(
        'Prepara un mensaje para tu familia o tu equipo: cómo estás, dónde y cuándo volverás a escribir.',
        'Prepare a message for your family or team: how you are, where, and when you will write again.',
        'Prepare uma mensagem para sua família ou sua equipe: como você está, onde e quando vai escrever de novo.',
      ),
    ],
    kit: [
      t('Mochila', 'Go bag', 'Mochila'),
      t(
        'Calcula tu reserva, marca lo que ya tienes y encuentra dónde comprar lo que falta.',
        'Work out your supplies, tick what you have and find where to buy what is missing.',
        'Calcule sua reserva, marque o que você já tem e encontre onde comprar o que falta.',
      ),
    ],
    hotel: [
      t('Viaje', 'Trip', 'Viagem'),
      t(
        'Tus datos para una emergencia, listos para enviar por WhatsApp, Telegram, SMS o correo. Todo es opcional.',
        'Your details for an emergency, ready to send by WhatsApp, Telegram, SMS or email. Everything is optional.',
        'Seus dados para uma emergência, prontos para enviar por WhatsApp, Telegram, SMS ou e-mail. Tudo é opcional.',
      ),
    ],
    guide: [
      t('Guía', 'Guide', 'Guia'),
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
  // One word per destination; each screen's title is the same word.
  const nav: readonly Tab<Screen>[] = [
    { id: 'activity', label: t('Situación', 'Situation', 'Situação'), Icon: PulseIcon },
    { id: 'help', label: t('Ayuda', 'Help', 'Ajuda'), Icon: UsersThreeIcon },
    { id: 'status', label: t('Avisar', 'Check in', 'Avisar'), Icon: ChatCircleTextIcon },
    { id: 'kit', label: t('Mochila', 'Go bag', 'Mochila'), Icon: BackpackIcon },
    { id: 'hotel', label: t('Viaje', 'Trip', 'Viagem'), Icon: SuitcaseRollingIcon },
    { id: 'guide', label: t('Guía', 'Guide', 'Guia'), Icon: BookOpenTextIcon },
  ];
  // The detail pages belong to Situación; the country screen to wherever it was opened from.
  const currentTab: Screen | null =
    screen === 'detail' ? 'activity' : nav.some((n) => n.id === screen) ? screen : null;
  const shellText = {
    home: t('Faro, inicio', 'Faro, home', 'Faro, início'),
    place: t(
      `Cambiar de país: ${countryName}`,
      `Change country: ${countryName}`,
      `Mudar de país: ${countryName}`,
    ),
    language: t('Idioma', 'Language', 'Idioma'),
    emergency: t('Emergencia', 'Emergency', 'Emergência'),
    menu: t('Navegación principal', 'Main navigation', 'Navegação principal'),
  };
  const frame = {
    text: shellText,
    placeName: countryName,
    lang,
    onHome: () => setScreen('activity'),
    onPlace: () => setScreen('country'),
    onLanguage: changeLanguage,
    onEmergency: () => openEmergency('call'),
    emergencyCurrent: screen === 'emergency',
  };
  // What "Use my location" found or why it could not, said on the country screen.
  const locateStatus =
    placeState && placeState.kind !== 'pending' && placeState.kind !== 'found'
      ? placeState.kind === 'denied'
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
            )
      : undefined;
  return (
    <AppFrame>
      <a className="f-skip" href="#main">
        {t('Saltar al contenido', 'Skip to content', 'Pular para o conteúdo')}
      </a>
      <Sidebar
        {...frame}
        tabs={nav}
        current={currentTab}
        onSelect={setScreen}
        label={shellText.menu}
        foot={
          <>
            <button
              type="button"
              className="f-side-link"
              aria-current={screen === 'sources' ? 'page' : undefined}
              onClick={() => setScreen('sources')}
            >
              <DatabaseIcon size={20} aria-hidden="true" />
              {t('Fuentes', 'Sources', 'Fontes')}
            </button>
            <a className="f-side-link" href="/privacy.html">
              <ShieldCheckIcon size={20} aria-hidden="true" />
              {t('Privacidad', 'Privacy', 'Privacidade')}
            </a>
          </>
        }
      />
      <Header {...frame} />
      {!live.online && (
        <StatusBar>
          <WifiSlashIcon size={16} aria-hidden="true" />
          {live.fetched
            ? t(
                `Sin conexión · datos de ${atLabel(live.fetched, live.now, lang)}`,
                `Offline · data from ${atLabel(live.fetched, live.now, lang)}`,
                `Sem conexão · dados de ${atLabel(live.fetched, live.now, lang)}`,
              )
            : t(
                'Sin conexión · los números y la guía funcionan',
                'Offline · numbers and guidance still work',
                'Sem conexão · números e guia funcionam',
              )}
        </StatusBar>
      )}
      {/* The scrolling region keeps the older screens' classes while they move to the design system. */}
      <main id="main" className="f-content fw-app" ref={appRef} data-screen={screen}>
        <div className="f-page fw-main" data-screen={screen}>
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
          {screen !== 'activity' && screen !== 'emergency' && screen !== 'country' && (
            <div className="f-stack" data-gap="sm" data-head="">
              {screen === 'detail' && (
                <BackLink onClick={() => setScreen('activity')}>
                  {t('Situación', 'Situation', 'Situação')}
                </BackLink>
              )}
              {/* Sources opens from several screens: back returns to the one it came from. */}
              {screen === 'sources' && (
                <BackLink onClick={() => history.back()}>{t('Volver', 'Back', 'Voltar')}</BackLink>
              )}
              <ScreenHead title={headings[screen][0]} lead={headings[screen][1]} />
            </div>
          )}
          {/* Location matters where distances are shown: the earthquake list and local help. */}
          {((screen === 'detail' && homeTab === 'quakes') || screen === 'help' || tracking) &&
            geoState !== 'idle' && (
              <Note>
                <span>
                  {geo
                    ? `${t('Precisión aproximada', 'Approximate accuracy', 'Precisão aproximada')}: ${shortDistance(geo.accuracy, lang)} · ${t('Ubicación', 'Location', 'Localização')}: ${shortTime(geo.at)}`
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
                  <>
                    {' '}
                    <button type="button" className="f-inline-link" onClick={stopLocation}>
                      {t('Detener ubicación', 'Stop location', 'Parar localização')}
                    </button>
                  </>
                )}
              </Note>
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
                        ? `${periodLabel} ${t(`a ${distance(radius, lang)}`, `within ${distance(radius, lang)}`, `a ${distance(radius, lang)}`)}`
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
                onSources={() => go('sources', '#fw-sources-read')}
                call={
                  <HomeCall
                    lang={lang}
                    country={country}
                    onEmergency={() => openEmergency('call')}
                  />
                }
                actions={
                  <HomeActions
                    lang={lang}
                    country={country}
                    onEmergency={() => openEmergency('call')}
                    onSteps={() => openEmergency('steps')}
                    onStatus={() => setScreen('status')}
                    onEmbassy={() => setScreen('help')}
                    nationalityName={
                      profile?.nationality || nationality
                        ? names.of(profile?.nationality || nationality)
                        : undefined
                    }
                  />
                }
                map={
                  <div className="f-stack" data-gap="lg">
                    <div className="f-stack" data-gap="sm">
                      {/* The map's markers are focusable; keyboard users can pass them in one step. */}
                      <a className="f-skip" href="#fw-map-foot">
                        {t('Saltar el mapa', 'Skip the map', 'Pular o mapa')}
                      </a>
                      <MapFrame>
                        <WebMap
                          cooperative
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
                      </MapFrame>
                      <div id="fw-map-foot" tabIndex={-1} className="f-stack" data-gap="sm">
                        {(availableEmbassy || dirty) && (
                          <div className="f-actions">
                            {dirty && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBounds(pending);
                                  setScope('area');
                                  setPage(1);
                                }}
                              >
                                {t('Buscar en esta área', 'Search this area', 'Buscar nesta área')}
                              </button>
                            )}
                            {availableEmbassy && (
                              <button
                                type="button"
                                aria-pressed={showEmbassies}
                                onClick={() => setShowEmbassies((v) => !v)}
                              >
                                {showEmbassies
                                  ? t(
                                      'Ocultar mi embajada',
                                      'Hide my embassy',
                                      'Ocultar minha embaixada',
                                    )
                                  : t(
                                      'Mostrar mi embajada',
                                      'Show my embassy',
                                      'Mostrar minha embaixada',
                                    )}
                              </button>
                            )}
                          </div>
                        )}
                        <Note>
                          {[
                            t(
                              'Puntos publicados, no zonas de riesgo',
                              'Published points, not hazard zones',
                              'Pontos publicados, não zonas de risco',
                            ),
                            t('marcador: magnitud', 'pin: magnitude', 'marcador: magnitude'),
                            t('línea morada: placas', 'purple line: plates', 'linha roxa: placas'),
                            mapHazards.length > 0
                              ? t(
                                  'ícono redondo: GDACS',
                                  'round icon: GDACS',
                                  'ícone redondo: GDACS',
                                )
                              : '',
                            warningAreas.length > 0
                              ? t(
                                  `sombreado: aviso de ${national.data!.agency}`,
                                  `shaded: ${national.data!.agency} warning`,
                                  `sombreado: aviso do ${national.data!.agency}`,
                                )
                              : '',
                            visiblePoint
                              ? t(
                                  'bandera: punto personal no verificado',
                                  'flag: unverified personal point',
                                  'bandeira: ponto pessoal não verificado',
                                )
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Note>
                      </div>
                    </div>
                    {/* Wide screens have room for the latest earthquakes beside the hazards. */}
                    {results.length > 0 && (
                      <div className="f-when-split">
                        <Section
                          id="fw-latest"
                          title={t('Últimos sismos', 'Latest earthquakes', 'Últimos terremotos')}
                          aside={provider}
                        >
                          <List>
                            {[...results]
                              .sort((a, b) => b.time - a.time)
                              .slice(0, 5)
                              .map((q) => (
                                <ListRow
                                  key={q.id}
                                  lead={<Magnitude value={q.mag} />}
                                  title={displayPlace(q.place)}
                                  meta={`${shortTime(q.time)} · ${distance(q.depth, lang)} ${t('de prof.', 'deep', 'de prof.')}`}
                                  onClick={() => setDetail(q.id)}
                                />
                              ))}
                          </List>
                        </Section>
                      </div>
                    )}
                  </div>
                }
                response={
                  responsesFor(country, live.now).length > 0 ? (
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
                  ) : undefined
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
            <div className="f-column">
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
                    // Nor from a quiet catalogue: its newest record is over a day old.
                    count:
                      (live.checked || live.fetched) && !stale && !(quietSince && !results.length)
                        ? results.length
                        : undefined,
                    content: (
                      <div className="f-stack" data-gap="lg" id="sismos">
                        <LiveActivity
                          events={results}
                          updates={live.updates.filter((u) =>
                            results.some((e) => e.id === u.event.id),
                          )}
                          provider={provider}
                          catalog={catalog}
                          lang={lang}
                          now={live.now}
                          checked={live.checked}
                          busy={live.busy}
                          online={live.online}
                          stale={stale}
                          onRefresh={() => void live.refresh()}
                          onDetails={(q) => setDetail(q.id)}
                          onMap={showEpicentre}
                          onHistory={() => go('sources', '#fw-sources-updates')}
                          filters={{
                            summary: [
                              catalog,
                              hours === 168 ? t('7 días', '7 days', '7 dias') : `${hours}\u00a0h`,
                              minMag
                                ? `${t('Magnitud', 'Magnitude', 'Magnitude')} ≥\u00a0${minMag}`
                                : t(
                                    'Todas las magnitudes',
                                    'All magnitudes',
                                    'Todas as magnitudes',
                                  ),
                              maxDepth < 800 ? `≤\u00a0${distance(maxDepth, lang)}` : '',
                              scope === 'nearby' ? distance(radius, lang) : '',
                            ]
                              .filter(Boolean)
                              .join(' · ')
                              .replace(/(\d) (km|mi)\b/g, '$1\u00a0$2'),
                            content: (
                              <>
                                <SelectField
                                  id="fw-filter-catalog"
                                  label={t('Fuente', 'Source', 'Fonte')}
                                  value={catalog}
                                  onChange={(e) => switchCatalog(e.target.value as CatalogId)}
                                >
                                  {country === 'PA' && (
                                    <option value="IGC">IGC · UP · Panamá</option>
                                  )}
                                  <option value="EMSC">
                                    EMSC · {t('Mundo, M2.5+', 'Worldwide, M2.5+', 'Mundo, M2.5+')}
                                  </option>
                                  <option value="USGS">
                                    USGS · {t('Mundo', 'Worldwide', 'Mundo')}
                                  </option>
                                </SelectField>
                                <SelectField
                                  id="fw-filter-period"
                                  label={t('Período', 'Period', 'Período')}
                                  value={hours}
                                  onChange={(e) => {
                                    setHours(+e.target.value);
                                    setPage(1);
                                  }}
                                >
                                  <option value={1}>{t('1 hora', '1 hour', '1 hora')}</option>
                                  <option value={24}>
                                    {t('24 horas', '24 hours', '24 horas')}
                                  </option>
                                  <option value={168}>{t('7 días', '7 days', '7 dias')}</option>
                                </SelectField>
                                <SelectField
                                  id="fw-filter-magnitude"
                                  label={t('Magnitud', 'Magnitude', 'Magnitude')}
                                  value={minMag}
                                  onChange={(e) => setMinMag(+e.target.value)}
                                >
                                  <option value={0}>{t('Todas', 'All', 'Todas')}</option>
                                  {[2.5, 4, 5, 6].map((m) => (
                                    <option key={m} value={m}>
                                      ≥ {m}
                                    </option>
                                  ))}
                                </SelectField>
                                <SelectField
                                  id="fw-filter-zone"
                                  label={t('Zona horaria', 'Time zone', 'Fuso horário')}
                                  value={timeZone}
                                  onChange={(e) => setTimeZone(e.target.value as 'local' | 'utc')}
                                >
                                  <option value="local">
                                    {/* The offset, never an identifier like America/Panama. */}
                                    {(() => {
                                      const offset =
                                        new Intl.DateTimeFormat(lang, {
                                          timeZoneName: 'shortOffset',
                                        })
                                          .formatToParts(live.now)
                                          .find((part) => part.type === 'timeZoneName')?.value ??
                                        '';
                                      return t(
                                        `Hora local (${offset})`,
                                        `Local time (${offset})`,
                                        `Hora local (${offset})`,
                                      );
                                    })()}
                                  </option>
                                  <option value="utc">UTC</option>
                                </SelectField>
                                <SelectField
                                  id="fw-filter-depth"
                                  label={t('Profundidad', 'Depth', 'Profundidade')}
                                  value={maxDepth}
                                  onChange={(e) => setMaxDepth(+e.target.value)}
                                >
                                  <option value={800}>{t('Todas', 'All', 'Todas')}</option>
                                  <option value={70}>≤ {distance(70, lang)}</option>
                                  <option value={30}>≤ {distance(30, lang)}</option>
                                </SelectField>
                                {geo && (
                                  <SelectField
                                    id="fw-filter-area"
                                    label={t('Área', 'Area', 'Área')}
                                    value={scope === 'nearby' ? radius : 0}
                                    onChange={(e) => {
                                      setScope(+e.target.value ? 'nearby' : 'area');
                                      if (+e.target.value) setRadius(+e.target.value);
                                    }}
                                  >
                                    <option value={0}>
                                      {t('Área seleccionada', 'Selected area', 'Área selecionada')}
                                    </option>
                                    {[50, 100, 300, 500].map((k) => (
                                      <option key={k} value={k}>
                                        {distance(k, lang)} ·{' '}
                                        {t('cerca de mí', 'near me', 'perto de mim')}
                                      </option>
                                    ))}
                                  </SelectField>
                                )}
                                <Button
                                  variant="secondary"
                                  icon={<CrosshairIcon size={18} aria-hidden="true" />}
                                  onClick={locate}
                                  disabled={geoState === 'pending'}
                                >
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
                                </Button>
                                <p className="f-caption">
                                  {t(
                                    'La ubicación es opcional y requiere tu permiso.',
                                    'Location is optional and requires your permission.',
                                    'A localização é opcional e precisa da sua permissão.',
                                  )}
                                </p>
                                <Actions>
                                  <button type="button" onClick={() => go('sources')}>
                                    {t(
                                      'Fuentes y cobertura',
                                      'Sources & coverage',
                                      'Fontes e cobertura',
                                    )}
                                  </button>
                                </Actions>
                              </>
                            ),
                          }}
                        >
                          {/* A source that answers but whose newest record is more than a day
                            old: said with its date, with the other catalogs one tap away. Never
                            read as "no earthquakes". */}
                          {!stale && quietSince && live.online && (
                            <div className="f-stack" data-gap="sm" role="status">
                              <SourceStamp state="stale">
                                {t(
                                  `El registro más reciente de ${provider} es del ${stamp(quietSince)}. Otras fuentes pueden tener datos más nuevos:`,
                                  `${provider}'s most recent record is from ${stamp(quietSince)}. Other sources may have newer data:`,
                                  `O registro mais recente de ${provider} é de ${stamp(quietSince)}. Outras fontes podem ter dados mais novos:`,
                                )}
                              </SourceStamp>
                              <Actions>
                                {alternatives.map((c) => (
                                  <button key={c} type="button" onClick={() => switchCatalog(c)}>
                                    {providerNames[c]}
                                  </button>
                                ))}
                              </Actions>
                            </div>
                          )}
                          {/* Offline is already said by the bar above; this is for a failing
                            source. */}
                          {stale && live.online && (
                            <div className="f-stack" data-gap="sm" role="status">
                              <SourceStamp state="stale">
                                {t(
                                  'No hay una actualización reciente. Estos registros pueden estar desactualizados.',
                                  'No recent update. These records may be out of date.',
                                  'Não há uma atualização recente. Estes registros podem estar desatualizados.',
                                )}{' '}
                                {live.fetched
                                  ? `${t('Última consulta correcta', 'Last successful check', 'Última consulta bem-sucedida')}: ${stamp(live.fetched)}.`
                                  : t(
                                      'Todavía no se recibieron datos.',
                                      'No data received yet.',
                                      'Ainda não foram recebidos dados.',
                                    )}{' '}
                                {t(
                                  'Mientras tanto, consulta otra fuente:',
                                  'Meanwhile, check another source:',
                                  'Enquanto isso, consulte outra fonte:',
                                )}
                              </SourceStamp>
                              <Actions>
                                {alternatives.map((c) => (
                                  <button key={c} type="button" onClick={() => switchCatalog(c)}>
                                    {providerNames[c]}
                                  </button>
                                ))}
                                <button type="button" onClick={() => void live.refresh()}>
                                  {t('Reintentar', 'Retry', 'Tentar de novo')}
                                </button>
                              </Actions>
                            </div>
                          )}
                        </LiveActivity>
                        <section
                          className="f-section"
                          id="fw-events"
                          aria-labelledby="fw-events-title"
                        >
                          <div className="f-section-head">
                            <h2 className="f-section-title" id="fw-events-title" tabIndex={-1}>
                              {/* No count before the catalog has answered: "0" would read as none. */}
                              {!live.fetched || (quietSince && !results.length)
                                ? t('Sismos', 'Earthquakes', 'Terremotos')
                                : `${results.length}\u00a0${
                                    results.length === 1
                                      ? t('sismo', 'earthquake', 'terremoto')
                                      : t('sismos', 'earthquakes', 'terremotos')
                                  }`}
                            </h2>
                            {listPage.pages > 1 && (
                              <span className="f-section-aside">
                                {t(
                                  `Mostrando\u00a0${listPage.start + 1}–${listPage.end}`,
                                  `Showing\u00a0${listPage.start + 1}–${listPage.end}`,
                                  `Mostrando\u00a0${listPage.start + 1}–${listPage.end}`,
                                )}
                              </span>
                            )}
                          </div>
                          <Segmented
                            block
                            label={t('Ordenar eventos', 'Sort events', 'Ordenar eventos')}
                            value={order}
                            onChange={setOrder}
                            options={[
                              {
                                value: 'time',
                                label: t('Más recientes', 'Most recent', 'Mais recentes'),
                              },
                              {
                                value: 'magnitude',
                                label: t('Mayor magnitud', 'Largest magnitude', 'Maior magnitude'),
                              },
                              ...(geo
                                ? [
                                    {
                                      value: 'distance',
                                      label: t('Más cercanos', 'Nearest', 'Mais próximos'),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                          <div role="status">
                            <Note>
                              {scope === 'country' && hasBorders(country)
                                ? t(
                                    `${countryName} y hasta 100 km mar adentro. Límites aproximados.`,
                                    `${countryName} and up to ${distance(100, lang)} offshore. Approximate boundaries.`,
                                    `${countryName} e até 100 km mar adentro. Limites aproximados.`,
                                  )
                                : scope === 'nearby'
                                  ? t(
                                      `Sismos a menos de ${radius} km de tu ubicación.`,
                                      `Earthquakes within ${distance(radius, lang)} of your location.`,
                                      `Terremotos a menos de ${radius} km da sua localização.`,
                                    )
                                  : scope === 'area'
                                    ? t(
                                        'Área del mapa: incluye todos los países visibles.',
                                        'Map area: includes all visible countries.',
                                        'Área do mapa: inclui todos os países visíveis.',
                                      )
                                    : regionScope(country, lang)}
                            </Note>
                          </div>
                          {results.length > 0 ? (
                            <List
                              label={t('Lista de sismos', 'Earthquake list', 'Lista de terremotos')}
                            >
                              {results.slice(listPage.start, listPage.end).map((q) => (
                                <ListRow
                                  key={q.id}
                                  lead={
                                    <>
                                      <Magnitude value={q.mag} />
                                      <span className="f-visually-hidden">
                                        {t('Magnitud', 'Magnitude', 'Magnitude')}
                                      </span>
                                    </>
                                  }
                                  title={<span lang={placeLang(q)}>{displayPlace(q.place)}</span>}
                                  badge={
                                    newIds.has(q.id) ? (
                                      <Badge>
                                        {t(
                                          'Recibido recientemente',
                                          'Recently received',
                                          'Recebido recentemente',
                                        )}
                                      </Badge>
                                    ) : undefined
                                  }
                                  // When it happened, how deep, and how far when the location is on.
                                  // Local time reads as "10 min ago"; UTC as the published clock.
                                  meta={
                                    <>
                                      <time
                                        dateTime={new Date(q.time).toISOString()}
                                        title={shortTime(q.time)}
                                      >
                                        {timeZone === 'utc'
                                          ? `${shortTime(q.time)} UTC`
                                          : ageLabel(q.time, live.now, lang).replace(
                                              /(\d) /g,
                                              '$1\u00a0',
                                            )}
                                      </time>
                                      {' · '}
                                      {distance(q.depth, lang).replace(' ', '\u00a0')}{' '}
                                      {t('de prof.', 'deep', 'de prof.')}
                                      {geo
                                        ? ` · ${distance(distanceKm([geo.lat, geo.lng], [q.lat, q.lng]), lang).replace(' ', '\u00a0')} ${t('de ti', 'away', 'de você')}`
                                        : ''}
                                    </>
                                  }
                                  onClick={() => setDetail(q.id)}
                                />
                              ))}
                            </List>
                          ) : (
                            <div className="f-stack" data-gap="sm">
                              <h3 className="f-subhead">
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
                              <div className="f-prose">
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
                              </div>
                              <Actions>
                                {(live.failed || stale || quietSince) &&
                                  live.online &&
                                  alternatives.map((c) => (
                                    <button key={c} type="button" onClick={() => switchCatalog(c)}>
                                      {t('Ver', 'Use', 'Usar')} {providerNames[c]}
                                    </button>
                                  ))}
                                <button
                                  type="button"
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
                              </Actions>
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
                              document
                                .getElementById('fw-events-title')
                                ?.focus({ preventScroll: true });
                              document
                                .getElementById('fw-events')
                                ?.scrollIntoView({ block: 'start', behavior: scrollMotion() });
                            }}
                          />
                        </section>
                        <MagnitudeLegend
                          lang={lang}
                          onExplain={() => go('sources', '#fw-sources-read')}
                        />
                        <ScopeNote>
                          {t(
                            'Faro muestra sismos que ya ocurrieron y fueron publicados. No es un sistema de alerta temprana y no identifica réplicas.',
                            'Faro shows earthquakes that already happened and were published. It is not an early warning system and does not identify aftershocks.',
                            'O Faro mostra terremotos que já aconteceram e foram publicados. Não é um sistema de alerta antecipado e não identifica réplicas.',
                          )}{' '}
                          <button
                            type="button"
                            className="f-inline-link"
                            onClick={() => go('sources')}
                          >
                            {t('Fuentes y cobertura', 'Sources & coverage', 'Fontes e cobertura')}
                          </button>
                        </ScopeNote>
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
                              now={live.now}
                            />
                          ),
                        },
                      ]
                    : []),
                  {
                    id: 'alerts',
                    // Short in the tab so every tab fits on a phone; the screen title says it in full.
                    label: t('Alertas', 'Alerts', 'Alertas'),
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
            <SourcesScreen
              lang={lang}
              now={live.now}
              countryName={countryName}
              rows={sourceRows}
              // The polling countdown and the changes received belong here, not on the list.
              next={
                live.online && !live.busy && live.checked > 0
                  ? { id: catalog, at: live.next }
                  : undefined
              }
              updates={{
                items: live.updates.filter((u) => results.some((e) => e.id === u.event.id)),
                provider,
                fetched: live.fetched,
                onDetails: (q) => setDetail(q.id),
              }}
            />
          )}
          {screen === 'country' && (
            <CountryScreen
              lang={lang}
              country={country}
              saved={savedCountries}
              onChoose={(code) => {
                changeCountry(code);
                history.back();
              }}
              onToggleSave={saveCountry}
              onLocate={countryFromLocation}
              locating={placeState?.kind === 'pending'}
              locateStatus={locateStatus}
              onLanguage={changeLanguage}
              onBack={() => history.back()}
              backLabel={t('Volver', 'Back', 'Voltar')}
              install={<InstallFaro lang={lang} />}
            />
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
              onHelp={() => go('help', '#fw-help-care')}
              onTrip={() => go('hotel')}
              onQuake={(q) => setDetail(q.id)}
              onActivity={(section) => {
                go('activity');
                if (section === 'tsunami') openTab('tsunami');
              }}
            />
          )}
          {screen === 'help' && (
            <div className="f-column">
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
              <FamilyLinks
                country={country}
                lang={lang}
                nationality={nationality}
                onStatus={() => setScreen('status')}
              />
              {/* Shelters: who announces them, never a list Faro cannot verify. */}
              <Section id="fw-help-shelters" title={t('Albergues', 'Shelters', 'Abrigos')}>
                <Text>
                  {civilProtection
                    ? t(
                        `Los albergues abiertos los anuncia ${civilProtection.name}. Faro no los verifica; pregunta también en tu alojamiento.`,
                        `Open shelters are announced by ${civilProtection.name}. Faro does not verify them; also ask where you are staying.`,
                        `Quem anuncia os abrigos abertos: ${civilProtection.name}. O Faro não os verifica; pergunte também na sua hospedagem.`,
                      )
                    : t(
                        'Faro no tiene datos verificados de albergues aquí. Pregunta a las autoridades locales o en tu alojamiento antes de desplazarte.',
                        'Faro has no verified shelter data here. Ask local authorities or where you are staying before you travel.',
                        'O Faro não tem dados verificados de abrigos aqui. Pergunte às autoridades locais ou na sua hospedagem antes de se deslocar.',
                      )}
                </Text>
                <Actions>
                  {civilProtection && (
                    <OutLink href={civilProtection.url}>
                      {t('Sitio oficial', 'Official website', 'Site oficial')}
                    </OutLink>
                  )}
                  <button type="button" onClick={() => setScreen('hotel')}>
                    {t('Preparar mi plan', 'Prepare my plan', 'Preparar meu plano')}
                  </button>
                </Actions>
              </Section>
              <OfflineMap lang={lang} detail {...offlineArea(visiblePoint)} />
              <DestinationInfo
                country={country}
                lang={lang}
                resources={regionResources}
                regionName={countryName}
              />
              <ScopeNote>
                {t(
                  'Faro solo enlaza a cada servicio: no llama, no busca personas ni envía tus datos. Google Maps recibe la zona o tu ubicación aproximada solo cuando tocas uno de sus enlaces.',
                  'Faro only links to each service: it does not call, look for people or send your data. Google Maps receives the area or your approximate location only when you tap one of its links.',
                  'O Faro só leva a cada serviço: não liga, não procura pessoas nem envia seus dados. O Google Maps recebe a área ou sua localização aproximada só quando você toca em um dos links dele.',
                )}
              </ScopeNote>
            </div>
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
          <footer className="f-footer">
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
              <button type="button" className="f-inline-link" onClick={() => setScreen('sources')}>
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
                      'Sismos: IGC-UP / EMSC / USGS · Tsunami y ciclones: NOAA · Avisos: servicios meteorológicos y GDACS · Mapa: OpenFreeMap y OpenStreetMap',
                      'Earthquakes: IGC-UP / EMSC / USGS · Tsunami and cyclones: NOAA · Warnings: weather services and GDACS · Map: OpenFreeMap and OpenStreetMap',
                      'Terremotos: IGC-UP / EMSC / USGS · Tsunami e ciclones: NOAA · Avisos: serviços meteorológicos e GDACS · Mapa: OpenFreeMap e OpenStreetMap',
                    )}
            </span>
          </footer>
        </div>
      </main>
      <TabBar tabs={nav} current={currentTab} onSelect={setScreen} label={shellText.menu} />

      <InformationDialog
        open={!!detail}
        selected={selected}
        geo={geo}
        lang={lang}
        provider={provider}
        fetched={live.fetched}
        generated={live.generated}
        onClose={closeSheet}
        onMap={showEpicentre}
        onTsunami={() => {
          if (screenRef.current === 'activity') closeSheet();
          else setDetail(null);
          go('activity');
          openTab('tsunami');
        }}
      />
    </AppFrame>
  );
}
