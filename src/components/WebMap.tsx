import { magnitudeBand } from '../lib/magnitude.ts';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { FlagIcon } from '@phosphor-icons/react';
import { directionsUrl, type Embassy } from '../lib/embassies.ts';
import type { Quake, Bounds } from '../lib/domain.ts';
export type MapView = { lat: number; lng: number; zoom: number; key: number };
export type Geo = { lat: number; lng: number; accuracy: number; at: number };
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
}: {
  label?: string;
  embassies: Embassy[];
  events: Quake[];
  view: MapView;
  geo: Geo | null;
  point: [number, number] | null;
  selected: string | undefined;
  onSelect: (q: Quake) => void;
  onBounds: (b: Bounds) => void;
  lang: string;
}) {
  const [tileError, setTileError] = useState(false);
  const el = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    quakes = useRef<L.MarkerClusterGroup | null>(null),
    focus = useRef<L.LayerGroup | null>(null),
    extras = useRef<L.LayerGroup | null>(null),
    callback = useRef({ onSelect, onBounds });
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
    extras.current = L.layerGroup().addTo(m);
    focus.current = L.layerGroup().addTo(m);
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
      resize.disconnect();
      m.off('moveend', report);
      m.stop();
      m.remove();
      map.current = null;
      quakes.current = null;
      extras.current = null;
      focus.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    setTileError(false);
    const layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      updateWhenIdle: true,
      updateWhenZooming: false,
      referrerPolicy: 'strict-origin-when-cross-origin',
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on('tileerror', () => setTileError(true))
      .addTo(map.current);
    return () => {
      layer.off();
      layer.remove();
    };
  }, []);
  useEffect(() => {
    map.current?.setView([view.lat, view.lng], view.zoom, { animate: false });
  }, [view]);
  useEffect(() => {
    quakes.current?.clearLayers();
    focus.current?.clearLayers();
    events.forEach((q) => {
      const size = q.id === selected ? 42 : 34;
      const icon = L.divIcon({
        className: `fw-pin fw-mag-band-${magnitudeBand(q.mag)}${q.id === selected ? ' fw-pin-selected' : ''}`,
        html: renderToStaticMarkup(<b>{q.mag?.toFixed(1) ?? '—'}</b>),
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
      });
      L.marker([q.lat, q.lng], {
        icon,
        title: `${lang === 'es' ? 'Magnitud' : 'Magnitude'} ${q.mag?.toFixed(1) ?? '—'} · ${q.place}`,
        alt: `${lang === 'es' ? 'Magnitud' : 'Magnitude'} ${q.mag?.toFixed(1) ?? '—'} · ${q.place}`,
        zIndexOffset: q.id === selected ? 1000 : 0,
      })
        .on('click', () => callback.current.onSelect(q))
        .addTo(q.id === selected ? focus.current! : quakes.current!);
    });
  }, [events, selected, lang]);
  useEffect(() => {
    const group = extras.current;
    if (!group) return;
    map.current?.closePopup();
    group.clearLayers();
    embassies.forEach((e) => {
      const label = e.name[lang === 'es' ? 0 : 1];
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
      a.textContent = lang === 'es' ? 'Cómo llegar · Google Maps' : 'Directions · Google Maps';
      card.append(a);
      const warning = document.createElement('p');
      warning.textContent =
        lang === 'es'
          ? 'Ubicación aproximada. No es refugio ni ruta de evacuación.'
          : 'Approximate location. Not a shelter or evacuation route.';
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
        .bindTooltip(lang === 'es' ? 'Tu ubicación aproximada' : 'Your approximate location')
        .addTo(group);
    }
    if (point) {
      const icon = L.divIcon({
        className: 'fw-hotel-pin',
        html: renderToStaticMarkup(<FlagIcon size={28} weight="fill" />),
        iconSize: [32, 32],
        iconAnchor: [16, 30],
      });
      L.marker(point, {
        icon,
        title: lang === 'es' ? 'Punto personal · no verificado' : 'Personal point · not verified',
        alt: lang === 'es' ? 'Punto personal · no verificado' : 'Personal point · not verified',
      })
        .bindTooltip(
          lang === 'es' ? 'Punto personal · no verificado' : 'Personal point · not verified',
        )
        .addTo(group);
    }
  }, [geo, point, lang, embassies]);
  useEffect(() => {
    const controls = map.current
      ?.getContainer()
      .querySelectorAll<HTMLAnchorElement>('.leaflet-control-zoom a');
    controls?.forEach((a, i) => {
      const label =
        lang === 'es'
          ? i === 0
            ? 'Acercar mapa'
            : 'Alejar mapa'
          : i === 0
            ? 'Zoom in'
            : 'Zoom out';
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
          (lang === 'es' ? 'Mapa de sismos y punto personal' : 'Earthquake and personal point map')
        }
      />
      {tileError && (
        <div className="fw-map-error" role="status">
          {lang === 'es'
            ? 'Algunas partes del mapa no cargaron. Consulta la lista de eventos.'
            : 'Some map tiles did not load. Use the event list.'}
        </div>
      )}
    </div>
  );
}
