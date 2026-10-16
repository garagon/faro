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
import { capitalize, sourceLine, sourceState } from './lib/sourceStatus.ts';
import { sourceSites } from './data/sourceSites.ts';
import { paging } from './lib/paging.ts';
import { SINAPROC_HOME, floodPosts, parseCivil, postTitle, reviveCivil } from './lib/civil.ts';
import LocalDataInfo from './components/LocalDataInfo.tsx';
import { writeLocal, removeLocal, pruneOfficialCopies } from './lib/browserStorage.ts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InformationDialog from './components/InformationDialog.tsx';
import {
  CrosshairIcon,
  MagnifyingGlassIcon,
  BookOpenTextIcon,
  UsersThreeIcon,
  ClockCounterClockwiseIcon,
  BackpackIcon,
  ChatCircleTextIcon,
  WifiSlashIcon,
  PulseIcon,
  SuitcaseRollingIcon,
  DatabaseIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react';
import { distanceKm, filterEvents, type CatalogId, type Quake, type Bounds } from './lib/domain.ts';
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
import { checkedLabel } from './lib/time.ts';
import { quakeDate, quakeRegion, quakeTime, withPlace } from './lib/quakeText.ts';
import {
  confirmFresh,
  earthquakeSummary,
  gdacsStatus,
  leadingWarnings,
  tsunamiStatus,
  warningTopic,
} from './lib/hazards.ts';
import SituationBriefing from './components/SituationBriefing.tsx';
import { destinationFor } from './data/destinations/index.ts';
import { leadingNotice, parseTsunamiData, reviveTsunami } from './lib/tsunami.ts';
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
  severityLabels,
  severityLevel,
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
  RowIcon,
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
  // Null until the person picks one: the screen then opens on the topic of a warning in force.
  const [emergencyKind, setEmergencyKind] = useState<EmergencyKind | null>(null),
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
    // The first view frames the country and its earthquakes (WebMap `fit`).
    [view, setView] = useState<MapView>({ ...initialRegion.view, fit: true }),
    // Set when the person moved the map since the app last placed it.
    [mapMoved, setMapMoved] = useState(false),
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
  const lastTab = useRef<Screen>('activity');
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
      appRef.current?.querySelector<HTMLElement>('.f-page h1')?.focus({ preventScroll: true }),
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
  // `fit`: frame the country and its earthquakes instead of the point (a new country).
  const center = (lat: number, lng: number, zoom = 8, fit = false) =>
    setView((v) => ({ lat, lng, zoom, key: v.key + 1, fit }));
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
    // Every screen now shows another country: going back starts each one at the top.
    scrollMemory.current = {};
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
    center(region.view.lat, region.view.lng, region.view.zoom, true);
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
  // Saves the trip form: profile and meeting plan together, without leaving the screen. The
  // country on screen changes only when the person picked another one in the form.
  const saveTrip = (value: Preferences, nextPlan: HotelPlan | null, follow: boolean) => {
    try {
      const saved = storePreferences(value, countryCodes);
      if (nextPlan) writeLocal('faro-hotel-v1', JSON.stringify(nextPlan));
      else removeLocal('faro-hotel-v1');
      setProfile(saved);
      setNationality(saved.nationality);
      setShowEmbassies(!!saved.nationality);
      setPlan(nextPlan);
      if (follow && saved.destination !== country) changeCountry(saved.destination);
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
    return !failed.length;
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
  // The recent NOAA threat (or unreadable) message that no later message closed: one result,
  // read by the banner, the Situación row and the Tsunami tab, so its words and level agree.
  const tsunamiLead = leadingNotice(tsunami.data, live.now, tsunami.failed);
  const tsunamiAlert = tsunamiLead?.row.needsReview ? tsunamiLead : undefined;
  // Polled every minute: older than a few cycles, offline or failing, the banner says so.
  const tsunamiSource =
    tsunami.data && (!live.online || tsunami.failed || live.now - tsunami.data.fetched > 3 * 60000)
      ? sourceLine({
          checked: tsunami.data.fetched,
          failed: tsunami.failed,
          failedAt: tsunami.failedAt,
          online: live.online,
          old: true,
          now: live.now,
          lang,
        })
      : undefined;
  // A failing source keeps the time of its last attempt, for the rows to say when it failed.
  const hazardStates = [
    {
      ...confirmFresh(
        tsunamiStatus(tsunami.data, tsunami.failed, live.now),
        tsunami.data?.fetched,
        live.now,
        live.online,
        3 * 60000,
      ),
      failedAt: tsunami.failedAt ?? undefined,
    },
    ...(['cyclone', 'flood', 'volcano'] as const).map((key) => ({
      ...confirmFresh(
        // A partial GDACS answer cannot confirm "no alerts".
        gdacsStatus(key, countryAlerts, alerts.failed || !!alerts.data?.partial, live.now),
        alerts.data?.fetched,
        live.now,
        live.online,
        20 * 60000,
      ),
      failedAt: alerts.failedAt ?? undefined,
    })),
  ];
  // Active GDACS points (updated in 72 h) for cyclones, floods and volcanoes in the place. A
  // tsunami bulletin is never drawn: which coasts it applies to is the agency's to say, not a
  // shape Faro could infer.
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
  // Each area in the colour of its official level, as its row on Situación.
  const warningAreas: MapArea[] = nationalActive
    .filter((w) => w.polygons.length > 0)
    .map((w) => ({
      id: w.id,
      polygons: w.polygons,
      level: w.severity ? severityLevel[w.severity] : undefined,
      levelLabel: w.severity ? severityLabels[w.severity][idx] : undefined,
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
              `${activeStorms.length} en la cuenca (NHC)`,
              `${activeStorms.length} in the basin (NHC)`,
              `${activeStorms.length} na bacia (NHC)`,
            )
          : t('Ninguno en la cuenca (NHC)', 'None in the basin (NHC)', 'Nenhum na bacia (NHC)')),
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
    // "Search this area" only after the person moved the map away from the area listed.
    dirty =
      mapMoved &&
      (Math.abs(bounds.west - pending.west) > 0.5 || Math.abs(bounds.north - pending.north) > 0.5);
  // The map's first view: the country's land and its earthquakes, followed until the person
  // moves the map. Before the borders load, the country's preset view.
  const countryBox = useMemo(
    () => (borders && country !== 'WORLD' ? borders.countryBounds(country) : null),
    [borders, country],
  );
  const mapFrame = useMemo(() => {
    if (!countryBox || scope !== 'country') return null;
    const all = results.reduce(
      (b, q) => ({
        south: Math.min(b.south, q.lat),
        north: Math.max(b.north, q.lat),
        west: Math.min(b.west, q.lng),
        east: Math.max(b.east, q.lng),
      }),
      countryBox,
    );
    // Earthquakes far from the mainland (Alaska or Hawaii for the United States, or across the
    // date line) would shrink the country to a dot: then the country alone.
    return all.east - all.west > 60 || all.north - all.south > 50 ? countryBox : all;
  }, [countryBox, scope, results]);
  // One earthquake row, the same in the list and in "Latest earthquakes": when it happened as the
  // title (one format everywhere, src/lib/quakeText.ts), then where and how deep. The region the
  // catalogue published is said only when it adds something: inside the country on screen, or
  // when every earthquake shares it, it is named once in the list title instead.
  const quakeHome = scope === 'country' && country !== 'WORLD' ? country : undefined;
  const sharedRegion = useMemo(() => {
    if (quakeHome || !results.length) return null;
    const first = quakeRegion(results[0], lang);
    return first && results.every((q) => quakeRegion(q, lang)?.text === first.text) ? first : null;
  }, [results, lang, quakeHome]);
  const quakeRow = (q: Quake) => {
    const region = sharedRegion ? null : quakeRegion(q, lang, quakeHome);
    return {
      title: (
        <time dateTime={new Date(q.time).toISOString()} title={quakeDate(q.time, lang, timeZone)}>
          {quakeTime(q.time, live.now, lang, timeZone)}
        </time>
      ),
      meta: (
        <>
          {region && (
            <>
              <span lang={region.lang === lang ? undefined : region.lang}>{region.text}</span>
              {' · '}
            </>
          )}
          {distance(q.depth, lang).replace(' ', '\u00a0')} {t('de prof.', 'deep', 'de prof.')}
          {geo
            ? ` · ${distance(distanceKm([geo.lat, geo.lng], [q.lat, q.lng]), lang).replace(' ', '\u00a0')} ${t('de ti', 'away', 'de você')}`
            : ''}
        </>
      ),
    };
  };
  // A list title with the place its rows leave out: "51 sismos en Panamá".
  const placedTitle = (text: string) =>
    quakeHome ? (
      withPlace(text, country, countryName, lang)
    ) : sharedRegion ? (
      <>
        {text} ·{' '}
        <span lang={sharedRegion.lang === lang ? undefined : sharedRegion.lang}>
          {sharedRegion.text}
        </span>
      </>
    ) : (
      text
    );
  // An empty earthquake list says one thing: offline, waiting for a first answer, the source
  // failing with nothing received, or no records in an answer.
  const emptyList = !live.online
    ? 'offline'
    : !live.fetched
      ? live.failed
        ? 'failed'
        : 'checking'
      : 'none';
  // Other catalogues are already offered above the list for old or quiet records.
  const alternativesAbove = live.online && (stale || !!quietSince);
  // Filters narrower than the defaults: only then does "Reset filters" change anything.
  const narrowed = hours < 24 || minMag > 0 || maxDepth < 800 || scope !== 'country';
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
            failedAt: c === catalog ? feed.failedAt : null,
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
              failedAt: national.failedAt,
              every: t('cada 10 min', 'every 10 min', 'a cada 10 min'),
            },
            {
              failed: national.failed,
              // Reading only the most recent messages is said on Situación, not marked partial.
              partial: nationalHere?.partial && !nationalHere.recent,
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
              failedAt: civil.failedAt,
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
              failedAt: nws.failedAt,
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
        failedAt: tsunami.failedAt,
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
        failedAt: storms.failedAt,
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
        failedAt: alerts.failedAt,
        every: t('cada 5 min', 'every 5 min', 'a cada 5 min'),
      },
      { failed: alerts.failed, partial: alerts.data?.partial, maxAge: 20 * 60000 },
    ),
  ];
  // Each screen's head: its title and one line of lead, or none. A lead fits one line at 390 px
  // in Spanish and says what the content does not; the country is in the frame, never here.
  const headings: Record<Exclude<Screen, 'activity'>, [string, string]> = {
    // One title for the detail pages, whatever the tab: each tab names its own panel.
    detail: [
      t('Detalle', 'Details', 'Detalhes'),
      t(
        `${countryName}, como lo publica cada fuente.`,
        `${countryName}, as each source publishes it.`,
        `${countryName}, como cada fonte publica.`,
      ),
    ],
    // The same word as its menu entry. Sections and rows already say what each screen holds.
    sources: [t('Fuentes', 'Sources', 'Fontes'), ''],
    // Country and Emergency draw their own heads (CountryScreen, EmergencyScreen).
    country: [t('País', 'Country', 'País'), ''],
    emergency: [t('Emergencia', 'Emergency', 'Emergência'), ''],
    help: [t('Ayuda', 'Help', 'Ajuda'), ''],
    status: [
      t('Avisar', 'Check in', 'Avisar'),
      t(
        'Prepara un mensaje para decir cómo estás.',
        'Prepare a message to say how you are.',
        'Prepare um recado dizendo como você está.',
      ),
    ],
    kit: [t('Mochila', 'Go bag', 'Mochila'), ''],
    hotel: [
      t('Viaje', 'Trip', 'Viagem'),
      t(
        'Tus datos de emergencia. Todo es opcional.',
        'Your emergency details, all optional.',
        'Seus dados de emergência. Tudo é opcional.',
      ),
    ],
    // The guide's general rule, kept above every topic.
    guide: [
      t('Guía', 'Guide', 'Guia'),
      t(
        'Sigue siempre a las autoridades locales.',
        'Always follow local authorities.',
        'Siga sempre as autoridades locais.',
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
  if (nav.some((n) => n.id === screen)) lastTab.current = screen;
  else if (screen === 'detail') lastTab.current = 'activity';
  const currentTab: Screen | null =
    screen === 'detail'
      ? 'activity'
      : screen === 'country'
        ? lastTab.current
        : nav.some((n) => n.id === screen)
          ? screen
          : null;
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
          {/* The one vocabulary: "Sin conexión · último dato 07:29". */}
          {live.fetched
            ? capitalize(
                sourceLine({
                  checked: live.fetched,
                  failed: false,
                  online: false,
                  now: live.now,
                  lang,
                }).text,
              )
            : t(
                'Sin conexión · los números y la guía funcionan',
                'Offline · numbers and guidance still work',
                'Sem conexão · números e guia funcionam',
              )}
        </StatusBar>
      )}
      {/* The scrolling region keeps the older screens' classes while they move to the design system. */}
      <main id="main" className="f-content" ref={appRef} data-screen={screen}>
        <div className="f-page" data-screen={screen}>
          <p className="f-visually-hidden" role="status">
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
            <div className="f-stack" data-gap="sm">
              <Note>
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
              </Note>
              <Actions>
                {profileFeedback === 'saved' && (
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('hotel');
                      setProfileFeedback(null);
                    }}
                  >
                    {t('Preparar mi viaje', 'Prepare my trip', 'Preparar minha viagem')}
                  </button>
                )}
                <button type="button" onClick={() => setProfileFeedback(null)}>
                  {t('Entendido', 'Dismiss', 'Entendi')}
                </button>
              </Actions>
            </div>
          )}
          {screen !== 'status' && checkInDue(checkIns[0], live.now) && (
            // A reminder the person set, not a status: one row that opens Avisar.
            <div role="status">
              <List>
                <ListRow
                  lead={<RowIcon icon={<ClockCounterClockwiseIcon size={20} />} />}
                  title={t(
                    'Tienes pendiente avisar cómo estás.',
                    'Your planned check-in is overdue.',
                    'Você ainda precisa avisar como está.',
                  )}
                  meta={t('Actualizar mi estado', 'Update my status', 'Atualizar meu status')}
                  onClick={() => setScreen('status')}
                />
              </List>
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
                  failedAt: live.failedAt,
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
                  failedAt: live.failedAt,
                }}
                alert={
                  tsunamiAlert && (
                    <TsunamiBanner
                      lang={lang}
                      now={live.now}
                      bulletin={tsunamiAlert.row.bulletin}
                      notice={tsunamiAlert.notice}
                      source={tsunamiSource}
                      onOpen={() => openTab('tsunami')}
                    />
                  )
                }
                // Every source this screen reads; the failing ones are summed up in its head.
                sources={[
                  { name: provider, failed: live.failed },
                  { name: 'NOAA/PTWC', failed: tsunami.failed },
                  { name: 'GDACS', failed: alerts.failed },
                  ...(inNhcRegion ? [{ name: 'NHC', failed: storms.failed }] : []),
                  ...(inNws ? [{ name: 'NWS', failed: nws.failed }] : []),
                  ...(inNational
                    ? [
                        {
                          name: destinationFor(country)?.weatherAgency?.name ?? country,
                          failed: national.failed,
                        },
                      ]
                    : []),
                  ...(inCivil ? [{ name: 'SINAPROC', failed: civil.failed }] : []),
                ]}
                onRetry={() => {
                  for (const source of [live, tsunami, alerts, storms])
                    if (source.failed) void source.refresh();
                  if (inNws && nws.failed) void nws.refresh();
                  if (inNational && national.failed) void national.refresh();
                  if (inCivil && civil.failed) void civil.refresh();
                }}
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
                        failedAt: national.failedAt,
                        partial: national.data?.country === country && national.data.partial,
                        recent: national.data?.country === country ? national.data.recent : null,
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
                nhcArea={inNhcRegion}
                floodAdvice={floodAdvice}
                floodNotice={
                  floodNotice && {
                    ...floodNotice,
                    count: civil.data ? floodPosts(civil.data.posts, live.now).length : 1,
                  }
                }
                civil={
                  inCivil
                    ? {
                        agency: 'SINAPROC',
                        posts: civil.data?.posts ?? null,
                        failed: civil.failed,
                        failedAt: civil.failedAt,
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
                    // The tsunami banner gives the coast instruction once, above the call.
                    coastNotice={!tsunamiAlert}
                  />
                }
                map={
                  <div className="f-stack" data-gap="lg">
                    <div className="f-stack" data-gap="sm">
                      {/* Past the map's controls in one step, to its legend. */}
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
                          frame={mapFrame}
                          geo={geo}
                          point={visiblePoint}
                          selected={detail || focused || undefined}
                          onSelect={(q) => setDetail(q.id)}
                          onBounds={(b, moved) => {
                            setPending(b);
                            setMapMoved(moved);
                          }}
                          legendId="fw-map-foot"
                          action={
                            dirty ? (
                              <Button
                                variant="secondary"
                                icon={<MagnifyingGlassIcon size={18} aria-hidden="true" />}
                                onClick={() => {
                                  setBounds(pending);
                                  setScope('area');
                                  setPage(1);
                                  // The button goes with the search: focus stays on the map.
                                  appRef.current
                                    ?.querySelector<HTMLElement>('.f-map-canvas')
                                    ?.focus({ preventScroll: true });
                                }}
                              >
                                {t('Buscar en esta área', 'Search this area', 'Buscar nesta área')}
                              </Button>
                            ) : undefined
                          }
                        />
                      </MapFrame>
                      {availableEmbassy && (
                        <Actions>
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
                        </Actions>
                      )}
                    </div>
                    {/* Wide screens have room for the latest earthquakes beside the hazards. The
                        section stays when the catalogue fails or has nothing, and says which. */}
                    <div className="f-when-split">
                      <Section
                        id="fw-latest"
                        title={placedTitle(
                          t('Últimos sismos', 'Latest earthquakes', 'Últimos terremotos'),
                        )}
                        aside={provider}
                      >
                        {results.length > 0 ? (
                          <div className="f-stack" data-gap="sm">
                            {/* Records from a source that stopped answering are not current. */}
                            {stale && live.fetched > 0 && (
                              <SourceStamp state="stale">
                                {!live.online
                                  ? t(
                                      `Sin conexión · último dato ${checkedLabel(live.fetched, live.now, lang)}`,
                                      `Offline · last data ${checkedLabel(live.fetched, live.now, lang)}`,
                                      `Sem conexão · último dado ${checkedLabel(live.fetched, live.now, lang)}`,
                                    )
                                  : live.failed
                                    ? t(
                                        `Sin respuesta · último dato ${checkedLabel(live.fetched, live.now, lang)}`,
                                        `No answer · last data ${checkedLabel(live.fetched, live.now, lang)}`,
                                        `Sem resposta · último dado ${checkedLabel(live.fetched, live.now, lang)}`,
                                      )
                                    : t(
                                        `Último dato ${checkedLabel(live.fetched, live.now, lang)}`,
                                        `Last data ${checkedLabel(live.fetched, live.now, lang)}`,
                                        `Último dado ${checkedLabel(live.fetched, live.now, lang)}`,
                                      )}
                              </SourceStamp>
                            )}
                            <List>
                              {[...results]
                                .sort((a, b) => b.time - a.time)
                                .slice(0, 5)
                                .map((q) => (
                                  <ListRow
                                    key={q.id}
                                    lead={<Magnitude value={q.mag} />}
                                    {...quakeRow(q)}
                                    onClick={() => setDetail(q.id)}
                                  />
                                ))}
                            </List>
                          </div>
                        ) : (
                          // Never answered, failing, offline or empty: said here, never a "none"
                          // for a failure.
                          <div className="f-stack" data-gap="sm" role="status">
                            <SourceStamp
                              state={
                                emptyList === 'failed' || emptyList === 'offline'
                                  ? 'error'
                                  : undefined
                              }
                            >
                              {emptyList === 'offline'
                                ? t(
                                    'Sin conexión · sin datos de sismos',
                                    'Offline · no earthquake data',
                                    'Sem conexão · sem dados de terremotos',
                                  )
                                : emptyList === 'checking'
                                  ? `${t('Consultando', 'Checking', 'Consultando')} ${provider}…`
                                  : emptyList === 'failed'
                                    ? live.failedAt
                                      ? t(
                                          `Sin respuesta · intento ${checkedLabel(live.failedAt, live.now, lang)}`,
                                          `No answer · attempt ${checkedLabel(live.failedAt, live.now, lang)}`,
                                          `Sem resposta · tentativa ${checkedLabel(live.failedAt, live.now, lang)}`,
                                        )
                                      : t('Sin respuesta', 'No answer', 'Sem resposta')
                                    : t(
                                        `Ninguno en ${periodLabel}`,
                                        `None in ${periodLabel}`,
                                        `Nenhum em ${periodLabel}`,
                                      )}
                            </SourceStamp>
                            {emptyList !== 'checking' && (
                              <Text caption>
                                {emptyList === 'none'
                                  ? t(
                                      'La ausencia de registros no significa ausencia de peligro.',
                                      'No records does not mean no danger.',
                                      'A ausência de registros não significa ausência de perigo.',
                                    )
                                  : t(
                                      'Esto no significa que no haya sismos.',
                                      'This does not mean there are no earthquakes.',
                                      'Isso não significa que não haja terremotos.',
                                    )}
                              </Text>
                            )}
                            {emptyList === 'failed' && (
                              <Actions>
                                <button
                                  type="button"
                                  disabled={live.busy}
                                  onClick={() => void live.refresh()}
                                >
                                  {live.busy
                                    ? t('Consultando…', 'Checking…', 'Consultando…')
                                    : t('Reintentar', 'Retry', 'Tentar de novo')}
                                </button>
                              </Actions>
                            )}
                          </div>
                        )}
                      </Section>
                    </div>
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
                    // The count is in the list title, so the four tabs fit from 360 px.
                    label: t('Sismos', 'Earthquakes', 'Terremotos'),
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
                          // A copy kept from an earlier visit is the last data until a new answer.
                          checked={live.checked || live.fetched}
                          busy={live.busy}
                          online={live.online}
                          stale={stale}
                          failed={live.failed}
                          failedAt={live.failedAt}
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
                          {/* Offline is already said by the bar above; this is for records from a
                            failing or late source. Without any record, the list says it once. */}
                          {stale && live.online && live.fetched > 0 && (
                            <div className="f-stack" data-gap="sm" role="status">
                              <SourceStamp state="stale">
                                {t(
                                  'No hay una actualización reciente. Estos registros pueden estar desactualizados.',
                                  'No recent update. These records may be out of date.',
                                  'Não há uma atualização recente. Estes registros podem estar desatualizados.',
                                )}{' '}
                                {`${t('Última consulta correcta', 'Last successful check', 'Última consulta bem-sucedida')}: ${stamp(live.fetched)}.`}{' '}
                                {live.failed &&
                                  live.failedAt &&
                                  `${t('Último intento, sin respuesta', 'Last attempt, no answer', 'Última tentativa, sem resposta')}: ${stamp(live.failedAt)}.`}{' '}
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
                              {/* No count before the catalog has answered: "0" would read as none.
                                With a count, the place the rows leave out: "51 sismos en Panam\u00e1". */}
                              {!live.fetched || (quietSince && !results.length)
                                ? t('Sismos', 'Earthquakes', 'Terremotos')
                                : placedTitle(
                                    `${results.length}\u00a0${
                                      results.length === 1
                                        ? t('sismo', 'earthquake', 'terremoto')
                                        : t('sismos', 'earthquakes', 'terremotos')
                                    }`,
                                  )}
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
                          {/* Sorting is offered only over a list. */}
                          {results.length > 0 && (
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
                                  label: t(
                                    'Mayor magnitud',
                                    'Largest magnitude',
                                    'Maior magnitude',
                                  ),
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
                          )}
                          <div role="status">
                            <Note>
                              {/* The 100 km buffer only adds sea where the country has a coast. */}
                              {scope === 'country' && hasBorders(country)
                                ? borders?.reachesSea(country)
                                  ? t(
                                      `${countryName} y hasta 100 km mar adentro. Límites aproximados.`,
                                      `${countryName} and up to ${distance(100, lang)} offshore. Approximate boundaries.`,
                                      `${countryName} e até 100 km mar adentro. Limites aproximados.`,
                                    )
                                  : t(
                                      `${countryName}. Límites aproximados.`,
                                      `${countryName}. Approximate boundaries.`,
                                      `${countryName}. Limites aproximados.`,
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
                                  // When it happened; then where, how deep and how far when the
                                  // location is on (quakeRow, shared with "Latest earthquakes").
                                  {...quakeRow(q)}
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
                                  onClick={() => setDetail(q.id)}
                                />
                              ))}
                            </List>
                          ) : (
                            <div className="f-stack" data-gap="sm">
                              <h3 className="f-subhead">
                                {emptyList === 'offline'
                                  ? t('Sin conexión', 'Offline', 'Sem conexão')
                                  : emptyList === 'checking'
                                    ? `${t('Consultando', 'Checking', 'Consultando')} ${provider}…`
                                    : emptyList === 'failed'
                                      ? t(
                                          `${provider} no responde`,
                                          `${provider} is not responding`,
                                          `${provider} não responde`,
                                        )
                                      : t(
                                          'Sin registros en esta consulta',
                                          'No records in this query',
                                          'Sem registros nesta consulta',
                                        )}
                              </h3>
                              <div className="f-prose">
                                <p>
                                  {emptyList === 'offline'
                                    ? t(
                                        'Cuando vuelva la conexión, intentaremos actualizar los datos. La ayuda y tus datos guardados siguen disponibles en esta página.',
                                        'When the connection returns, we will try to update. Help and your saved data remain available on this page.',
                                        'Quando a conexão voltar, vamos tentar atualizar os dados. A ajuda e seus dados salvos continuam disponíveis nesta página.',
                                      )
                                    : emptyList === 'checking'
                                      ? t(
                                          'Esperando la respuesta de la fuente. Tras un sismo, los sitios oficiales pueden tardar más.',
                                          'Waiting for the source to respond. After an earthquake, official sites can be slower.',
                                          'Aguardando a resposta da fonte. Depois de um terremoto, os sites oficiais podem demorar mais.',
                                        )
                                      : emptyList === 'failed'
                                        ? [
                                            live.failedAt
                                              ? t(
                                                  `Último intento: ${checkedLabel(live.failedAt, live.now, lang)}.`,
                                                  `Last attempt: ${checkedLabel(live.failedAt, live.now, lang)}.`,
                                                  `Última tentativa: ${checkedLabel(live.failedAt, live.now, lang)}.`,
                                                )
                                              : '',
                                            t(
                                              'Esto no significa que no haya sismos. Reintenta o consulta otra fuente.',
                                              'This does not mean there are no earthquakes. Retry or check another source.',
                                              'Isso não significa que não haja terremotos. Tente de novo ou consulte outra fonte.',
                                            ),
                                          ]
                                            .filter(Boolean)
                                            .join(' ')
                                        : t(
                                            'Amplía el período o el área. La ausencia de registros no significa ausencia de peligro.',
                                            'Widen the period or area. No records does not mean no danger.',
                                            'Amplie o período ou a área. A ausência de registros não significa ausência de perigo.',
                                          )}
                                </p>
                              </div>
                              {/* Only actions that change the answer: retry, a longer period,
                                another catalogue, or filters back to the defaults. */}
                              {(emptyList === 'failed' || emptyList === 'none') && (
                                <Actions>
                                  {emptyList === 'failed' && (
                                    <button
                                      type="button"
                                      disabled={live.busy}
                                      onClick={() => void live.refresh()}
                                    >
                                      {live.busy
                                        ? t('Consultando…', 'Checking…', 'Consultando…')
                                        : t('Reintentar', 'Retry', 'Tentar de novo')}
                                    </button>
                                  )}
                                  {emptyList === 'none' && hours < 168 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setHours(168);
                                        setPage(1);
                                      }}
                                    >
                                      {t('Ver 7 días', 'Show 7 days', 'Ver 7 dias')}
                                    </button>
                                  )}
                                  {(emptyList === 'failed' || !alternativesAbove) &&
                                    alternatives.map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => switchCatalog(c)}
                                      >
                                        {t('Ver', 'Use', 'Usar')} {providerNames[c]}
                                      </button>
                                    ))}
                                  {emptyList === 'none' && narrowed && (
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
                                      {t(
                                        'Restablecer filtros',
                                        'Reset filters',
                                        'Redefinir filtros',
                                      )}
                                    </button>
                                  )}
                                </Actions>
                              )}
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
                        failedAt={tsunami.failedAt}
                        busy={tsunami.busy}
                        online={live.online}
                        now={live.now}
                        onRefresh={() => void tsunami.refresh()}
                        onLocate={locate}
                        locating={geoState === 'pending'}
                        nws={
                          inNws
                            ? {
                                data: nws.data,
                                failed: nws.failed,
                                checked: nws.at,
                                failedAt: nws.failedAt,
                              }
                            : null
                        }
                      />
                    ),
                  },
                  ...(inNhcRegion
                    ? [
                        {
                          id: 'storms',
                          label: t('Ciclones', 'Cyclones', 'Ciclones'),
                          content: (
                            <StormsPanel
                              lang={lang}
                              data={storms.data}
                              failed={storms.failed}
                              failedAt={storms.failedAt}
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
                              checked={nws.at}
                              failedAt={nws.failedAt}
                              online={live.online}
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
                        failedAt={alerts.failedAt}
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
              country={country}
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
                    bulletin={tsunamiAlert.row.bulletin}
                    notice={tsunamiAlert.notice}
                    source={tsunamiSource}
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
              // The warnings in force under the call, as on Situación.
              warnings={
                inNational && national.data?.country === country
                  ? {
                      agency: national.data.agency,
                      items: leadingWarnings(nationalActive),
                      checked: national.data.fetched,
                      failed: national.failed,
                      failedAt: national.failedAt,
                      stale:
                        national.data.stale || live.now - national.data.fetched > OFFICIAL_MAX_AGE,
                      online: live.online,
                    }
                  : undefined
              }
              // Until the person picks a topic, "First minutes" opens on the one a warning in
              // force names (flooding, a tropical storm); it says nothing about who it applies to.
              kind={
                emergencyKind ??
                warningTopic(
                  nationalActive,
                  inNws && nws.data
                    ? { flood: nwsCount('flood') ?? 0, tropical: nwsCount('tropical') ?? 0 }
                    : undefined,
                ) ??
                'earthquake'
              }
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
              onEmbassy={() => go('help', '#fw-help-embassy')}
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
                {civilProtection && (
                  <Actions>
                    <OutLink href={civilProtection.url}>
                      {t('Sitio oficial', 'Official website', 'Site oficial')}
                    </OutLink>
                  </Actions>
                )}
                {/* Another screen: a row that opens it, not a link-styled button. */}
                <List>
                  <ListRow
                    title={t('Preparar mi plan', 'Prepare my plan', 'Preparar meu plano')}
                    meta={t('En Viaje', 'In Trip', 'Em Viagem')}
                    onClick={() => setScreen('hotel')}
                  />
                </List>
              </Section>
              {/* The offline map has one home, Viaje; Ayuda points there. */}
              <Section
                id="fw-help-offline"
                title={t('Mapa sin conexión', 'Offline map', 'Mapa off-line')}
              >
                <List>
                  <ListRow
                    title={t(
                      'Guardar la zona para usarla sin señal',
                      'Save the area to use without signal',
                      'Salvar a área para usar sem sinal',
                    )}
                    meta={t(
                      'En Viaje, con Google Maps',
                      'In Trip, with Google Maps',
                      'Em Viagem, com o Google Maps',
                    )}
                    onClick={() => go('hotel', '#fw-offline-map')}
                  />
                </List>
              </Section>
              <DestinationInfo
                country={country}
                lang={lang}
                resources={regionResources}
                regionName={countryName}
                onCountry={() => setScreen('country')}
              />
              {/* What Google Maps receives is said once, next to each of its buttons. */}
              <ScopeNote>
                {t(
                  'Faro solo enlaza a cada servicio: no llama, no busca personas ni envía tus datos.',
                  'Faro only links to each service: it does not call, look for people or send your data.',
                  'O Faro só leva a cada serviço: não liga, não procura pessoas nem envia seus dados.',
                )}
              </ScopeNote>
            </div>
          )}
          {/* Viaje stays mounted and hidden, like Avisar, so what the person typed and has not
              saved survives a change of tab. It is kept in memory only, never in storage. */}
          <div hidden={screen !== 'hotel'}>
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
          </div>
          {screen === 'hotel' && (
            // The rest of Viaje shares the form's reading column, so no block runs wider.
            <div className="f-column">
              <OfflineMap lang={lang} {...offlineArea(point)} />
              <TravelContacts key={country} country={country} lang={lang} />
              <EvacuationPlan country={country} lang={lang} />
              <LocalDataInfo lang={lang} />
            </div>
          )}
          {screen === 'kit' && <EmergencyKit lang={lang} country={country} />}
          {screen === 'guide' && (
            <SafetyGuide
              lang={lang}
              country={country}
              topic={guideTopic}
              onTopic={setGuideTopic}
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
          {/* One footer on every screen: who made Faro, its pages, and what opens offline. Each
              source is credited where its data appears and on Fuentes. */}
          <footer className="f-footer">
            <span>
              {t('Creado por', 'Created by', 'Criado por')}{' '}
              <a href="https://oktsec.com" target="_blank" rel="noopener">
                Oktsec
              </a>
              {'\u00a0· '}
              <a href="/about.html">{t('Acerca de', 'About Faro', 'Sobre o Faro')}</a>
              {'\u00a0· '}
              <a href="/privacy.html">{t('Privacidad', 'Privacy', 'Privacidade')}</a>
              {'\u00a0· '}
              <button type="button" className="f-inline-link" onClick={() => setScreen('sources')}>
                {t('Fuentes', 'Sources', 'Fontes')}
              </button>
            </span>
            {/* Said only once the offline copy has started here (src/sw.ts), in the same words
                as the install sheet: the app opens from the copy, new data needs a connection. */}
            {offlineReady && (
              <span>
                {t(
                  'Abre sin conexión; los datos nuevos necesitan internet.',
                  'Opens offline; new data needs internet.',
                  'Abre sem conexão; dados novos precisam de internet.',
                )}
              </span>
            )}
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
        now={live.now}
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
