import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TopNav } from '../components/layout/TopNav';
import { MichelinStars } from '../components/ui/MichelinStars';
import { useGame, entityImage, michelinStarCount, priceLabel } from '../contexts/GameContext';

export function RoulettePage() {
  const { t } = useTranslation();
  const game = useGame();

  const entities = game.entities;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voted, setVoted] = useState<Record<string, 'oui' | 'non'>>({});
  const [animDir, setAnimDir] = useState<'oui' | 'non' | null>(null);
  const [seconds, setSeconds] = useState(60);

  // Drive timer from server's timerEndsAt
  useEffect(() => {
    const tick = setInterval(() => {
      if (game.timerEndsAt) {
        const remaining = Math.max(0, Math.round((game.timerEndsAt - Date.now()) / 1000));
        setSeconds(remaining);
      } else {
        setSeconds(s => Math.max(0, s - 1));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [game.timerEndsAt]);

  const current = entities[currentIndex];
  const allVoted = currentIndex >= entities.length && entities.length > 0;
  const progress = (seconds / 60) * 100;
  const isUrgent = seconds <= 15;

  const handleVote = (choice: 'oui' | 'non') => {
    if (!current || animDir) return;
    setAnimDir(choice);
    const vote = choice === 'oui';
    game.sendVote(current.id, vote);
    setTimeout(() => {
      setVoted(prev => ({ ...prev, [current.id]: choice }));
      setCurrentIndex(prev => prev + 1);
      setAnimDir(null);
    }, 380);
  };

  if (entities.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-primary-container text-4xl">progress_activity</span>
          <p className="text-on-surface/50">En attente des établissements…</p>
        </div>
      </div>
    );
  }

  if (allVoted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-16 h-16 bg-primary-container/10 rounded-2xl flex items-center justify-center mb-2">
          <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>how_to_vote</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-on-surface uppercase tracking-tighter">
          {t('roulette.votesIn')}
        </h1>
        <p className="text-on-surface/50 max-w-xs">{t('roulette.allVotedDesc')}</p>
        <p className="text-xs text-on-surface/30 uppercase tracking-widest font-bold animate-pulse">
          En attente des autres joueurs…
        </p>
      </div>
    );
  }

  const votedCount = Object.keys(voted).length;
  const likeCount = current ? (game.likeCounts[current.id] ?? 0) : 0;

  const starCount = michelinStarCount(current?.michelin_rank);
  const image = entityImage(
    current ?? { images: [] },
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-hidden">
      <TopNav />

      {/* Timer bar */}
      <div className="w-full h-1 bg-surface-container-high" role="progressbar" aria-valuemin={0} aria-valuemax={60} aria-valuenow={seconds} aria-label="Temps restant">
        <div
          aria-hidden="true"
          className={`h-full transition-all duration-1000 rounded-full ${isUrgent ? 'bg-error' : 'bg-primary-container'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-grow flex flex-col items-center px-5 md:px-8 pt-6 pb-8 gap-5 max-w-2xl mx-auto w-full">

        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-on-surface tracking-tight uppercase">{t('roulette.title')}</h1>
            <p className="text-xs text-on-surface/40 uppercase tracking-widest font-bold">{t('roulette.subtitle')}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-2xl tracking-tighter transition-all ${isUrgent ? 'bg-error/10 text-error animate-pulse' : 'bg-primary-container/10 text-primary-container'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>timer</span>
            {String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Progress dots */}
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label={`Progression : ${votedCount} établissement${votedCount !== 1 ? 's' : ''} voté${votedCount !== 1 ? 's' : ''} sur ${entities.length}`}
        >
          {entities.map((e, i) => {
            const v = voted[e.id];
            return (
              <div
                key={e.id}
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  v === 'oui' ? 'bg-green-500 w-4' :
                  v === 'non' ? 'bg-primary-container w-4' :
                  i === currentIndex ? 'bg-on-surface w-6' :
                  'bg-surface-container-high w-1.5'
                }`}
              />
            );
          })}
          <span className="text-xs text-on-surface/40 font-bold ml-1" aria-hidden="true">{votedCount}/{entities.length}</span>
        </div>

        {/* Live like count */}
        {likeCount > 0 && (
          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-2 w-full">
            <span className="material-symbols-outlined text-green-600" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>favorite</span>
            <span className="text-xs text-green-700 font-bold">
              {likeCount} joueur{likeCount !== 1 ? 's' : ''} aime{likeCount !== 1 ? 'nt' : ''} cet établissement
            </span>
          </div>
        )}

        {/* Card */}
        <div className="w-full flex-1 flex items-center justify-center">
          <div
            className={`w-full max-w-sm rounded-3xl overflow-hidden relative shadow-[0_20px_60px_rgba(28,27,27,0.15)] transition-all duration-350 ${
              animDir === 'oui' ? 'translate-x-16 rotate-6 opacity-0 scale-95' :
              animDir === 'non' ? '-translate-x-16 -rotate-6 opacity-0 scale-95' :
              'translate-x-0 rotate-0 opacity-100 scale-100'
            }`}
            style={{ minHeight: '460px' }}
          >
            <img src={image} alt={current?.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

            {animDir === 'oui' && (
              <div className="absolute inset-0 bg-green-500/25 flex items-center justify-center z-20">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-5 border-2 border-green-400 flex items-center gap-3">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  <span className="text-4xl font-black text-white tracking-widest">OUI</span>
                </div>
              </div>
            )}
            {animDir === 'non' && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-20">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-5 border-2 border-red-400 flex items-center gap-3">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '36px' }}>close</span>
                  <span className="text-4xl font-black text-white tracking-widest">NON</span>
                </div>
              </div>
            )}

            <div className="absolute inset-0 p-6 flex flex-col justify-end gap-3">
              <div className="flex flex-wrap gap-1.5">
                {current?.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag.id}
                    className="backdrop-blur-md text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold bg-white/20 text-white"
                  >
                    {tag.name}
                  </span>
                ))}
                {current?.price_category && (
                  <span className="backdrop-blur-md text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold bg-primary-container/90 text-on-primary">
                    {priceLabel(current.price_category)}
                  </span>
                )}
              </div>

              <h2 className="text-[2.2rem] font-black text-white leading-tight tracking-tight">{current?.name}</h2>

              <div className="flex items-center gap-3">
                <MichelinStars count={starCount} size="sm" />
                <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>location_on</span>
                    {current?.city ?? current?.country ?? ''}
                  </span>
                </div>
              </div>

              {current?.description && (
                <p className="text-white/70 text-sm leading-relaxed line-clamp-2 border-l-2 border-white/20 pl-3">
                  {current.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Vote Buttons */}
        <div className="flex justify-center items-center gap-6 w-full" role="group" aria-label="Boutons de vote">
          <button
            onClick={() => handleVote('non')}
            disabled={!!animDir}
            aria-label={`Non — ${current?.name ?? 'cet établissement'}`}
            className="group flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-container-lowest border-2 border-outline-variant/30 flex items-center justify-center shadow-[0_8px_30px_rgba(28,27,27,0.08)] hover:border-on-surface/30 hover:bg-surface-container-high transition-all group-hover:scale-110 active:scale-95">
              <span aria-hidden="true" className="material-symbols-outlined text-on-surface/60 group-hover:text-on-surface transition-colors" style={{ fontSize: '28px' }}>close</span>
            </div>
            <span aria-hidden="true" className="text-xs font-black uppercase tracking-widest text-on-surface/40">{t('roulette.nonShort')}</span>
          </button>

          <div className="flex flex-col items-center" aria-hidden="true">
            <span className="text-2xl font-black text-on-surface">{currentIndex + 1}</span>
            <span className="text-xs text-on-surface/30 font-bold">/ {entities.length}</span>
          </div>

          <button
            onClick={() => handleVote('oui')}
            disabled={!!animDir}
            aria-label={`Oui — ${current?.name ?? 'cet établissement'}`}
            className="group flex flex-col items-center gap-2"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-container flex items-center justify-center shadow-[0_12px_30px_rgba(186,11,47,0.3)] hover:bg-primary transition-all group-hover:scale-110 active:scale-95">
              <span aria-hidden="true" className="material-symbols-outlined text-on-primary" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <span aria-hidden="true" className="text-xs font-black uppercase tracking-widest text-primary-container">{t('roulette.ouiShort')}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
