import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNav } from '../components/layout/TopNav';
import { MichelinStars } from '../components/ui/MichelinStars';
import { MOCK_RESTAURANTS } from '../data/mockData';

const MOCK_FRIENDS_VOTES: Record<string, { name: string; voted: boolean }[]> = {
  '1': [{ name: 'Marc', voted: true }, { name: 'Sophie', voted: false }],
  '2': [{ name: 'Marc', voted: true }, { name: 'Sophie', voted: true }],
  '3': [{ name: 'Marc', voted: false }, { name: 'Sophie', voted: true }],
  '4': [{ name: 'Marc', voted: true }, { name: 'Sophie', voted: false }],
  '5': [{ name: 'Marc', voted: true }, { name: 'Sophie', voted: true }],
};

export function RoulettePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, 'oui' | 'non'>>({});
  const [animDir, setAnimDir] = useState<'oui' | 'non' | null>(null);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) { navigate('/verdict'); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, navigate]);

  const current = MOCK_RESTAURANTS[currentIndex];
  const allVoted = currentIndex >= MOCK_RESTAURANTS.length;
  const progress = (seconds / 60) * 100;
  const isUrgent = seconds <= 15;

  const handleVote = (choice: 'oui' | 'non') => {
    if (!current || animDir) return;
    setAnimDir(choice);
    setTimeout(() => {
      setVotes(prev => ({ ...prev, [current.id]: choice }));
      setCurrentIndex(prev => prev + 1);
      setAnimDir(null);
    }, 380);
  };

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
        <button
          onClick={() => navigate('/verdict')}
          className="bg-primary-container text-on-primary py-4 px-10 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_12px_30px_rgba(186,11,47,0.25)] hover:bg-primary transition-all hover:scale-[1.02] flex items-center gap-2 mt-2"
        >
          {t('roulette.seeVerdict')}
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
        </button>
      </div>
    );
  }

  const friendVotes = MOCK_FRIENDS_VOTES[current?.id] ?? [];
  const votedCount = Object.keys(votes).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-hidden">
      <TopNav />

      {/* Timer bar */}
      <div className="w-full h-1 bg-surface-container-high">
        <div
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
          {/* Timer badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-2xl tracking-tighter transition-all ${isUrgent ? 'bg-error/10 text-error animate-pulse' : 'bg-primary-container/10 text-primary-container'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>timer</span>
            {String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {MOCK_RESTAURANTS.map((r, i) => {
            const v = votes[r.id];
            return (
              <div
                key={r.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  v === 'oui' ? 'bg-green-500 w-4' :
                  v === 'non' ? 'bg-primary-container w-4' :
                  i === currentIndex ? 'bg-on-surface w-6' :
                  'bg-surface-container-high w-1.5'
                }`}
              />
            );
          })}
          <span className="text-xs text-on-surface/40 font-bold ml-1">{votedCount}/{MOCK_RESTAURANTS.length}</span>
        </div>

        {/* Friends voting status */}
        {friendVotes.length > 0 && (
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-4 py-2 w-full">
            <span className="text-xs text-on-surface/40 font-bold uppercase tracking-wider">Tes amis :</span>
            {friendVotes.map(f => (
              <div key={f.name} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${f.voted ? 'bg-green-500' : 'bg-surface-container-high'}`} />
                <span className="text-xs text-on-surface/60 font-medium">{f.name}</span>
              </div>
            ))}
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
            <img src={current.image} alt={current.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

            {/* Vote overlay feedback */}
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

            {/* Sponsored badge */}
            {current.sponsored && (
              <div className="absolute top-4 left-4 bg-primary-container text-on-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>star</span>
                Sélection du moment
              </div>
            )}

            <div className="absolute inset-0 p-6 flex flex-col justify-end gap-3">
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {current.tags.map(tag => (
                  <span
                    key={tag}
                    className={`backdrop-blur-md text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold ${
                      tag.startsWith('$') ? 'bg-primary-container/90 text-on-primary' : 'bg-white/20 text-white'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Name */}
              <h2 className="text-[2.2rem] font-black text-white leading-tight tracking-tight">{current.name}</h2>

              {/* Stars + meta */}
              <div className="flex items-center gap-3">
                <MichelinStars count={current.stars} size="sm" />
                <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-wide">
                  <span>{current.priceRange}</span>
                  <span className="w-1 h-1 bg-white/30 rounded-full" />
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>location_on</span>
                    {current.location}
                  </span>
                </div>
              </div>

              {/* Quote */}
              <p className="text-white/70 text-sm leading-relaxed line-clamp-2 border-l-2 border-white/20 pl-3">
                {current.quote.replace(/"/g, '')}
              </p>
            </div>
          </div>
        </div>

        {/* Vote Buttons */}
        <div className="flex justify-center items-center gap-6 w-full">
          {/* NON */}
          <button
            onClick={() => handleVote('non')}
            disabled={!!animDir}
            className="group flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-container-lowest border-2 border-outline-variant/30 flex items-center justify-center shadow-[0_8px_30px_rgba(28,27,27,0.08)] hover:border-on-surface/30 hover:bg-surface-container-high transition-all group-hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-on-surface/60 group-hover:text-on-surface transition-colors" style={{ fontSize: '28px' }}>close</span>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-on-surface/40">{t('roulette.nonShort')}</span>
          </button>

          {/* Counter */}
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-on-surface">{currentIndex + 1}</span>
            <span className="text-xs text-on-surface/30 font-bold">/ {MOCK_RESTAURANTS.length}</span>
          </div>

          {/* OUI */}
          <button
            onClick={() => handleVote('oui')}
            disabled={!!animDir}
            className="group flex flex-col items-center gap-2"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-container flex items-center justify-center shadow-[0_12px_30px_rgba(186,11,47,0.3)] hover:bg-primary transition-all group-hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-primary-container">{t('roulette.ouiShort')}</span>
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={() => navigate('/verdict')}
          className="text-xs text-on-surface/30 hover:text-on-surface/60 transition-colors uppercase tracking-widest font-bold"
        >
          {t('roulette.skipToVerdict')}
        </button>
      </main>
    </div>
  );
}
