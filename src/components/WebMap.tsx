import { magnitudeBand } from '../lib/magnitude.ts';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { renderToStaticMarkup } from 'react-dom/server';
import { DropIcon, FlagIcon, HurricaneIcon, MountainsIcon } from '@phosphor-icons/react';
import { directionsUrl, type Embassy } from '../lib/embassies.ts';
import { displayPlace, type Quake, type Bounds } from '../lib/domain.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
export type MapView = { lat: number; lng: number; zoom: number; key: number };
// A light, low-contrast style, so earthquakes, warnings and areas stand out on it.
const BASE_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const BASE_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';
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
const PLATES_ATTRIBUTION =
  '<a href="https://github.com/fraxen/tectonicplates" target="_blank" rel="noreferrer">PB2002 (Bird, 2003)</a>';
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
};
const hazardIcons = { cyclone: HurricaneIcon, flood: DropIcon, volcano: MountainsIcon };
export default function WebMap({
  label,
  events,
  view,
  geo,
  point,
  selected,
  onSelect,
  onBounds,
  lang,
  embassies,
  hazards = [],
  areas = [],
}: {
  label?: string;
  embassies: Embassy[];
  hazards?: MapHazard[];
  areas?: MapArea[];
  events: Quake[];
  view: MapView;
  geo: Geo | null;
  point: [number, number] | null;
  selected: string | undefined;
  onSelect: (q: Quake) => void;
  onBounds: (b: Bounds) => void;
  lang: Lang;
}) {
  const [tileError, setTileError] = useState(false);
  const el = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    quakes = useRef<L.MarkerClusterGroup | null>(null),
    focus = useRef<L.LayerGroup | null>(null),
    extras = useRef<L.LayerGroup | null>(null),
    hazardLayer = useRef<L.LayerGroup | null>(null),
    areaLayer = useRef<L.LayerGroup | null>(null),
    callback = useRef({ onSelect, onBounds }),
    glMap = useRef<GlMap | null>(null);
  callback.current = { onSelect, onBounds };
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, {
      scrollWheelZoom: false,
      worldCopyJump: true,
      maxZoom: 18,
    }).setView([view.lat, view.lng], view.zoom);
    map.current = m;
    quakes.current = L.markerClusterGroup({
      maxClusterRadius: 32,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
    }).addTo(m);
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
      callback.current.onBounds({
        south: b.getSouth(),
        north: b.getNorth(),
        west: b.getWest(),
        east: b.getEast(),
      });
    };
    m.on('moveend', report);
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(el.current);
    return () => {
      pins.disconnect();
      resize.disconnect();
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
        const base = L.maplibreGL({
          style: BASE_STYLE,
          attributionControl: { customAttribution: BASE_ATTRIBUTION },
        });
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
    let layer: L.GeoJSON | null = null;
    const controller = new AbortController();
    if (!m.getPane('plates')) {
      const pane = m.createPane('plates');
      pane.style.zIndex = '350';
      pane.style.pointerEvents = 'none';
    }
    fetch('/data/plates.json', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(Error('plates'))))
      .then((data: GeoJSON.FeatureCollection) => {
        layer = L.geoJSON(data, {
          pane: 'plates',
          interactive: false,
          attribution: PLATES_ATTRIBUTION,
          style: { color: '#8a4fb8', weight: 1.4, opacity: 0.6 },
        }).addTo(m);
      })
      // Context only: without it the map, markers and list are unchanged.
      .catch(() => {});
    return () => {
      controller.abort();
      layer?.remove();
    };
  }, []);
  useEffect(() => {
    map.current?.setView([view.lat, view.lng], view.zoom, { animate: false });
  }, [view]);
  // Rebuild markers only when the visible events actually change, not on every new array.
  // Rebuilding resets keyboard focus and expanded clusters.
  const eventKey = events.map((q) => `${q.id}:${q.mag}:${q.lat}:${q.lng}`).join('|');
  const latestEvents = useRef(events);
  latestEvents.current = events;
  useEffect(() => {
    quakes.current?.clearLayers();
    focus.current?.clearLayers();
    latestEvents.current.forEach((q) => {
      const size = q.id === selected ? 42 : 34;
      const icon = L.divIcon({
        className: `fw-pin fw-mag-band-${magnitudeBand(q.mag)}${q.id === selected ? ' fw-pin-selected' : ''}`,
        html: renderToStaticMarkup(<b>{q.mag?.toFixed(1) ?? '—'}</b>),
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
      });
      L.marker([q.lat, q.lng], {
        icon,
        title: `${pick(lang, 'Magnitud', 'Magnitude', 'Magnitude')} ${q.mag?.toFixed(1) ?? '—'} · ${displayPlace(q.place)}`,
        alt: `${pick(lang, 'Magnitud', 'Magnitude', 'Magnitude')} ${q.mag?.toFixed(1) ?? '—'} · ${displayPlace(q.place)}`,
        zIndexOffset: q.id === selected ? 1000 : 0,
      })
        .on('click', () => callback.current.onSelect(q))
        .addTo(q.id === selected ? focus.current! : quakes.current!);
    });
  }, [eventKey, selected, lang]);
  useEffect(() => {
    const group = extras.current;
    if (!group) return;
    map.current?.closePopup();
    group.clearLayers();
    embassies.forEach((e) => {
      const label = e.name[langIndex(lang)];
      const icon = L.divIcon({
        className: 'fw-embassy-pin',
        html: renderToStaticMarkup(<FlagIcon size={26} weight="fill" />),
        iconSize: [32, 32],
        iconAnchor: [16, 30],
      });
      const card = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = label;
      card.append(name);
      const p = document.createElement('p');
      p.textContent = e.address;
      card.append(p);
      const a = document.createElement('a');
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
      warning.textContent = pick(
        lang,
        'Ubicación aproximada. No es refugio ni ruta de evacuación.',
        'Approximate location. Not a shelter or evacuation route.',
        'Localização aproximada. Não é abrigo nem rota de evacuação.',
      );
      card.append(warning);
      L.marker([e.lat, e.lng], { icon, title: label, alt: label }).bindPopup(card).addTo(group);
    });
    if (geo) {
      L.circle([geo.lat, geo.lng], {
        radius: geo.accuracy,
        color: '#367aaa',
        weight: 1,
        fillOpacity: 0.12,
      }).addTo(group);
      L.circleMarker([geo.lat, geo.lng], {
        radius: 7,
        color: '#fff',
        weight: 3,
        fillColor: '#226b9c',
        fillOpacity: 1,
      })
        .bindTooltip(
          pick(
            lang,
            'Tu ubicación aproximada',
            'Your approximate location',
            'Sua localização aproximada',
          ),
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
        className: 'fw-hotel-pin',
        html: renderToStaticMarkup(<FlagIcon size={28} weight="fill" />),
        iconSize: [32, 32],
        iconAnchor: [16, 30],
      });
      L.marker(point, {
        icon,
        title: personal,
        alt: personal,
      })
        .bindTooltip(personal)
        .addTo(group);
    }
  }, [geo, point, lang, embassies]);
  const areaKey = areas.map((a) => `${a.id}:${a.polygons.length}`).join('|');
  const latestAreas = useRef(areas);
  latestAreas.current = areas;
  useEffect(() => {
    const group = areaLayer.current;
    if (!group) return;
    group.clearLayers();
    latestAreas.current.forEach((a) => {
      const card = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = a.title;
      const detail = document.createElement('p');
      detail.textContent = a.detail;
      const note = document.createElement('p');
      note.textContent = pick(
        lang,
        'Es el área que cubre el aviso, no un mapa de calles inundadas.',
        'This is the area the warning covers, not a map of flooded streets.',
        'É a área coberta pelo aviso, não um mapa de ruas inundadas.',
      );
      card.append(title, detail, note);
      if (a.url) {
        const link = document.createElement('a');
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
      L.polygon(a.polygons, {
        color: '#9a6512',
        weight: 1.5,
        dashArray: '6 4',
        fillColor: '#e0a33a',
        fillOpacity: 0.12,
        interactive: true,
      })
        .bindPopup(card)
        .addTo(group);
    });
  }, [areaKey, lang]);
  const hazardKey = hazards.map((h) => `${h.id}:${h.level}:${h.lat}:${h.lng}`).join('|');
  const latestHazards = useRef(hazards);
  latestHazards.current = hazards;
  useEffect(() => {
    const group = hazardLayer.current;
    if (!group) return;
    group.clearLayers();
    latestHazards.current.forEach((h) => {
      const Icon = hazardIcons[h.kind];
      const icon = L.divIcon({
        className: `fw-hazard-pin fw-hazard-pin-${h.level}`,
        html: renderToStaticMarkup(<Icon size={22} weight="bold" />),
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const card = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = h.title;
      const detail = document.createElement('p');
      detail.textContent = h.detail;
      const note = document.createElement('p');
      note.textContent = pick(
        lang,
        `Posición publicada por ${h.source}. No delimita la zona afectada.`,
        `Position published by ${h.source}. It does not outline the affected area.`,
        `Posição publicada pela fonte (${h.source}). Não delimita a área afetada.`,
      );
      const link = document.createElement('a');
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
        .bindPopup(card)
        .addTo(group);
    });
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
  return (
    <div className="fw-map-wrapper">
      <div
        ref={el}
        className="fw-map"
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
      {tileError && (
        <div className="fw-map-error" role="status">
          {pick(
            lang,
            'Algunas partes del mapa no cargaron. Consulta la lista de eventos.',
            'Some map tiles did not load. Use the event list.',
            'Algumas partes do mapa não carregaram. Consulte a lista de eventos.',
          )}
        </div>
      )}
    </div>
  );
}
