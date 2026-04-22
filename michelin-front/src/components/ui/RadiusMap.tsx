import { useEffect, useRef } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY ?? '';

interface Props {
  coords: { lat: number; lng: number } | null;
  radiusKm: number;
}

function buildCircle(center: [number, number], radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center;
  const latRad = (lat * Math.PI) / 180;
  const pts: [number, number][] = [];
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    pts.push([
      lng + (radiusKm / (111.32 * Math.cos(latRad))) * Math.sin(a),
      lat + (radiusKm / 111.32) * Math.cos(a),
    ]);
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [pts] }, properties: {} };
}

// Zoomed out enough to always see the full circle with some padding
function zoomForRadius(km: number): number {
  if (km <= 1) return 12;
  if (km <= 2) return 11;
  if (km <= 4) return 10.5;
  if (km <= 6) return 10;
  if (km <= 10) return 9.5;
  if (km <= 15) return 9;
  return 8.5;
}

function updateSources(map: maptilersdk.Map, center: [number, number], radiusKm: number) {
  (map.getSource('zone') as maptilersdk.GeoJSONSource | undefined)
    ?.setData(buildCircle(center, radiusKm));
  (map.getSource('user') as maptilersdk.GeoJSONSource | undefined)
    ?.setData({ type: 'Feature', geometry: { type: 'Point', coordinates: center }, properties: {} });
}

export function RadiusMap({ coords, radiusKm }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const loadedRef = useRef(false);

  // Keep latest values accessible inside event callbacks without re-initialising
  const stateRef = useRef({ coords, radiusKm });
  useEffect(() => { stateRef.current = { coords, radiusKm }; });

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initCenter: [number, number] = [2.35, 48.85]; // Paris fallback

    const map = new maptilersdk.Map({
      container: containerRef.current,
      style: maptilersdk.MapStyle.STREETS,
      center: initCenter,
      zoom: zoomForRadius(radiusKm),
      attributionControl: false,
      navigationControl: false,
      projection: 'mercator',
    });

    map.on('load', () => {
      const { coords: c, radiusKm: r } = stateRef.current;
      const center: [number, number] = c ? [c.lng, c.lat] : initCenter;

      map.addSource('zone', { type: 'geojson', data: buildCircle(center, r) });
      map.addLayer({ id: 'zone-fill', type: 'fill', source: 'zone',
        paint: { 'fill-color': '#ba0b2f', 'fill-opacity': 0.15 } });
      map.addLayer({ id: 'zone-stroke', type: 'line', source: 'zone',
        paint: { 'line-color': '#ba0b2f', 'line-width': 2.5, 'line-opacity': 0.8 } });

      map.addSource('user', { type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: center }, properties: {} } });
      map.addLayer({ id: 'user-halo', type: 'circle', source: 'user',
        paint: { 'circle-radius': 12, 'circle-color': '#ba0b2f', 'circle-opacity': 0.2 } });
      map.addLayer({ id: 'user-dot', type: 'circle', source: 'user',
        paint: { 'circle-radius': 6, 'circle-color': '#ba0b2f',
          'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } });

      // Jump to real coords if already available
      if (c) map.jumpTo({ center, zoom: zoomForRadius(r) });

      loadedRef.current = true;
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; loadedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update circle + position whenever coords or radius change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const center: [number, number] = coords ? [coords.lng, coords.lat] : [2.35, 48.85];
    updateSources(map, center, radiusKm);
    map.flyTo({ center, zoom: zoomForRadius(radiusKm), duration: 500, essential: true });
  }, [coords, radiusKm]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none z-10">
        <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>near_me</span>
        <span className="text-xs font-black text-on-surface">{radiusKm} km</span>
      </div>
    </div>
  );
}
