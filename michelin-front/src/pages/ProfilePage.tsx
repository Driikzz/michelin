import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { TopNav } from '../components/layout/TopNav';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import type { GameHistoryEntry } from '../types/api';

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY ?? '';

const PARIS: [number, number] = [2.35, 48.85];

function xpProgress(xp: number, level: number) {
  const xpStart = level * level * 10;
  const xpEnd = (level + 1) * (level + 1) * 10;
  const inLevel = Math.max(0, xp - xpStart);
  const needed = xpEnd - xpStart;
  return { inLevel, needed, pct: Math.max(0, Math.min(100, Math.round((inLevel / needed) * 100))) };
}

function avatarUrl(id: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4`;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface Badge {
  name: string;
  icon: string;
  bg: string;
  text: string;
  ring: string;
  next: string | null; // next badge name, for display
}

function getBadge(level: number): Badge {
  if (level >= 25) return {
    name: 'Chef Inspecteur',    icon: 'workspace_premium',
    bg: 'bg-gradient-to-br from-[#ffd06b] to-[#a67c00]',
    text: 'text-white',         ring: 'ring-[#a67c00]/30',
    next: null,
  };
  if (level >= 18) return {
    name: 'Inspecteur Sénior',  icon: 'military_tech',
    bg: 'bg-gradient-to-br from-[#8f0020] to-[#5a0013]',
    text: 'text-white',         ring: 'ring-[#8f0020]/30',
    next: 'Chef Inspecteur',
  };
  if (level >= 13) return {
    name: 'Inspecteur Michelin', icon: 'badge',
    bg: 'bg-gradient-to-br from-[#ba0b2f] to-[#8f0020]',
    text: 'text-white',          ring: 'ring-[#ba0b2f]/30',
    next: 'Inspecteur Sénior',
  };
  if (level >= 9) return {
    name: 'Inspecteur Stagiaire', icon: 'school',
    bg: 'bg-gradient-to-br from-[#775800] to-[#5a4100]',
    text: 'text-white',            ring: 'ring-[#775800]/30',
    next: 'Inspecteur Michelin',
  };
  if (level >= 6) return {
    name: 'Bib Gourmand',     icon: 'mood',
    bg: 'bg-gradient-to-br from-[#f8bd2a] to-[#c99600]',
    text: 'text-[#3d2c00]',   ring: 'ring-[#f8bd2a]/40',
    next: 'Inspecteur Stagiaire',
  };
  if (level >= 4) return {
    name: 'Fin Gourmet',      icon: 'restaurant',
    bg: 'bg-surface-container-high',
    text: 'text-on-surface/70', ring: 'ring-outline-variant/30',
    next: 'Bib Gourmand',
  };
  if (level >= 2) return {
    name: 'Gastronome',       icon: 'dining',
    bg: 'bg-surface-container-high',
    text: 'text-on-surface/70', ring: 'ring-outline-variant/30',
    next: 'Fin Gourmet',
  };
  return {
    name: 'Curieux',          icon: 'explore',
    bg: 'bg-surface-container-high',
    text: 'text-on-surface/60', ring: 'ring-outline-variant/20',
    next: 'Gastronome',
  };
}

function makeMarkerEl(index: number): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 28px; height: 28px; border-radius: 50%;
    background-color: #ba0b2f;
    border: 2.5px solid #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background-color 0.15s, box-shadow 0.15s, border-color 0.15s;
  `;
  const span = document.createElement('span');
  span.style.cssText = 'color: #fff; font-size: 11px; font-weight: 900; font-family: system-ui, sans-serif; line-height: 1; pointer-events: none;';
  span.textContent = String(index + 1);
  el.appendChild(span);
  return el;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<{ marker: maptilersdk.Marker; el: HTMLDivElement; entryIndex: number }[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const historyRef = useRef<GameHistoryEntry[]>([]);

  useEffect(() => {
    refreshUser().catch(() => {});
    userService
      .getMyHistory()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync historyRef so map callbacks can access latest history without re-init
  useEffect(() => { historyRef.current = history; }, [history]);

  // Build / rebuild map whenever history changes
  useEffect(() => {
    if (!mapContainerRef.current || historyLoading) return;

    // Destroy previous instance
    if (mapRef.current) {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new maptilersdk.Map({
      container: mapContainerRef.current,
      style: maptilersdk.MapStyle.STREETS,
      center: PARIS,
      zoom: 5,
      attributionControl: false,
      navigationControl: false,
      projection: 'mercator',
    });

    mapRef.current = map;

    map.on('load', () => {
      const entries = historyRef.current;
      const withCoords = entries.filter(e => e.latitude != null && e.longitude != null);

      if (withCoords.length === 0) return;

      // Fit bounds to all markers
      const bounds = new maptilersdk.LngLatBounds();
      withCoords.forEach(e => bounds.extend([e.longitude!, e.latitude!]));

      if (withCoords.length === 1) {
        map.flyTo({ center: [withCoords[0].longitude!, withCoords[0].latitude!], zoom: 13, duration: 0 });
      } else {
        map.fitBounds(bounds, { padding: 60, duration: 0, maxZoom: 14 });
      }

      // Draw connective line between markers (chronological path, oldest first)
      const coords = [...withCoords].reverse().map(e => [e.longitude!, e.latitude!] as [number, number]);
      if (coords.length >= 2) {
        map.addSource('path', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
        });
        map.addLayer({
          id: 'path-line',
          type: 'line',
          source: 'path',
          paint: { 'line-color': '#ba0b2f', 'line-width': 2, 'line-opacity': 0.5, 'line-dasharray': [3, 3] },
        });
      }

      // Add numbered markers
      entries.forEach((entry, idx) => {
        if (entry.latitude == null || entry.longitude == null) return;

        const el = makeMarkerEl(idx);
        const marker = new maptilersdk.Marker({ element: el, anchor: 'center' })
          .setLngLat([entry.longitude, entry.latitude])
          .addTo(map);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setActiveIndex(idx);
          cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });

        markersRef.current.push({ marker, el, entryIndex: idx });
      });
    });

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, historyLoading]);

  // Update marker styles when activeIndex changes
  useEffect(() => {
    markersRef.current.forEach(({ el, entryIndex }) => {
      const active = entryIndex === activeIndex;
      el.style.backgroundColor = active ? '#8f0020' : '#ba0b2f';
      el.style.boxShadow = active
        ? '0 0 0 3px rgba(186,11,47,0.5), 0 2px 10px rgba(0,0,0,0.45)'
        : '0 2px 8px rgba(0,0,0,0.35)';
      el.style.borderColor = active ? '#ffcdd2' : '#ffffff';
    });
  }, [activeIndex]);

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <TopNav />
        <div className="flex-grow flex items-center justify-center text-on-surface/40 text-sm font-bold">
          Chargement du profil…
        </div>
      </div>
    );
  }

  const safeXp = user.xp ?? 0;
  const safeLevel = user.level ?? 1;
  const safeStreak = user.streak ?? 0;
  const { inLevel, needed, pct } = xpProgress(safeXp, safeLevel);
  const badge = getBadge(safeLevel);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <button
          onClick={() => navigate('/lobby')}
          className="flex items-center gap-2 text-sm font-bold text-on-surface/50 hover:text-on-surface transition-colors mb-6"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          {t('common.back')}
        </button>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Profile card ── */}
          <article className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_16px_45px_rgba(28,27,27,0.08)] border border-outline-variant/20 flex flex-col gap-6">

            {/* Avatar + name */}
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={avatarUrl(user.id)}
                  alt={user.username}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-surface-container-low bg-surface-container-low"
                />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-tertiary-fixed-dim text-[10px] font-black px-2 py-1 text-on-surface">
                  LVL {safeLevel}
                </span>
              </div>
              <div className="min-w-0 pt-1">
                <h1 className="text-2xl font-black tracking-tight truncate">{user.username}</h1>
                <p className="text-sm text-on-surface/50 mt-0.5 truncate">{user.email}</p>
                {/* Badge */}
                <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full ring-1 ${badge.bg} ${badge.ring}`}>
                  <span
                    className={`material-symbols-outlined ${badge.text}`}
                    style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
                  >
                    {badge.icon}
                  </span>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${badge.text}`}>
                    {badge.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[11px] uppercase tracking-widest text-on-surface/45 font-bold mb-2">Série en cours</p>
                <p className="text-3xl font-black leading-none">{safeStreak}</p>
                <p className="text-xs text-primary-container font-bold mt-1">
                  {safeStreak > 0 ? `partie${safeStreak > 1 ? 's' : ''} d'affilée` : 'Commence à jouer !'}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[11px] uppercase tracking-widest text-on-surface/45 font-bold mb-2">Niveau</p>
                <p className="text-3xl font-black leading-none">{safeLevel}</p>
                <p className="text-xs text-tertiary-fixed-dim font-bold mt-1">{safeXp.toLocaleString('fr-FR')} XP total</p>
              </div>
            </div>

            {/* XP bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface/55 mb-2">
                <span>XP — Niveau {safeLevel + 1}</span>
                <span>{inLevel.toLocaleString('fr-FR')} / {needed.toLocaleString('fr-FR')}</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-container via-orange-500 to-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-on-surface/40 font-bold mt-1.5">
                {pct}% vers le niveau {safeLevel + 1}
                {badge.next && (
                  <span className="ml-1 text-on-surface/30">· prochain badge : {badge.next}</span>
                )}
              </p>
            </div>

            {/* Journey counter */}
            {history.length > 0 && (
              <div className="rounded-2xl bg-surface-container-low p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-on-surface/45 font-bold">Parcours</p>
                  <p className="font-black text-sm mt-0.5">{history.length} lieu{history.length > 1 ? 'x' : ''} visité{history.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
          </article>

          {/* ── Historique Polarsteps ── */}
          <section className="lg:col-span-8 flex flex-col gap-4">

            {historyLoading ? (
              <div className="flex-1 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest flex items-center justify-center min-h-[420px]">
                <span className="material-symbols-outlined animate-spin text-primary-container" style={{ fontSize: '28px' }}>progress_activity</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex-1 rounded-3xl border border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-3 py-16 text-center px-6 min-h-[420px]">
                <span className="material-symbols-outlined text-on-surface/20" style={{ fontSize: '56px' }}>travel_explore</span>
                <p className="font-black text-on-surface/50 text-lg">Aucune aventure pour l'instant</p>
                <p className="text-sm text-on-surface/35">Lance une partie pour voir ton parcours ici.</p>
                <button
                  onClick={() => navigate('/lobby')}
                  className="mt-2 bg-primary-container text-on-primary px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary transition-all"
                >
                  Jouer maintenant
                </button>
              </div>
            ) : (
              <>
                {/* Map */}
                <div className="rounded-3xl overflow-hidden border border-outline-variant/20 shadow-[0_8px_30px_rgba(28,27,27,0.08)]" style={{ height: '380px' }}>
                  <div ref={mapContainerRef} className="w-full h-full" />
                </div>

                {/* Cards header */}
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">
                    {history.length} lieu{history.length > 1 ? 'x' : ''} · Clique un marqueur pour explorer
                  </p>
                  {activeIndex !== null && (
                    <button
                      onClick={() => setActiveIndex(null)}
                      className="text-xs font-bold text-on-surface/40 hover:text-on-surface transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                      Désélectionner
                    </button>
                  )}
                </div>

                {/* Horizontal scrollable cards */}
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-1 px-1">
                  {history.map((entry, idx) => (
                    <div
                      key={entry.id}
                      ref={el => { cardRefs.current[idx] = el; }}
                      onClick={() => {
                        setActiveIndex(idx);
                        if (entry.latitude != null && entry.longitude != null && mapRef.current) {
                          mapRef.current.flyTo({
                            center: [entry.longitude, entry.latitude],
                            zoom: 14,
                            duration: 600,
                          });
                        }
                      }}
                      className={`snap-start shrink-0 w-48 rounded-2xl overflow-hidden bg-surface-container-lowest border cursor-pointer transition-all duration-200 ${
                        activeIndex === idx
                          ? 'border-primary-container shadow-[0_0_0_2px_#ba0b2f]'
                          : 'border-outline-variant/20 hover:border-outline-variant/50'
                      }`}
                    >
                      {/* Image */}
                      <div className="relative h-28 bg-surface-container-high">
                        {entry.entity_image ? (
                          <img src={entry.entity_image} alt={entry.entity_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface/20" style={{ fontSize: '32px' }}>
                              {entry.entity_type === 'HOTEL' ? 'hotel' : 'restaurant'}
                            </span>
                          </div>
                        )}
                        {/* Number badge */}
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shadow-md">
                          <span className="text-[10px] font-black text-on-primary">{idx + 1}</span>
                        </div>
                        {entry.xp_gained > 0 && (
                          <div className="absolute top-2 right-2 bg-surface-container-lowest/90 backdrop-blur px-1.5 py-0.5 rounded-full">
                            <span className="text-[9px] font-black text-primary-container">+{entry.xp_gained} XP</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="font-black text-sm text-on-surface truncate leading-tight">{entry.entity_name}</p>
                        <p className="text-[11px] text-on-surface/45 font-bold mt-0.5 truncate">
                          {entry.entity_city ? `${entry.entity_city} · ` : ''}{relativeDate(entry.played_at)}
                        </p>
                        {entry.latitude == null && (
                          <p className="text-[10px] text-on-surface/25 mt-1 flex items-center gap-0.5">
                            <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>location_off</span>
                            Pas de coordonnées
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

        </section>
      </main>
    </div>
  );
}
