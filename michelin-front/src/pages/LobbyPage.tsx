import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TopNav } from '../components/layout/TopNav';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../hooks/useAuth';
import { roomService } from '../services/roomService';
import { entityService } from '../services/entityService';
import { MOCK_PRESETS } from '../data/mockData';
import { RadiusMap } from '../components/ui/RadiusMap';
import type { GameMode, Tag } from '../types/api';

const PRICE_LABELS = ['€', '€€', '€€€', '€€€€'];

export function LobbyPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const game = useGame();

  const [selectedPrices, setSelectedPrices] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('CLASSIC');
  const [radiusKm, setRadiusKm] = useState(5);
  const [tags, setTags] = useState<Tag[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [entityCount, setEntityCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  const countTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const GAME_MODES: { id: GameMode; icon: string }[] = [
    { id: 'FAST', icon: 'bolt' },
    { id: 'CLASSIC', icon: 'restaurant_menu' },
    { id: 'CHAOS', icon: 'casino' },
  ];

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: 48.85, lng: 2.35 }),
    );
    entityService
      .getTags('RESTAURANT')
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  // Debounced restaurant count
  useEffect(() => {
    if (!coords || !!game.roomId) return;
    if (countTimerRef.current) clearTimeout(countTimerRef.current);
    setCountLoading(true);
    countTimerRef.current = setTimeout(() => {
      entityService
        .searchEntities('RESTAURANT', {
          lat: coords.lat,
          lng: coords.lng,
          radius: radiusKm,
          ...(selectedPrices.length > 0 && { prices: selectedPrices }),
          ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
        })
        .then((results) => setEntityCount(results.length))
        .catch(() => setEntityCount(null))
        .finally(() => setCountLoading(false));
    }, 500);
    return () => {
      if (countTimerRef.current) clearTimeout(countTimerRef.current);
    };
  }, [coords, radiusKm, selectedPrices, selectedTags, game.roomId]);

  const togglePrice = (price: number) =>
    setSelectedPrices((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price],
    );

  const toggleTag = (tagId: number) =>
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );

  const handleStart = async () => {
    if (!coords) { setError('Waiting for location…'); return; }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') ?? undefined;
      const { roomId, playerId, entityType } = await roomService.createRoom({
        gameMode,
        entityType: 'RESTAURANT',
        latitude: coords.lat,
        longitude: coords.lng,
        radiusKm,
        priceFilters: selectedPrices,
        tagIds: selectedTags,
        nickname: user?.username,
      });

      game.setRoom({
        roomId,
        playerId,
        gameMode,
        entityType,
        latitude: coords.lat,
        longitude: coords.lng,
        radiusKm,
      });

      game.connectWs(roomId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = () => {
    if (!game.roomId) return;
    const url = `${window.location.origin}/join/${game.roomId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLaunch = () => {
    game.sendStartGame();
  };

  const isHost = game.playerId === game.hostPlayerId || game.hostPlayerId === null;
  const roomCreated = !!game.roomId;
  const readyCount = game.players.length;

  const settingsSummary = () => {
    const priceStr = selectedPrices.length > 0
      ? selectedPrices.map((p) => PRICE_LABELS[p - 1]).join(' · ')
      : 'Tous budgets';
    const tagNames = selectedTags
      .map((id) => tags.find((t) => t.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    return { priceStr, tagNames };
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNav />

      <section className="px-6 md:px-10 pt-8 pb-6 md:pt-12 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {roomCreated && 
            <div className="inline-flex items-center gap-2 bg-primary-container/10 text-primary-container px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <span className="w-2 h-2 bg-primary-container rounded-full animate-pulse" />
              {roomCreated
                ? `${readyCount} joueur${readyCount !== 1 ? 's' : ''} connecté${readyCount !== 1 ? 's' : ''}`
                : t('lobby.heroTitle')}
            </div>
          }
          

          <h1 className="text-[2.8rem] sm:text-[3.8rem] md:text-[5rem] lg:text-[6rem] font-black leading-none tracking-[-0.03em] text-on-surface uppercase mb-4">
            {t('lobby.heroTitle')}
          </h1>
          <p className="text-base md:text-lg text-on-surface/60 max-w-xl leading-relaxed">
            {t('lobby.heroSubtitle')}
          </p>
        </div>
      </section>

      <main className="flex-grow px-6 md:px-10 pb-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">

          {/* LEFT — config (hidden once room created) */}
          {!roomCreated && (
            <div className="col-span-1 lg:col-span-7 flex flex-col gap-7">

              {/* Game Mode */}
              <div>
                <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold mb-3">{t('lobby.gameMode')}</p>
                <div className="grid grid-cols-3 gap-3">
                  {GAME_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setGameMode(mode.id)}
                      className={`relative py-4 px-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                        gameMode === mode.id
                          ? 'bg-primary-container text-on-primary border-primary-container shadow-[0_8px_20px_rgba(186,11,47,0.25)] scale-[1.02]'
                          : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface hover:border-outline-variant/50 hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: gameMode === mode.id ? "'FILL' 1" : "'FILL' 0" }}>
                        {mode.icon}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wide">{t(`lobby.modes.${mode.id.toLowerCase()}`)}</span>
                      <span className={`text-[10px] leading-tight text-center hidden sm:block ${gameMode === mode.id ? 'text-on-primary/80' : 'text-on-surface/50'}`}>
                        {t(`lobby.modes.${mode.id}Desc`)}
                      </span>
                      {gameMode === mode.id && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-on-primary/20 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>check</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price budget — multi-select chips */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">{t('lobby.theAgenda')}</p>
                  {selectedPrices.length > 0 && (
                    <button onClick={() => setSelectedPrices([])} className="text-xs font-bold text-primary-container hover:text-primary transition-colors">
                      {t('lobby.clearAll')}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOCK_PRESETS.map((preset, idx) => {
                    const price = idx + 1;
                    const active = selectedPrices.includes(price);
                    return (
                      <button
                        key={preset.id}
                        onClick={() => togglePrice(price)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 transition-all font-bold text-sm select-none ${
                          active
                            ? 'bg-primary-container text-on-primary border-primary-container shadow-[0_4px_14px_rgba(186,11,47,0.2)] scale-[1.03]'
                            : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface/70 hover:border-outline-variant/50'
                        }`}
                      >
                        {active && (
                          <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '15px', fontVariationSettings: "'FILL' 1" }}>check</span>
                        )}
                        <span>{preset.priceRange}</span>
                        <span className={`text-xs ${active ? 'text-on-primary/80' : 'text-on-surface/40'}`}>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-on-surface/40 mt-2">
                  {selectedPrices.length === 0 ? 'Tous les budgets inclus' : `${selectedPrices.length} budget${selectedPrices.length > 1 ? 's' : ''} sélectionné${selectedPrices.length > 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Map + slider (mobile only — desktop has it in the right panel) */}
              <div className="lg:hidden flex flex-col gap-3">
                <div className="bg-surface-container-low rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs uppercase tracking-widest text-on-surface/50 font-bold">{t('lobby.maxDistance')}</p>
                    <span className="font-bold text-sm text-primary-container">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={radiusKm}
                    onChange={e => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-primary-container"
                  />
                  <div className="flex justify-between mt-2 text-xs text-on-surface/40">
                    <span>{t('common.walk')}</span><span>{t('common.cab')}</span>
                  </div>
                </div>
                <div className="h-52 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(28,27,27,0.08)]">
                  <RadiusMap coords={coords} radiusKm={radiusKm} />
                </div>
              </div>

              {/* Tags — hidden in Chaos mode */}
              {gameMode !== 'CHAOS' && tags.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">{t('lobby.vibeModifiers')}</p>
                    {selectedTags.length > 0 && (
                      <button onClick={() => setSelectedTags([])} className="text-xs font-bold text-primary-container hover:text-primary transition-colors">
                        {t('lobby.clearAll')}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(showAllTags ? tags : tags.slice(0, 10)).map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                          selectedTags.includes(tag.id)
                            ? 'bg-on-surface text-surface shadow-sm scale-[1.02]'
                            : 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface/70 hover:bg-surface-container-low hover:border-outline-variant/60'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                    {tags.length > 10 && (
                      <button
                        onClick={() => setShowAllTags(prev => !prev)}
                        className="px-4 py-2 rounded-full text-xs font-bold tracking-wide border border-dashed border-outline-variant/40 text-on-surface/50 hover:text-on-surface hover:border-outline-variant/70 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          {showAllTags ? 'expand_less' : 'expand_more'}
                        </span>
                        {showAllTags ? 'Voir moins' : `Voir plus (${tags.length - 10})`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Restaurant count indicator */}
              {coords && (
                <div className="flex items-center gap-2 text-xs text-on-surface/50 font-medium">
                  {countLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-primary-container" style={{ fontSize: '14px' }}>progress_activity</span>
                      Recherche…
                    </>
                  ) : entityCount !== null ? (
                    <>
                      <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                      <span className={entityCount === 0 ? 'text-error font-bold' : ''}>
                        {entityCount === 0 ? 'Aucun restaurant trouvé' : `${entityCount} restaurant${entityCount > 1 ? 's' : ''} disponible${entityCount > 1 ? 's' : ''}`}
                      </span>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Waiting room (after room creation) */}
          {roomCreated && (
            <div className="col-span-1 lg:col-span-7 flex flex-col gap-5">
              {/* Settings summary */}
              {(() => {
                const { priceStr, tagNames } = settingsSummary();
                return (
                  <div className="bg-surface-container-low rounded-2xl p-6 flex flex-col gap-3">
                    <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold mb-1">Paramètres de la partie</p>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                        {GAME_MODES.find(m => m.id === game.gameMode)?.icon ?? 'bolt'}
                      </span>
                      <div>
                        <p className="font-black text-sm text-on-surface uppercase">{t(`lobby.modes.${game.gameMode?.toLowerCase() ?? 'fast'}`)}</p>
                        <p className="text-xs text-on-surface/50">{t(`lobby.modes.${game.gameMode?.toLowerCase() ?? 'fast'}Desc`)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-on-surface/60">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>near_me</span>
                        {radiusKm} km autour de vous
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>euro</span>
                        {priceStr}
                      </div>
                      {tagNames && (
                        <div className="col-span-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>label</span>
                          {tagNames}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {game.players.length > 0 && (
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_30px_rgba(28,27,27,0.06)]">
                  <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold mb-4">Joueurs connectés</p>
                  <div className="flex flex-col gap-3">
                    {game.players.map(player => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-container/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>person</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-on-surface">
                              {player.nickname}
                              {player.id === game.hostPlayerId && (
                                <span className="ml-2 text-[10px] uppercase tracking-widest text-primary-container font-black">{t('lobby.host')}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>
                          {t('lobby.ready')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RIGHT — room panel */}
          <aside className="hidden lg:flex lg:col-span-5 flex-col gap-4 sticky top-24">

            {/* Distance slider + map */}
            {!roomCreated && (
              <div className="flex flex-col gap-3">
                <div className="bg-surface-container-low rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs uppercase tracking-widest text-on-surface/50 font-bold">{t('lobby.maxDistance')}</p>
                    <span className="font-bold text-sm text-primary-container">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={radiusKm}
                    onChange={e => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-primary-container"
                  />
                  <div className="flex justify-between mt-2 text-xs text-on-surface/40">
                    <span>{t('common.walk')}</span><span>{t('common.cab')}</span>
                  </div>
                </div>
                <div className="h-56 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(28,27,27,0.08)]">
                  <RadiusMap coords={coords} radiusKm={radiusKm} />
                </div>
              </div>
            )}

            {/* Invite / players */}
            {roomCreated && (
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_30px_rgba(28,27,27,0.06)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">
                    {t('lobby.table', { current: readyCount, max: 6 })}
                  </p>
                  <button
                    onClick={handleInvite}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary-container hover:text-primary transition-colors border border-primary-container/30 px-3 py-1.5 rounded-full hover:bg-primary-container/5"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{copied ? 'check' : 'link'}</span>
                    {copied ? 'Copié !' : t('lobby.inviteLink')}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-error/10 text-error rounded-2xl p-4 text-sm font-bold">{error}</div>
            )}

            {/* CTA */}
            <div className="flex flex-col gap-2 pt-1">
              {!roomCreated ? (
                <button
                  onClick={() => void handleStart()}
                  disabled={loading || !coords}
                  className="w-full bg-primary-container text-on-primary py-5 rounded-2xl font-black text-base uppercase tracking-widest hover:bg-primary transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_12px_30px_rgba(186,11,47,0.25)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  ) : (
                    <>
                      {t('lobby.lockIn')}
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  {isHost ? (
                    <button
                      onClick={handleLaunch}
                      className="w-full bg-primary-container text-on-primary py-5 rounded-2xl font-black text-base uppercase tracking-widest hover:bg-primary transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_12px_30px_rgba(186,11,47,0.25)] flex items-center justify-center gap-2"
                    >
                      Lancer la partie
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </button>
                  ) : (
                    <div className="w-full py-5 rounded-2xl border-2 border-dashed border-outline-variant/30 text-on-surface/40 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                      En attente de l'hôte…
                    </div>
                  )}
                </>
              )}
              <p className="text-center text-xs text-on-surface/35 pt-1">{t('lobby.waitingSignal')}</p>
            </div>
          </aside>
        </div>
      </main>

      {/* MOBILE bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50">
        <div className="bg-surface/95 backdrop-blur-2xl border-t border-outline-variant/10 px-5 pt-3 pb-safe pb-6 flex flex-col gap-3">
          {roomCreated && (
            <button
              onClick={handleInvite}
              className="flex items-center justify-center gap-2 text-xs font-bold text-primary-container border border-primary-container/30 py-2 rounded-xl"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{copied ? 'check' : 'link'}</span>
              {copied ? 'Lien copié !' : 'Copier le lien d\'invitation'}
            </button>
          )}
          <button
            onClick={!roomCreated ? () => void handleStart() : isHost ? handleLaunch : undefined}
            disabled={loading || (!roomCreated && !coords) || (roomCreated && !isHost)}
            className="w-full bg-primary-container text-on-primary py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_8px_20px_rgba(186,11,47,0.25)] hover:bg-primary transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : roomCreated && !isHost ? (
              <>
                <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                En attente…
              </>
            ) : roomCreated ? (
              <>Lancer la partie <span className="material-symbols-outlined">play_arrow</span></>
            ) : (
              <>
                <span>{t('lobby.start')}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="h-36 lg:hidden" />
    </div>
  );
}
