import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNav } from '../components/layout/TopNav';
import { RestaurantCard } from '../components/game/RestaurantCard';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import { EntityDetailModal } from '../components/game/EntityDetailModal';
import { useGame, entityImage, michelinStarCount, priceLabel } from '../contexts/GameContext';
import { entityService } from '../services/entityService';
import type { Entity } from '../types/api';

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

export function DeckBuilderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const game = useGame();

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Entity[]>([]);
  const [deck, setDeck] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);
  const [detailEntity, setDetailEntity] = useState<Entity | null>(null);

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
          ...(!q && { limit: 20 }),
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

  // Initial load of nearby entities (no query, limit 20)
  useEffect(() => {
    void fetchEntities();
  }, [fetchEntities]);

  // Search when 2+ chars typed
  useEffect(() => {
    if (search.length < 2) return;
    const timer = setTimeout(() => {
      void fetchEntities(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchEntities]);

  // Navigate to /roulette when voting starts
  useEffect(() => {
    if (game.phase === 'VOTING') navigate('/roulette');
  }, [game.phase, navigate]);

  const toggleDeck = (entityId: string) => {
    if (deck.has(entityId)) {
      setDeck(prev => { const n = new Set(prev); n.delete(entityId); return n; });
    } else {
      setDeck(prev => new Set(prev).add(entityId));
      game.sendAddEntity(entityId);
    }
  };

  const handleLaunch = () => {
    game.sendStartGame();
  };

  const handleTimerExpire = () => {
    if (isHost) game.sendStartGame();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNav />

      <header className="px-6 md:px-10 pt-6 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">
              {t('deck.curatorTitle')}
            </h1>
            <p className="text-sm text-on-surface/50 mt-0.5">{t('deck.curatorSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <CountdownTimer initialSeconds={30} large onEnd={handleTimerExpire} />
          </div>
        </div>
      </header>

      <main className="flex-grow px-6 md:px-10 pb-8 max-w-6xl mx-auto w-full flex flex-col gap-8">

        {/* Search */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-4 text-on-surface/40" style={{ fontSize: '20px' }}>search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('deck.searchPlaceholder')}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl py-4 pl-12 pr-4 text-base text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:border-primary-container/40 focus:bg-white transition-all shadow-[0_4px_20px_rgba(28,27,27,0.04)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 text-on-surface/40 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>

        {/* Cards grid */}
        {fetching && results.length === 0 ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary-container text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {results.map(entity => (
              <RestaurantCard
                key={entity.id}
                restaurant={toCardShape(entity)}
                onAdd={() => toggleDeck(entity.id)}
                onView={() => setDetailEntity(entity)}
                added={deck.has(entity.id)}
              />
            ))}
            {results.length === 0 && !fetching && (
              <p className="text-on-surface/40 text-sm col-span-2 text-center py-8">
                Aucun établissement trouvé dans ce rayon.
              </p>
            )}
          </div>
        )}

        {/* Nearby carousel (reuse search results in compact form) */}
        {results.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-on-surface tracking-tight">{t('deck.exploreNeighborhood')}</h2>
                <p className="text-xs font-bold text-primary-container uppercase tracking-widest mt-0.5">
                  {results[0]?.city ?? 'Aux alentours'}
                </p>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="relative w-full h-44 md:h-56 bg-surface-container-high rounded-2xl overflow-hidden border border-outline-variant/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-on-surface/20">
                  <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 0" }}>map</span>
                  <span className="text-xs uppercase tracking-widest font-bold">Carte interactive</span>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-10 h-10 bg-primary-container/20 rounded-full animate-ping" />
                  <div className="w-4 h-4 bg-primary-container rounded-full border-2 border-white shadow-lg" />
                </div>
              </div>
            </div>

            {/* Compact carousel */}
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
              {results.slice(0, 8).map(entity => (
                <div
                  key={entity.id}
                  onClick={() => toggleDeck(entity.id)}
                  className={`flex-shrink-0 w-48 rounded-2xl p-4 border cursor-pointer transition-all group ${
                    deck.has(entity.id)
                      ? 'bg-primary-container/5 border-primary-container/30'
                      : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-on-surface text-sm leading-tight">{entity.name}</h4>
                    <div className="flex gap-0.5 shrink-0 ml-1">
                      {Array.from({ length: michelinStarCount(entity.michelin_rank) }).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-primary-container" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                      {michelinStarCount(entity.michelin_rank) === 0 && (
                        <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>award_star</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface/50 font-bold mb-2">
                    {entity.tags[0]?.name ?? entity.city ?? ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-on-surface/50 font-bold">{priceLabel(entity.price_category)}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${deck.has(entity.id) ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface/40 group-hover:bg-primary-container/20 group-hover:text-primary-container'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
                        {deck.has(entity.id) ? 'check' : 'add'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
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
