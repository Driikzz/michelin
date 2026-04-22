import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNav } from '../components/layout/TopNav';
import { useGame, entityImage, michelinStarCount } from '../contexts/GameContext';
import { useAuth } from '../hooks/useAuth';

export function VerdictPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const game = useGame();
  const { user } = useAuth();
  const [shared, setShared] = useState(false);

  const winner = game.winner;
  const entity = winner?.entity;

  const handleShare = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleNewGame = () => {
    game.reset();
    navigate('/lobby');
  };

  if (!winner || !entity) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-primary-container text-4xl">progress_activity</span>
          <p className="text-on-surface/50">En attente du résultat…</p>
        </div>
      </div>
    );
  }

  const starCount = michelinStarCount(entity.michelin_rank);
  const image = entityImage(entity, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80');

  // Current user's XP award
  const myAward = winner.xpAwards.find(a => a.userId === user?.id);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav />

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">

        {/* HERO TILE */}
        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.14)] flex flex-col group">
          <img
            src={image}
            alt={entity.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/25" />

          <div className="relative z-10 flex items-start justify-between gap-3 p-5 md:p-7">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-2 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="text-[11px] font-black tracking-widest uppercase text-white whitespace-nowrap">
                {winner.wasRandom ? 'Tirage au sort' : t('verdict.tirage')}
              </span>
            </div>
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all whitespace-nowrap ${
                shared ? 'bg-green-500 text-white' : 'bg-white/15 backdrop-blur-md border border-white/20 text-white hover:bg-white/25'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
                {shared ? 'check' : 'share'}
              </span>
              <span className="hidden sm:inline">{shared ? 'Partagé !' : t('verdict.shareResult')}</span>
            </button>
          </div>

          <div className="flex-grow min-h-[120px] md:min-h-[200px]" />

          <div className="relative z-10 p-5 md:p-8 lg:p-10 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-black tracking-[0.2em] text-white/50 uppercase">{t('verdict.theVerdict')}</p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none text-white">
                {entity.name}
              </h1>
              <div className="flex items-center gap-1">
                {Array.from({ length: starCount }).map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[#ffd06b]" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/50 text-[11px] font-bold uppercase tracking-widest">
                {entity.city && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span>
                    {entity.city}{entity.country ? `, ${entity.country}` : ''}
                  </span>
                )}
                {entity.tags[0] && (
                  <>
                    <span className="w-1 h-1 bg-white/30 rounded-full hidden sm:block" />
                    <span>{entity.tags[0].name}</span>
                  </>
                )}
              </div>
              {entity.description && (
                <p className="text-white/75 text-sm md:text-base leading-relaxed max-w-lg hidden sm:block">
                  {entity.description}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button className="bg-primary-container hover:bg-primary text-white font-black py-3.5 px-7 rounded-2xl shadow-[0_8px_30px_rgba(186,11,47,0.4)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark_add</span>
                {t('verdict.reserveNow')}
              </button>
              <div className="flex items-center justify-center gap-2 text-white/50 text-xs font-bold">
                <span className="material-symbols-outlined text-error" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>schedule</span>
                {t('verdict.tableHeld')}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-5">

          {/* XP Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_rgba(28,27,27,0.07)] border border-outline-variant/10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#ffd06b] to-[#a67c00] flex items-center justify-center shadow-[0_8px_24px_rgba(166,124,0,0.25)]">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>military_tech</span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-on-surface">{t('verdict.leaderTitle')}</h3>
              {myAward && (
                <p className="text-primary-container font-black text-lg tracking-widest mt-1">
                  {t('verdict.xpEarned', { xp: myAward.xpGained })}
                </p>
              )}
            </div>

            {/* Badges */}
            {myAward && (
              <div className="flex flex-wrap gap-2 justify-center">
                {myAward.xpGained > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface">
                    <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>ads_click</span>
                    +{myAward.xpGained} XP
                  </span>
                )}
                {myAward.newStreak > 1 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface">
                    <span className="material-symbols-outlined text-orange-500" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    {t('verdict.badges.streak', { count: myAward.newStreak })}
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                  {t('verdict.badges.leader')}
                </span>
              </div>
            )}

            {/* XP bar */}
            {myAward && (
              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-on-surface/40">
                  <span>Lv. {myAward.newLevel}</span>
                  <span>Lv. {myAward.newLevel + 1}</span>
                </div>
                <div className="w-full h-2 bg-secondary-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (myAward.newXp % 100))}%` }}
                  />
                </div>
                <p className="text-xs text-on-surface/30 font-bold">{myAward.newXp} XP</p>
              </div>
            )}
          </div>

          {/* Vote breakdown */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_rgba(28,27,27,0.07)] border border-outline-variant/10 flex-grow">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '18px' }}>analytics</span>
              <h3 className="text-xs font-black text-on-surface/40 uppercase tracking-widest">{t('verdict.tableStats')}</h3>
            </div>

            <div className="flex flex-col gap-4">
              {winner.xpAwards.map((award) => (
                <div key={award.playerId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>person</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{award.nickname}</p>
                      <p className="text-xs text-secondary">Lv. {award.newLevel}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 text-xs font-bold shrink-0">
                    <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      +{award.xpGained} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50">
        <div className="bg-white/95 backdrop-blur-2xl border-t border-outline-variant/10 px-5 pt-3 pb-6 flex flex-col gap-2">
          <button className="w-full bg-primary-container text-on-primary py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_8px_20px_rgba(186,11,47,0.25)] hover:bg-primary transition-all active:scale-[0.98] flex justify-center items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark_add</span>
            <span>{t('verdict.reserveNow')}</span>
          </button>
          {user ? (
            <button
              onClick={handleNewGame}
              className="w-full bg-surface-container-low text-on-surface py-3 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-surface-container-high transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>replay</span>
              <span>{t('verdict.newGame')}</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-on-surface text-surface py-3 rounded-2xl font-bold text-sm uppercase tracking-widest hover:opacity-80 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
              <span>Créer un compte</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop new game / register */}
      <div className="hidden lg:flex justify-center pb-10">
        {user ? (
          <button
            onClick={handleNewGame}
            className="text-sm font-bold text-on-surface/40 hover:text-primary-container uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>replay</span>
            {t('verdict.newGame')}
          </button>
        ) : (
          <button
            onClick={() => navigate('/register')}
            className="text-sm font-bold text-primary-container hover:text-primary uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span>
            Créer un compte pour sauvegarder ma progression
          </button>
        )}
      </div>

      <div className="h-36 lg:hidden" />
    </div>
  );
}
