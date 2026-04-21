import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNav } from '../components/layout/TopNav';
import { MOCK_PLAYERS, MOCK_PRESETS, MOCK_TAGS } from '../data/mockData';

type GameMode = 'fast' | 'classic' | 'chaos';

export function LobbyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedPreset, setSelectedPreset] = useState('midrange');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Spicy', 'Date Night']);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const GAME_MODES: { id: GameMode; icon: string }[] = [
    { id: 'fast', icon: 'bolt' },
    { id: 'classic', icon: 'restaurant_menu' },
    { id: 'chaos', icon: 'casino' },
  ];

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleStart = () => {
    if (gameMode === 'fast') navigate('/roulette');
    else navigate('/deck');
  };

  const readyCount = MOCK_PLAYERS.filter(p => p.status === 'ready').length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNav />

      {/* Hero section */}
      <section className="px-6 md:px-10 pt-8 pb-6 md:pt-12 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Room pill */}
          <div className="inline-flex items-center gap-2 bg-primary-container/10 text-primary-container px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 bg-primary-container rounded-full animate-pulse" />
            Salle #9420 · {readyCount}/{MOCK_PLAYERS.length} prêts
          </div>

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

          {/* ── LEFT / CENTER — decisions (mobile: full width, desktop: 7 cols) ── */}
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
                    <span className="text-xs font-black uppercase tracking-wide">{t(`lobby.modes.${mode.id}`)}</span>
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

            {/* Presets */}
            <div>
              <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold mb-3">{t('lobby.theAgenda')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_PRESETS.map(preset => (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all select-none ${
                      selectedPreset === preset.id
                        ? 'bg-surface-container-lowest border-2 border-primary-container/40 shadow-[0_8px_30px_rgba(28,27,27,0.08)]'
                        : 'bg-surface-container-low border-2 border-transparent hover:border-outline-variant/30'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      selectedPreset === preset.id ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface/60'
                    }`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: selectedPreset === preset.id ? "'FILL' 1" : "'FILL' 0" }}>
                        {preset.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-on-surface truncate">{t(`lobby.presets.${preset.id}.label`)}</h3>
                        <span className={`text-sm font-black shrink-0 ${selectedPreset === preset.id ? 'text-primary-container' : 'text-on-surface/50'}`}>{preset.priceRange}</span>
                      </div>
                      <p className="text-xs text-on-surface/60 mt-0.5 leading-relaxed">{t(`lobby.presets.${preset.id}.description`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
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
                {MOCK_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-on-surface text-surface shadow-sm scale-[1.02]'
                        : 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface/70 hover:bg-surface-container-low hover:border-outline-variant/60'
                    }`}
                  >
                    {t(`lobby.tags.${tag}`, { defaultValue: tag })}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT — room panel, desktop only (5 cols, sticky) ── */}
          <aside className="hidden lg:flex lg:col-span-5 flex-col gap-4 sticky top-24">

            {/* Players */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_30px_rgba(28,27,27,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">
                  {t('lobby.table', { current: 3, max: 6 })}
                </p>
                <button className="flex items-center gap-1.5 text-xs font-bold text-primary-container hover:text-primary transition-colors border border-primary-container/30 px-3 py-1.5 rounded-full hover:bg-primary-container/5">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>link</span>
                  {t('lobby.inviteLink')}
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {MOCK_PLAYERS.map(player => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={player.avatar} alt={player.name}
                          className={`w-9 h-9 rounded-full object-cover ${player.status === 'invited' ? 'opacity-40' : ''} ${player.isHost ? 'ring-2 ring-primary-container' : ''}`}
                        />
                        {player.isHost && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-tertiary-fixed-dim rounded-full w-4 h-4 flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontSize: '10px', fontVariationSettings: "'FILL' 1" }}>star</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm text-on-surface ${player.status === 'invited' ? 'opacity-40' : ''}`}>{player.name}</p>
                        <p className="text-xs text-on-surface/50">
                          {player.isHost ? t('lobby.host') : player.status === 'ready' ? t('lobby.joined') : t('lobby.invited')}
                        </p>
                      </div>
                    </div>
                    {player.status === 'ready'
                      ? <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold"><span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>{t('lobby.ready')}</div>
                      : <span className="material-symbols-outlined text-on-surface/20" style={{ fontSize: '18px' }}>schedule</span>
                    }
                  </div>
                ))}
                <button className="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-outline-variant/40 text-on-surface/40 hover:text-on-surface hover:border-outline-variant/70 hover:bg-surface-container-low transition-all mt-1">
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                  </div>
                  <span className="font-semibold text-sm">{t('lobby.addGuest')}</span>
                </button>
              </div>
            </div>

            {/* Distance */}
            <div className="bg-surface-container-low rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs uppercase tracking-widest text-on-surface/50 font-bold">{t('lobby.maxDistance')}</p>
                <span className="font-bold text-sm text-primary-container">5 km</span>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full relative">
                <div className="absolute left-0 top-0 h-full bg-primary-container rounded-full" style={{ width: '50%' }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary-container rounded-full shadow-md cursor-pointer" style={{ left: 'calc(50% - 8px)' }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-on-surface/40">
                <span>{t('common.walk')}</span><span>{t('common.cab')}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleStart}
                className="w-full bg-primary-container text-on-primary py-5 rounded-2xl font-black text-base uppercase tracking-widest hover:bg-primary transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_12px_30px_rgba(186,11,47,0.25)] flex items-center justify-center gap-2"
              >
                {t('lobby.lockIn')}
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
              </button>
              <p className="text-center text-xs text-on-surface/35 pt-1">{t('lobby.waitingSignal')}</p>
            </div>
          </aside>
        </div>
      </main>

      {/* ── MOBILE bottom CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50">
        <div className="bg-surface/95 backdrop-blur-2xl border-t border-outline-variant/10 px-5 pt-3 pb-safe pb-6 flex flex-col gap-3">
          {/* Mobile players avatars */}
          <div className="flex -space-x-2">
            {MOCK_PLAYERS.map(p => (
              <img key={p.id} src={p.avatar} alt={p.name}
                className={`w-8 h-8 rounded-full border-2 border-surface object-cover ${p.status === 'invited' ? 'opacity-40' : ''}`}
              />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container-low flex items-center justify-center text-on-surface/60 font-bold text-xs">
              +2
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-primary-container text-on-primary py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_8px_20px_rgba(186,11,47,0.25)] hover:bg-primary transition-all active:scale-[0.98] flex justify-center items-center gap-2"
          >
            <span>{t('lobby.start')}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
          </button>
        </div>
      </div>

      <div className="h-36 lg:hidden" />
    </div>
  );
}
