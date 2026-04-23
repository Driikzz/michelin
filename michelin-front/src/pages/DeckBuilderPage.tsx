import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { TopNav } from '../components/layout/TopNav';
import { RestaurantCard } from '../components/game/RestaurantCard';
import { EntityDetailModal } from '../components/game/EntityDetailModal';
import { useGame, entityImage, michelinStarCount, priceLabel } from '../contexts/GameContext';
import { entityService } from '../services/entityService';
import type { Entity } from '../types/api';

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY ?? '';

const PAGE_SIZE = 6;

function toCardShape(entity: Entity) {
  return {
    id: entity.id,
    name: entity.name,
    stars: michelinStarCount(entity.michelin_rank),
    priceRange: priceLabel(entity.price_category),
    location: entity.city ?? entity.country ?? '',
    cuisine: entity.tags.map(t => t.name).join(', ') || 'Gastronomie',
    quote: entity.description ?? '',
    image: entityImage(entity, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'),
    sponsored: false,
  };
}

function makeMarkerEl(inDeck: boolean): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 28px; height: 28px; border-radius: 50%;
    border: 2.5px solid #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    cursor: pointer;
    transition: box-shadow 0.15s, background-color 0.2s;
    display: flex; align-items: center; justify-content: center;
  `;
  el.style.backgroundColor = inDeck ? '#16a34a' : '#ba0b2f';
  return el;
}

export function DeckBuilderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const game = useGame();

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Entity[]>([]);
  const [deck, setDeck] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);
  const [detailEntity, setDetailEntity] = useState<Entity | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const initialSeconds = useMemo(
    () => game.timerEndsAt ? Math.max(0, Math.round((game.timerEndsAt - Date.now()) / 1000)) : 30,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [timerSeconds, setTimerSeconds] = useState(initialSeconds);

  // Reconnect WS on page refresh (context is wiped but sessionStorage restores roomId)
  useEffect(() => {
    if (!game.wsConnected && game.roomId) {
      const token = localStorage.getItem('token') ?? undefined;
      const guestId = localStorage.getItem('guestId') ?? undefined;
      game.connectWs(game.roomId, token, guestId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const mapReadyRef = useRef(false);
  const markersRef = useRef<{ marker: maptilersdk.Marker; el: HTMLDivElement; entityId: string }[]>([]);

  const isHost = game.playerId !== null && game.playerId === game.hostPlayerId;

  const fetchEntities = useCallback(
    async (q?: string) => {
      if (!game.latitude || !game.longitude) return;
      setFetching(true);
      try {
        const data = await entityService.searchEntities(game.entityType ?? 'RESTAURANT', {
          lat: game.latitude,
          lng: game.longitude,
          radius: game.radiusKm,
          ...(q !== undefined && q !== '' && { q }),
          limit: 40,
        });
        setResults(data);
      } catch {
        // keep existing results
      } finally {
        setFetching(false);
      }
    },
    [game.latitude, game.longitude, game.radiusKm, game.entityType],
  );

  useEffect(() => { void fetchEntities(); }, [fetchEntities]);

  useEffect(() => {
    if (search.length < 2) return;
    const timer = setTimeout(() => { void fetchEntities(search); }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchEntities]);

  // Reset pagination when search changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search]);

  useEffect(() => {
    if (game.phase === 'VOTING') navigate('/roulette');
  }, [game.phase, navigate]);

  // Timer server-side — driven by game.timerEndsAt
  useEffect(() => {
    const tick = setInterval(() => {
      if (game.timerEndsAt) {
        const remaining = Math.max(0, Math.round((game.timerEndsAt - Date.now()) / 1000));
        setTimerSeconds(remaining);
        if (remaining === 0) handleTimerExpire();
      } else {
        setTimerSeconds(s => {
          if (s <= 1) { handleTimerExpire(); return 0; }
          return s - 1;
        });
      }
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.timerEndsAt]);

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || !game.latitude || !game.longitude || mapRef.current) return;

    const center: [number, number] = [game.longitude, game.latitude];

    const map = new maptilersdk.Map({
      container: mapContainerRef.current,
      style: maptilersdk.MapStyle.STREETS,
      center,
      zoom: 13,
      attributionControl: false,
      navigationControl: false,
      projection: 'mercator',
    });

    map.on('load', () => {
      // User location dot
      map.addSource('room-center', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: center }, properties: {} },
      });
      map.addLayer({
        id: 'room-center-halo', type: 'circle', source: 'room-center',
        paint: { 'circle-radius': 14, 'circle-color': '#ba0b2f', 'circle-opacity': 0.15 },
      });
      map.addLayer({
        id: 'room-center-dot', type: 'circle', source: 'room-center',
        paint: {
          'circle-radius': 6, 'circle-color': '#ba0b2f',
          'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2,
        },
      });
      mapReadyRef.current = true;
    });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.latitude, game.longitude]);

  // Rebuild markers when results change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const rebuild = () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];

      const withCoords = results.filter(e => e.latitude != null && e.longitude != null);
      if (withCoords.length === 0) return;

      if (game.latitude && game.longitude) {
        const bounds = new maptilersdk.LngLatBounds();
        bounds.extend([game.longitude, game.latitude]);
        withCoords.forEach(e => bounds.extend([e.longitude!, e.latitude!]));
        map.fitBounds(bounds, { padding: 55, maxZoom: 15, duration: 500 });
      }

      withCoords.forEach(entity => {
        const el = makeMarkerEl(deck.has(entity.id));
        el.addEventListener('mouseenter', () => { el.style.boxShadow = '0 0 0 4px rgba(255,255,255,0.6), 0 4px 14px rgba(0,0,0,0.4)'; });
        el.addEventListener('mouseleave', () => { el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; });
        el.addEventListener('click', () => setDetailEntity(entity));

        const marker = new maptilersdk.Marker({ element: el, anchor: 'center' })
          .setLngLat([entity.longitude!, entity.latitude!])
          .addTo(map);

        markersRef.current.push({ marker, el, entityId: entity.id });
      });
    };

    if (mapReadyRef.current) {
      rebuild();
    } else {
      map.once('load', rebuild);
    }
  // deck intentionally excluded — colors are updated separately without full rebuild
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  // Update marker colors when deck changes without rebuilding markers
  useEffect(() => {
    markersRef.current.forEach(({ el, entityId }) => {
      el.style.backgroundColor = deck.has(entityId) ? '#16a34a' : '#ba0b2f';
    });
  }, [deck]);

  const toggleDeck = (entityId: string) => {
    if (deck.has(entityId)) {
      setDeck(prev => { const n = new Set(prev); n.delete(entityId); return n; });
    } else {
      setDeck(prev => new Set(prev).add(entityId));
      game.sendAddEntity(entityId);
    }
  };

  const handleLaunch = () => { game.sendStartGame(); };
  const handleTimerExpire = () => { if (isHost) game.sendStartGame(); };

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNav />

      <header className="px-6 md:px-10 pt-6 pb-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">
              {t('deck.curatorTitle')}
            </h1>
            <p className="text-sm text-on-surface/50 mt-0.5">{t('deck.curatorSubtitle')}</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface/50 mb-1">
              {t('deck.timeToCurate')}
            </span>
            <div
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Temps restant : ${timerSeconds} secondes`}
              className={`text-[4rem] font-bold tracking-tighter leading-none transition-colors ${timerSeconds <= 10 ? 'text-error' : 'text-on-surface'}`}
            >
              {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-grow px-6 md:px-10 pb-8 max-w-7xl mx-auto w-full">

        {/* 2-col on desktop, single col on mobile — map reordered via flex order */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_420px] lg:gap-8 gap-6">

          {/* ── Map column — below cards on mobile, right column sticky on desktop ── */}
          <div className="order-last lg:order-2">
            <div className="lg:sticky lg:top-6">
              <div className="rounded-2xl overflow-hidden border border-outline-variant/20 shadow-[0_8px_30px_rgba(28,27,27,0.08)] h-[220px] lg:h-[480px]">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>

              {/* Map legend — desktop only */}
              <div className="hidden lg:flex mt-3 items-center gap-4 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ba0b2f] border border-white shadow-sm" />
                  <span className="text-[11px] font-bold text-on-surface/50">Non ajouté</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#16a34a] border border-white shadow-sm" />
                  <span className="text-[11px] font-bold text-on-surface/50">Dans le deck</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] font-bold text-on-surface/40">Clic → détails</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Left column: search + grid — order-1 on mobile, order-1 on desktop ── */}
          <div className="order-1 lg:order-1 flex flex-col gap-6">

            {/* Search */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-on-surface/40" style={{ fontSize: '20px' }}>search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('deck.searchPlaceholder')}
                aria-label={t('deck.searchPlaceholder')}
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl py-4 pl-12 pr-4 text-base text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:border-primary-container/40 focus:bg-white transition-all shadow-[0_4px_20px_rgba(28,27,27,0.04)]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Effacer la recherche"
                  className="absolute right-4 text-on-surface/40 hover:text-on-surface transition-colors"
                >
                  <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
              )}
            </div>

            {/* Cards grid */}
            {fetching && results.length === 0 ? (
              <div className="flex justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-primary-container text-4xl">progress_activity</span>
              </div>
            ) : results.length === 0 && !fetching ? (
              <p className="text-on-surface/40 text-sm text-center py-8">
                Aucun établissement trouvé dans ce rayon.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest">
                    {visibleResults.length} / {results.length} établissements
                  </p>
                  {fetching && (
                    <span className="material-symbols-outlined animate-spin text-primary-container" style={{ fontSize: '16px' }}>progress_activity</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-5">
                  {visibleResults.map(entity => (
                    <RestaurantCard
                      key={entity.id}
                      restaurant={toCardShape(entity)}
                      onAdd={() => toggleDeck(entity.id)}
                      onView={() => setDetailEntity(entity)}
                      added={deck.has(entity.id)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-outline-variant/30 text-on-surface/50 font-black text-sm uppercase tracking-widest hover:border-primary-container/40 hover:text-primary-container transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
                    Voir plus ({results.length - visibleCount} restants)
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Mobile bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50">
        <div className="bg-surface/95 backdrop-blur-2xl border-t border-outline-variant/10 px-5 pt-3 pb-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-on-surface/50 px-1">
            <span>{t('deck.deckCount', { count: deck.size })}</span>
            {deck.size > 0 && (
              <button onClick={() => setDeck(new Set())} className="text-primary-container font-bold">{t('deck.clearDeck')}</button>
            )}
          </div>
          {isHost ? (
            <button
              onClick={handleLaunch}
              className="w-full bg-primary-container text-on-primary py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_8px_20px_rgba(186,11,47,0.25)] hover:bg-primary transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              <span>{t('deck.launchRoulette')}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl border-2 border-dashed border-outline-variant/30 text-on-surface/40 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
              En attente de l'hôte…
            </div>
          )}
        </div>
      </div>

      {/* Desktop CTA */}
      {isHost && (
        <div className="hidden lg:flex justify-center py-10 px-10">
          <button
            onClick={handleLaunch}
            className="bg-primary-container text-on-primary py-5 px-14 rounded-2xl font-black text-base uppercase tracking-widest hover:bg-primary transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_12px_30px_rgba(186,11,47,0.25)] flex items-center gap-3"
          >
            {t('deck.launchRoulette')}
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
          </button>
        </div>
      )}

      <div className="h-28 lg:hidden" />

      {detailEntity && (
        <EntityDetailModal
          entity={detailEntity}
          inDeck={deck.has(detailEntity.id)}
          onAdd={() => toggleDeck(detailEntity.id)}
          onClose={() => setDetailEntity(null)}
        />
      )}
    </div>
  );
}
