import { magnitudeBand } from '../lib/magnitude.ts';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { renderToStaticMarkup } from 'react-dom/server';
import { DropletIcon, FlagIcon, MinusIcon, MountainIcon, PlusIcon, WindIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { directionsUrl, type Embassy } from '../lib/embassies.ts';
import { displayPlace, type Quake, type Bounds } from '../lib/domain.ts';
import { quakeRegion } from '../lib/quakeText.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { Note } from '../ui/index.ts';
/**
 * A view the app asks for. `fit` frames the `frame` area (the country and its earthquakes) until
 * the person moves the map; without it the map centres on the point (an epicentre, an embassy).
 */
export type MapView = { lat: number; lng: number; zoom: number; key: number; fit?: boolean };
// A light, low-contrast style, so earthquakes, warnings and areas stand out on it.
const BASE_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const PLATES_SOURCE = 'https://github.com/fraxen/tectonicplates';
// A fitted view keeps 24 px between every marker and the edge: pins hang 34 px above their
// point and are 34 px wide; clusters and hazard icons are centred and up to 40 px. On the left,
// markers also stay clear of the zoom buttons (58 px from the edge).
const FIT = {
  paddingTopLeft: L.point(58 + 10 + 20, 24 + 34),
  paddingBottomRight: L.point(24 + 20, 24 + 20),
  maxZoom: 11,
  animate: false,
};
type GlMap = import('maplibre-gl').Map;
/** Map labels in the reader's language, then the Latin-script name, then the local name. */
function labelIn(gl: GlMap, lang: Lang) {
  for (const layer of gl.getStyle().layers ?? []) {
    if (layer.type !== 'symbol') continue;
    // Only place-name labels; road numbers and other fields stay as they are.
    const field = gl.getLayoutProperty(layer.id, 'text-field');
    if (!field || !JSON.stringify(field).includes('name')) continue;
    gl.setLayoutProperty(layer.id, 'text-field', [
      'coalesce',
      ['get', `name:${lang}`],
      ['get', 'name:latin'],
      ['get', 'name'],
    ]);
  }
}
export type Geo = { lat: number; lng: number; accuracy: number; at: number };
/** A point published by a hazard source. Its position is the source's, not an affected area. */
export type MapHazard = {
  id: string;
  lat: number;
  lng: number;
  kind: 'cyclone' | 'flood' | 'volcano';
  level: 'green' | 'orange' | 'red' | 'info';
  title: string;
  detail: string;
  source: string;
  url: string;
};
/** An area as drawn by the agency in its warning. It is the warned area, not a flooded one. */
export type MapArea = {
  id: string;
  polygons: [number, number][][];
  title: string;
  detail: string;
  url: string;
  source: string;
  /** The official level (src/lib/national.ts `severityLevel`) and its word; none is neutral. */
  level?: 1 | 2 | 3;
  levelLabel?: string;
};
const hazardIcons = { cyclone: WindIcon, flood: DropletIcon, volcano: MountainIcon };
/*
 * Leaflet builds its controls, popups and tooltips itself and takes class names for them: these
 * give them the shadcn look (outline buttons, a popover card, the dark tooltip).
 */
const zoomBar = 'grid gap-1 rounded-none border-0 bg-transparent shadow-none';
const zoomButton = cn(
  buttonVariants({ variant: 'outline', size: 'icon' }),
  'size-10 text-foreground no-underline hover:text-foreground [&.leaflet-disabled]:pointer-events-none [&.leaflet-disabled]:opacity-50',
);
const popupClass = cn(
  'font-sans',
  '[&_.leaflet-popup-content-wrapper]:rounded-lg [&_.leaflet-popup-content-wrapper]:border [&_.leaflet-popup-content-wrapper]:bg-popover [&_.leaflet-popup-content-wrapper]:text-popover-foreground [&_.leaflet-popup-content-wrapper]:shadow-md',
  '[&_.leaflet-popup-content]:my-3 [&_.leaflet-popup-content]:mr-8 [&_.leaflet-popup-content]:ml-3 [&_.leaflet-popup-content]:text-sm [&_.leaflet-popup-content]:leading-snug',
  '[&_.leaflet-popup-tip]:bg-popover [&_.leaflet-popup-tip]:shadow-none',
  '[&_.leaflet-popup-close-button]:text-muted-foreground [&_.leaflet-popup-close-button]:hover:text-foreground',
);
// A popup opens clear of the zoom buttons (12 px from the edge, 40 px wide).
const popupOptions: L.PopupOptions = {
  className: popupClass,
  autoPanPaddingTopLeft: L.point(60, 12),
};
const tooltipClass =
  'rounded-md border-0 bg-primary px-3 py-1.5 font-sans text-xs text-primary-foreground shadow-md before:hidden';
/** The parts of a popup card, built as DOM (Leaflet takes an element). */
const popupTitle = 'block font-semibold text-foreground';
const popupText = 'm-0 mt-1 text-muted-foreground';
const popupLink =
  'mt-2 inline-block font-medium text-foreground underline underline-offset-4 hover:decoration-2';
/** A legend key's swatch: the mark it stands for, in the map's own colours. */
const swatch = 'inline-grid size-4 flex-none place-items-center rounded-[4px] text-white';
const areaSwatch = {
  0: 'border-(--f-neutral-600) bg-(--f-neutral-100)',
  1: 'border-(--f-color-level-1) bg-(--f-color-level-1-soft)',
  2: 'border-(--f-color-level-2) bg-(--f-color-level-2-soft)',
  3: 'border-(--f-color-level-3) bg-(--f-color-level-3-soft)',
};
/** What the legend explains: only what is drawn inside the visible map. */
type Shown = {
  quakes: boolean;
  clusters: boolean;
  plates: boolean;
  hazards: { source: string; kind: MapHazard['kind'] }[];
  areas: { source: string; level?: 1 | 2 | 3; label?: string }[];
  embassies: boolean;
  point: boolean;
  you: boolean;
};
const NOTHING: Shown = {
  quakes: false,
  clusters: false,
  plates: false,
  hazards: [],
  areas: [],
  embassies: false,
  point: false,
  you: false,
};
export default function WebMap({
  label,
  events,
  view,
  frame = null,
  geo,
  point,
  selected,
  onSelect,
  onBounds,
  lang,
  embassies,
  hazards = [],
  areas = [],
  cooperative = false,
  action,
  legendId,
}: {
  label?: string;
  embassies: Embassy[];
  hazards?: MapHazard[];
  areas?: MapArea[];
  /**
   * A map inside a scrolling page: on touch screens one finger keeps scrolling the page, and the
   * map moves only after a tap on it (until the page is touched elsewhere).
   */
  cooperative?: boolean;
  events: Quake[];
  view: MapView;
  /** The area a `fit` view frames: the country with its earthquakes. */
  frame?: Bounds | null;
  geo: Geo | null;
  point: [number, number] | null;
  selected: string | undefined;
  onSelect: (q: Quake) => void;
  /** The visible area after every move; `moved` when the person moved it (not the app). */
  onBounds: (b: Bounds, moved: boolean) => void;
  lang: Lang;
  /** A small action over the map, such as "Search this area". */
  action?: ReactNode;
  /** The legend's id: the target of a link that skips the map. */
  legendId?: string;
}) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const [tileError, setTileError] = useState(false);
  const touch =
    cooperative && typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const [active, setActive] = useState(false);
  const [shown, setShown] = useState<Shown>(NOTHING);
  const [platesDrawn, setPlatesDrawn] = useState(false);
  const el = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    quakes = useRef<L.MarkerClusterGroup | null>(null),
    focus = useRef<L.LayerGroup | null>(null),
    extras = useRef<L.LayerGroup | null>(null),
    hazardLayer = useRef<L.LayerGroup | null>(null),
    areaLayer = useRef<L.LayerGroup | null>(null),
    plates = useRef<L.GeoJSON | null>(null),
    callback = useRef({ onSelect, onBounds }),
    glMap = useRef<GlMap | null>(null);
  callback.current = { onSelect, onBounds };
  // The latest props, for map event handlers registered once.
  const latest = useRef({ view, frame, events, hazards, areas, embassies, point, geo });
  latest.current = { view, frame, events, hazards, areas, embassies, point, geo };
  // The view follows the requested frame until the person moves the map. Moves the app makes
  // itself are marked, so they never count as the person's.
  const fitting = useRef(!!view.fit),
    byApp = useRef(false),
    moved = useRef(false);
  const place = () => {
    const m = map.current;
    if (!m) return;
    const { view: v, frame: f } = latest.current;
    const size = m.getSize();
    moved.current = false;
    byApp.current = true;
    try {
      if (fitting.current && f && size.x > 100 && size.y > 100)
        m.fitBounds(
          [
            [f.south, f.west],
            [f.north, f.east],
          ],
          FIT,
        );
      else m.setView([v.lat, v.lng], v.zoom, { animate: false });
    } finally {
      byApp.current = false;
    }
  };
  const measureFrame = useRef(0);
  const measure = () => {
    cancelAnimationFrame(measureFrame.current);
    measureFrame.current = requestAnimationFrame(() => {
      const m = map.current,
        box = el.current?.getBoundingClientRect();
      if (!m || !box) return;
      const visible = m.getBounds();
      const inView = (lat: number, lng: number) => visible.contains([lat, lng]);
      const p = latest.current;
      const hazardKeys = new Map<string, Shown['hazards'][number]>();
      for (const h of p.hazards)
        if (inView(h.lat, h.lng) && !hazardKeys.has(h.source))
          hazardKeys.set(h.source, { source: h.source, kind: h.kind });
      const areaKeys = new Map<string, Shown['areas'][number]>();
      for (const a of p.areas)
        if (
          a.polygons.some((ring) => ring.length && L.latLngBounds(ring).intersects(visible)) &&
          !areaKeys.has(`${a.source}:${a.level}`)
        )
          areaKeys.set(`${a.source}:${a.level}`, {
            source: a.source,
            level: a.level,
            label: a.levelLabel,
          });
      const next: Shown = {
        quakes: p.events.some((q) => inView(q.lat, q.lng)),
        // Clusters exist a little beyond the edges: only those on screen count.
        clusters: [...(el.current?.querySelectorAll('.marker-cluster') ?? [])].some((c) => {
          const r = c.getBoundingClientRect();
          return (
            r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom
          );
        }),
        plates:
          !!plates.current &&
          plates.current
            .getLayers()
            .some((line) => (line as L.Polyline).getBounds().intersects(visible)),
        hazards: [...hazardKeys.values()],
        areas: [...areaKeys.values()].sort((a, b) => (b.level ?? 0) - (a.level ?? 0)),
        embassies: p.embassies.some((e) => inView(e.lat, e.lng)),
        point: !!p.point && inView(p.point[0], p.point[1]),
        you: !!p.geo && inView(p.geo.lat, p.geo.lng),
      };
      setShown((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    });
  };
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, {
      scrollWheelZoom: false,
      worldCopyJump: true,
      maxZoom: 18,
      // Fractional zoom, so a fitted country fills the frame instead of the next whole level.
      zoomSnap: 0.25,
      dragging: !touch,
      // The credits are written under the map, in the card (see the legend below).
      attributionControl: false,
      // Added below with lucide icons, styled as shadcn outline buttons.
      zoomControl: false,
    });
    map.current = m;
    const zoom = L.control
      .zoom({
        zoomInText: renderToStaticMarkup(<PlusIcon className="size-4" aria-hidden="true" />),
        zoomOutText: renderToStaticMarkup(<MinusIcon className="size-4" aria-hidden="true" />),
      })
      .addTo(m);
    zoom.getContainer()?.classList.add(...zoomBar.split(' '));
    zoom
      .getContainer()
      ?.querySelectorAll('a')
      .forEach((a) => a.classList.add(...zoomButton.split(' ')));
    // A move the app did not make is the person's: from then on the view stays theirs.
    m.on('movestart zoomstart', () => {
      if (byApp.current) return;
      moved.current = true;
      fitting.current = false;
    });
    place();
    // On a touch screen in a scrolling page, a tap hands the gestures to the map; touching the
    // page anywhere else gives them back to scrolling.
    let release: (() => void) | undefined;
    if (touch) {
      m.on('click', () => {
        m.dragging.enable();
        setActive(true);
      });
      const outside = (event: TouchEvent) => {
        if (el.current && !el.current.contains(event.target as Node)) {
          m.dragging.disable();
          setActive(false);
        }
      };
      document.addEventListener('touchstart', outside, { passive: true });
      release = () => document.removeEventListener('touchstart', outside);
    }
    quakes.current = L.markerClusterGroup({
      maxClusterRadius: 32,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
    }).addTo(m);
    quakes.current.on('animationend', measure);
    areaLayer.current = L.layerGroup().addTo(m);
    extras.current = L.layerGroup().addTo(m);
    hazardLayer.current = L.layerGroup().addTo(m);
    focus.current = L.layerGroup().addTo(m);
    // Pins and clusters repeat what the lists show. They leave the Tab order so keyboard focus
    // never lands on a pin outside the visible map or behind the phone's bottom bar.
    const pane = m.getPane('markerPane');
    const unfocus = () =>
      pane?.querySelectorAll<HTMLElement>('[tabindex]').forEach((el) => {
        if (el.getAttribute('tabindex') !== '-1') el.setAttribute('tabindex', '-1');
      });
    const pins = new MutationObserver(unfocus);
    if (pane)
      pins.observe(pane, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['tabindex'],
      });
    const report = () => {
      const b = m.getBounds();
      callback.current.onBounds(
        {
          south: b.getSouth(),
          north: b.getNorth(),
          west: b.getWest(),
          east: b.getEast(),
        },
        moved.current,
      );
      measure();
    };
    m.on('moveend', report);
    // A new size reframes a view the person has not moved (the side column on a wide screen).
    const resize = new ResizeObserver(() => {
      m.invalidateSize();
      if (fitting.current) place();
    });
    resize.observe(el.current);
    return () => {
      release?.();
      pins.disconnect();
      resize.disconnect();
      cancelAnimationFrame(measureFrame.current);
      m.off('moveend', report);
      m.stop();
      m.remove();
      map.current = null;
      quakes.current = null;
      extras.current = null;
      hazardLayer.current = null;
      areaLayer.current = null;
      focus.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    setTileError(false);
    let layer: L.Layer | null = null;
    let gone = false;
    // The base map: OpenFreeMap vector tiles (OpenStreetMap data; free, no key, no request limit),
    // drawn by MapLibre inside Leaflet. Loaded after the markers, so the first screen never waits
    // for it; offline or blocked, the markers and the list still work and the map says so.
    void (async () => {
      try {
        const [{ setWorkerUrl }, { default: workerUrl }] = await Promise.all([
          import('maplibre-gl'),
          import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
          import('../styles/maplibre-gl.css'),
        ]);
        setWorkerUrl(workerUrl);
        await import('@maplibre/maplibre-gl-leaflet');
        if (gone || !map.current) return;
        const base = L.maplibreGL({ style: BASE_STYLE });
        base.addTo(map.current);
        const gl = base.getMaplibreMap();
        gl.on('error', () => setTileError(true));
        gl.on('load', () => labelIn(gl, langRef.current));
        glMap.current = gl;
        layer = base;
      } catch {
        if (!gone) setTileError(true);
      }
    })();
    return () => {
      gone = true;
      glMap.current = null;
      layer?.remove();
    };
  }, []);
  // Place names follow the reader's language when the map has them.
  const langRef = useRef(lang);
  langRef.current = lang;
  useEffect(() => {
    if (glMap.current?.isStyleLoaded()) labelIn(glMap.current, lang);
  }, [lang]);
  // Tectonic plate boundaries, as context for where earthquakes cluster. Drawn under the markers.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const controller = new AbortController();
    if (!m.getPane('plates')) {
      const pane = m.createPane('plates');
      pane.style.zIndex = '350';
      pane.style.pointerEvents = 'none';
    }
    fetch('/data/plates.json', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(Error('plates'))))
      .then((data: GeoJSON.FeatureCollection) => {
        const options: L.GeoJSONOptions & L.PathOptions = {
          pane: 'plates',
          interactive: false,
          className: 'f-map-plates',
        };
        plates.current = L.geoJSON(data, options).addTo(m);
        setPlatesDrawn(true);
        measure();
      })
      // Context only: without it the map, markers and list are unchanged.
      .catch(() => {});
    return () => {
      controller.abort();
      plates.current?.remove();
      plates.current = null;
    };
  }, []);
  // A requested view: a new country (fitted) or a point to centre on.
  useEffect(() => {
    fitting.current = !!view.fit;
    place();
  }, [view]);
  // The frame changes as borders and earthquakes arrive: followed until the person moves the map.
  const frameKey = frame
    ? [frame.south, frame.north, frame.west, frame.east].map((n) => n.toFixed(2)).join(',')
    : '';
  useEffect(() => {
    if (fitting.current) place();
  }, [frameKey]);
  // Rebuild markers only when the visible events actually change, not on every new array.
  // Rebuilding resets keyboard focus and expanded clusters.
  const eventKey = events.map((q) => `${q.id}:${q.mag}:${q.lat}:${q.lng}`).join('|');
  useEffect(() => {
    quakes.current?.clearLayers();
    focus.current?.clearLayers();
    latest.current.events.forEach((q) => {
      const size = q.id === selected ? 42 : 34;
      const icon = L.divIcon({
        className: `f-pin f-pin-band-${magnitudeBand(q.mag)}${q.id === selected ? ' f-pin-selected' : ''}`,
        html: renderToStaticMarkup(<b>{q.mag?.toFixed(1) ?? '—'}</b>),
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
      });
      const name = `${pick(lang, 'Magnitud', 'Magnitude', 'Magnitude')} ${q.mag?.toFixed(1) ?? '—'} · ${quakeRegion(q, lang)?.text ?? displayPlace(q.place)}`;
      L.marker([q.lat, q.lng], {
        icon,
        title: name,
        alt: name,
        zIndexOffset: q.id === selected ? 1000 : 0,
      })
        .on('click', () => callback.current.onSelect(q))
        .addTo(q.id === selected ? focus.current! : quakes.current!);
    });
    measure();
  }, [eventKey, selected, lang]);
  useEffect(() => {
    const group = extras.current;
    if (!group) return;
    map.current?.closePopup();
    group.clearLayers();
    embassies.forEach((e) => {
      const label = e.name[langIndex(lang)];
      const icon = L.divIcon({
        className: 'f-pin-embassy',
        html: renderToStaticMarkup(
          <FlagIcon className="size-5" fill="currentColor" strokeWidth={1.75} />,
        ),
        iconSize: [32, 32],
        iconAnchor: [16, 30],
      });
      const card = document.createElement('div');
      const name = document.createElement('strong');
      name.className = popupTitle;
      name.textContent = label;
      card.append(name);
      const p = document.createElement('p');
      p.className = popupText;
      p.textContent = e.address;
      card.append(p);
      const a = document.createElement('a');
      a.className = popupLink;
      a.href = directionsUrl(e, 'walking');
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.textContent = pick(
        lang,
        'Cómo llegar · Google Maps',
        'Directions · Google Maps',
        'Como chegar · Google Maps',
      );
      card.append(a);
      const warning = document.createElement('p');
      warning.className = popupText;
      warning.textContent = pick(
        lang,
        'Ubicación aproximada. No es refugio ni ruta de evacuación.',
        'Approximate location. Not a shelter or evacuation route.',
        'Localização aproximada. Não é abrigo nem rota de evacuação.',
      );
      card.append(warning);
      L.marker([e.lat, e.lng], { icon, title: label, alt: label })
        .bindPopup(card, popupOptions)
        .addTo(group);
    });
    if (geo) {
      L.circle([geo.lat, geo.lng], {
        radius: geo.accuracy,
        className: 'f-map-you-area',
        interactive: false,
      }).addTo(group);
      L.circleMarker([geo.lat, geo.lng], { radius: 7, className: 'f-map-you' })
        .bindTooltip(
          pick(
            lang,
            'Tu ubicación aproximada',
            'Your approximate location',
            'Sua localização aproximada',
          ),
          { className: tooltipClass },
        )
        .addTo(group);
    }
    if (point) {
      const personal = pick(
        lang,
        'Punto personal · no verificado',
        'Personal point · not verified',
        'Ponto pessoal · não verificado',
      );
      const icon = L.divIcon({
        className: 'f-pin-personal',
        html: renderToStaticMarkup(
          <FlagIcon className="size-7" fill="currentColor" strokeWidth={1.5} />,
        ),
        iconSize: [32, 32],
        iconAnchor: [16, 30],
      });
      L.marker(point, {
        icon,
        title: personal,
        alt: personal,
      })
        .bindTooltip(personal, { className: tooltipClass })
        .addTo(group);
    }
    measure();
  }, [geo, point, lang, embassies]);
  const areaKey = areas.map((a) => `${a.id}:${a.level}:${a.polygons.length}`).join('|');
  useEffect(() => {
    const group = areaLayer.current;
    if (!group) return;
    group.clearLayers();
    latest.current.areas.forEach((a) => {
      const card = document.createElement('div');
      const title = document.createElement('strong');
      title.className = popupTitle;
      title.textContent = a.levelLabel ? `${a.title} · ${a.levelLabel}` : a.title;
      const detail = document.createElement('p');
      detail.className = popupText;
      detail.textContent = a.detail;
      const note = document.createElement('p');
      note.className = popupText;
      note.textContent = pick(
        lang,
        'Es el área que cubre el aviso, no un mapa de calles inundadas.',
        'This is the area the warning covers, not a map of flooded streets.',
        'É a área coberta pelo aviso, não um mapa de ruas inundadas.',
      );
      card.append(title, detail, note);
      if (a.url) {
        const link = document.createElement('a');
        link.className = popupLink;
        link.href = a.url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.textContent = pick(
          lang,
          `Aviso de ${a.source}`,
          `${a.source} warning`,
          `Aviso · ${a.source}`,
        );
        card.append(link);
      }
      // Coloured by the agency's level, as its row on Situación; a level not stated is neutral.
      L.polygon(a.polygons, {
        className: `f-map-area f-map-area-${a.level ?? 0}`,
        interactive: true,
      })
        .bindPopup(card, popupOptions)
        .addTo(group);
    });
    measure();
  }, [areaKey, lang]);
  const hazardKey = hazards.map((h) => `${h.id}:${h.level}:${h.lat}:${h.lng}`).join('|');
  useEffect(() => {
    const group = hazardLayer.current;
    if (!group) return;
    group.clearLayers();
    latest.current.hazards.forEach((h) => {
      const Icon = hazardIcons[h.kind];
      const icon = L.divIcon({
        className: `f-pin-hazard f-pin-hazard-${h.level}`,
        html: renderToStaticMarkup(<Icon className="size-5" strokeWidth={2.25} />),
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const card = document.createElement('div');
      const title = document.createElement('strong');
      title.className = popupTitle;
      title.textContent = h.title;
      const detail = document.createElement('p');
      detail.className = popupText;
      detail.textContent = h.detail;
      const note = document.createElement('p');
      note.className = popupText;
      note.textContent = pick(
        lang,
        `Posición publicada por ${h.source}. No delimita la zona afectada.`,
        `Position published by ${h.source}. It does not outline the affected area.`,
        `Posição publicada pela fonte (${h.source}). Não delimita a área afetada.`,
      );
      const link = document.createElement('a');
      link.className = popupLink;
      link.href = h.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = pick(
        lang,
        `Informe de ${h.source}`,
        `${h.source} report`,
        `Relatório · ${h.source}`,
      );
      card.append(title, detail, note, link);
      L.marker([h.lat, h.lng], { icon, title: h.title, alt: h.title, zIndexOffset: 500 })
        .bindPopup(card, popupOptions)
        .addTo(group);
    });
    measure();
  }, [hazardKey, lang]);
  useEffect(() => {
    const controls = map.current
      ?.getContainer()
      .querySelectorAll<HTMLAnchorElement>('.leaflet-control-zoom a');
    controls?.forEach((a, i) => {
      const label =
        i === 0
          ? pick(lang, 'Acercar mapa', 'Zoom in', 'Aproximar mapa')
          : pick(lang, 'Alejar mapa', 'Zoom out', 'Afastar mapa');
      a.title = label;
      a.setAttribute('aria-label', label);
    });
  }, [lang]);
  // The legend: one short key per kind of mark in view, in the order they are drawn.
  const keys: { id: string; swatch: ReactNode; text: string }[] = [
    ...(shown.quakes
      ? [
          {
            id: 'quake',
            swatch: <span className={cn(swatch, 'bg-(--f-mag-2)')} />,
            text: t('Sismo y magnitud', 'Earthquake and magnitude', 'Terremoto e magnitude'),
          },
        ]
      : []),
    ...(shown.clusters
      ? [
          {
            id: 'cluster',
            swatch: <span className={cn(swatch, 'rounded-full bg-(--f-neutral-700)')} />,
            text: t('Varios sismos', 'Several earthquakes', 'Vários terremotos'),
          },
        ]
      : []),
    ...shown.areas.map((a) => ({
      id: `area-${a.source}-${a.level}`,
      swatch: <span className={cn(swatch, 'border-2', areaSwatch[a.level ?? 0])} />,
      text: `${t(`Aviso ${a.source}`, `${a.source} warning`, `Aviso ${a.source}`)}${a.label ? ` · ${a.label}` : ''}`,
    })),
    ...shown.hazards.map((h) => {
      const Icon = hazardIcons[h.kind];
      return {
        id: `hazard-${h.source}`,
        swatch: (
          <span className={cn(swatch, 'rounded-full bg-(--f-neutral-700)')}>
            <Icon className="size-3" strokeWidth={2.5} />
          </span>
        ),
        text:
          h.source === 'NHC'
            ? t('Ciclón activo (NHC)', 'Active cyclone (NHC)', 'Ciclone ativo (NHC)')
            : h.source === 'GDACS'
              ? t('Alerta de GDACS', 'GDACS alert', 'Alerta do GDACS')
              : h.source,
      };
    }),
    ...(shown.plates
      ? [
          {
            id: 'plates',
            swatch: (
              <span className={cn(swatch, 'h-0 rounded-none border-t-2 border-(--f-map-plates)')} />
            ),
            text: t('Límite de placas', 'Plate boundary', 'Limite de placas'),
          },
        ]
      : []),
    ...(shown.embassies
      ? [
          {
            id: 'embassy',
            swatch: (
              <span className={cn(swatch, 'bg-(--f-map-embassy)')}>
                <FlagIcon className="size-2.5" fill="currentColor" />
              </span>
            ),
            text: t('Embajada', 'Embassy', 'Embaixada'),
          },
        ]
      : []),
    ...(shown.point
      ? [
          {
            id: 'point',
            swatch: (
              <span className={cn(swatch, 'text-(--f-map-personal)')}>
                <FlagIcon className="size-4" fill="currentColor" strokeWidth={1.5} />
              </span>
            ),
            text: t(
              'Tu punto, no verificado',
              'Your point, not verified',
              'Seu ponto, não verificado',
            ),
          },
        ]
      : []),
    ...(shown.you
      ? [
          {
            id: 'you',
            swatch: (
              <span
                className={cn(
                  swatch,
                  'rounded-full border-2 border-white bg-(--f-map-you) shadow-[0_2px_6px_rgb(0_0_0/20%)]',
                )}
              />
            ),
            text: t('Tu ubicación', 'Your location', 'Sua localização'),
          },
        ]
      : []),
  ];
  const published = shown.quakes || shown.hazards.length > 0 || shown.areas.length > 0;
  return (
    <div className="f-map-frame flex h-full flex-col">
      <div className="f-map-stage relative min-h-(--f-map-height) flex-auto">
        <div
          ref={el}
          className="f-map-canvas absolute inset-0 z-0 bg-(--f-map-ground) font-sans text-xs"
          role="region"
          aria-label={
            label ||
            pick(
              lang,
              'Mapa de sismos y punto personal',
              'Earthquake and personal point map',
              'Mapa de terremotos e ponto pessoal',
            )
          }
        />
        {touch && !active && (
          <p
            className="f-map-hint pointer-events-none absolute top-3 right-3 z-[1] m-0 rounded-full bg-primary/80 px-3 py-1 text-xs whitespace-nowrap text-primary-foreground"
            aria-hidden="true"
          >
            {pick(
              lang,
              'Toca el mapa para moverlo',
              'Tap the map to move it',
              'Toque o mapa para movê-lo',
            )}
          </p>
        )}
        {(action || tileError) && (
          <div className="f-map-overlay pointer-events-none absolute inset-x-3 bottom-3 z-[1] grid justify-items-center gap-2 *:pointer-events-auto *:shadow-md">
            {action}
            {tileError && (
              <p
                className="f-map-error m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                role="status"
              >
                {pick(
                  lang,
                  'Algunas partes del mapa no cargaron. Consulta la lista de eventos.',
                  'Some map tiles did not load. Use the event list.',
                  'Algumas partes do mapa não carregaram. Consulte a lista de eventos.',
                )}
              </p>
            )}
          </div>
        )}
      </div>
      <div
        className="f-map-legend grid gap-2 border-t px-4 py-3 text-xs text-muted-foreground outline-none"
        id={legendId}
        tabIndex={legendId ? -1 : undefined}
      >
        {keys.length > 0 && (
          <ul
            className="f-map-keys m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs leading-snug text-muted-foreground"
            aria-label={t('Leyenda del mapa', 'Map legend', 'Legenda do mapa')}
          >
            {keys.map((k) => (
              <li key={k.id} className="f-map-key inline-flex items-center gap-2">
                {k.swatch}
                {k.text}
              </li>
            ))}
          </ul>
        )}
        {published && (
          <Note>
            {t(
              'Puntos publicados, no zonas de riesgo.',
              'Published points, not hazard zones.',
              'Pontos publicados, não zonas de risco.',
            )}
          </Note>
        )}
        <p className="f-map-credits m-0 text-xs leading-snug text-muted-foreground [&_a]:text-inherit [&_a]:no-underline [&_a]:hover:underline [&_a]:focus-visible:underline">
          {[
            <a key="ofm" href="https://openfreemap.org" target="_blank" rel="noreferrer">
              OpenFreeMap
            </a>,
            <a key="omt" href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">
              © OpenMapTiles
            </a>,
            <Fragment key="osm">
              {t('Datos de ', 'Data from ', 'Dados do ')}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                OpenStreetMap
              </a>
            </Fragment>,
            ...(platesDrawn
              ? [
                  <a key="pb" href={PLATES_SOURCE} target="_blank" rel="noreferrer">
                    PB2002 (Bird, 2003)
                  </a>,
                ]
              : []),
            <a key="leaflet" href="https://leafletjs.com" target="_blank" rel="noreferrer">
              Leaflet
            </a>,
          ].map((part, i) => (
            <Fragment key={i}>
              {i > 0 && ' · '}
              {part}
            </Fragment>
          ))}
        </p>
      </div>
    </div>
  );
}
