import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNav } from '../components/layout/TopNav';
import { RestaurantCard } from '../components/game/RestaurantCard';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import { MOCK_RESTAURANTS, MOCK_NEARBY } from '../data/mockData';

export function DeckBuilderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deck, setDeck] = useState<string[]>([]);

  const toggleDeck = (id: string) =>
    setDeck(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = MOCK_RESTAURANTS.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNav />

      {/* Header avec timer */}
      <header className="px-6 md:px-10 pt-6 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">
              {t('deck.curatorTitle')}
            </h1>
            <p className="text-sm text-on-surface/50 mt-0.5">{t('deck.curatorSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <CountdownTimer initialSeconds={30} large />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(r => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              onAdd={() => toggleDeck(r.id)}
              onView={() => {}}
              added={deck.includes(r.id)}
            />
          ))}
        </div>

        {/* Explore the neighborhood */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-on-surface tracking-tight">{t('deck.exploreNeighborhood')}</h2>
              <p className="text-xs font-bold text-primary-container uppercase tracking-widest mt-0.5">Paris, France</p>
            </div>
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-full border border-outline-variant/20 hover:bg-surface-container-low transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>
              <button className="w-9 h-9 rounded-full border border-outline-variant/20 hover:bg-surface-container-low transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>
            </div>
          </div>

          {/* Map */}
          <div className="relative w-full h-44 md:h-56 bg-surface-container-high rounded-2xl overflow-hidden border border-outline-variant/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-on-surface/20">
                <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 0" }}>map</span>
                <span className="text-xs uppercase tracking-widest font-bold">Carte interactive</span>
              </div>
            </div>
            {/* Pulse user marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-10 h-10 bg-primary-container/20 rounded-full animate-ping" />
                <div className="w-4 h-4 bg-primary-container rounded-full border-2 border-white shadow-lg" />
              </div>
            </div>
            {/* Resto markers */}
            {[
              { top: '30%', left: '35%' }, { top: '65%', left: '60%' },
              { top: '25%', left: '70%' }, { top: '55%', left: '25%' },
            ].map((pos, i) => (
              <div key={i} className="absolute w-3 h-3 bg-on-surface/60 rounded-full border-2 border-white shadow-sm" style={pos} />
            ))}
          </div>

          {/* Nearby cards */}
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {MOCK_NEARBY.map(r => (
              <div
                key={r.id}
                onClick={() => toggleDeck(r.id)}
                className={`flex-shrink-0 w-48 rounded-2xl p-4 border cursor-pointer transition-all group ${
                  deck.includes(r.id)
                    ? 'bg-primary-container/5 border-primary-container/30'
                    : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-on-surface text-sm leading-tight">{r.name}</h4>
                  <div className="flex gap-0.5 shrink-0 ml-1">
                    {Array.from({ length: r.stars }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-primary-container" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                    {r.stars === 0 && <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>award_star</span>}
                  </div>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface/50 font-bold mb-2">{r.cuisine}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-on-surface/50">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>near_me</span>
                    <span>{r.distance}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${deck.includes(r.id) ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface/40 group-hover:bg-primary-container/20 group-hover:text-primary-container'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
                      {deck.includes(r.id) ? 'check' : 'add'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Mobile bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50">
        <div className="bg-surface/95 backdrop-blur-2xl border-t border-outline-variant/10 px-5 pt-3 pb-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-on-surface/50 px-1">
            <span>{t('deck.deckCount', { count: deck.length })}</span>
            {deck.length > 0 && (
              <button onClick={() => setDeck([])} className="text-primary-container font-bold">{t('deck.clearDeck')}</button>
            )}
          </div>
          <button
            onClick={() => navigate('/roulette')}
            className="w-full bg-primary-container text-on-primary py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_8px_20px_rgba(186,11,47,0.25)] hover:bg-primary transition-all active:scale-[0.98] flex justify-center items-center gap-2"
          >
            <span>{t('deck.launchRoulette')}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Desktop CTA */}
      <div className="hidden lg:flex justify-center py-10 px-10">
        <button
          onClick={() => navigate('/roulette')}
          className="bg-primary-container text-on-primary py-5 px-14 rounded-2xl font-black text-base uppercase tracking-widest hover:bg-primary transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_12px_30px_rgba(186,11,47,0.25)] flex items-center gap-3"
        >
          {t('deck.launchRoulette')}
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
        </button>
      </div>

      <div className="h-28 lg:hidden" />
    </div>
  );
}
