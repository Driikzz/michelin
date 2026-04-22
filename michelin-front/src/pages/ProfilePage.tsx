import { TopNav } from '../components/layout/TopNav';

export function ProfilePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <article className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_16px_45px_rgba(28,27,27,0.08)] border border-outline-variant/20">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src="https://i.pravatar.cc/180?img=47"
                  alt="Julien Marchand"
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-surface-container-low"
                />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-tertiary-fixed-dim text-[10px] font-black px-2 py-1 text-on-surface">
                  LVL 42
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight">Julien Marchand</h1>
                <p className="text-sm text-on-surface/55 uppercase tracking-wide mt-1">Paris, France</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="rounded-2xl bg-surface-container-low p-3">
                <p className="text-[11px] uppercase tracking-widest text-on-surface/45 font-bold">Expert Voyageur</p>
                <p className="text-3xl font-black mt-2 leading-none">128</p>
                <p className="text-xs text-primary-container font-bold mt-1">cities</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3">
                <p className="text-[11px] uppercase tracking-widest text-on-surface/45 font-bold">Gastronomy Score</p>
                <p className="text-3xl font-black mt-2 leading-none">9.4</p>
                <p className="text-xs text-tertiary-container font-bold mt-1">Top 1%</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface/55">
                <span>XP Progress</span>
                <span>8,420 / 10,000</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-container-high mt-2 overflow-hidden">
                <div className="h-full w-[84%] bg-gradient-to-r from-primary-container via-orange-500 to-yellow-400 rounded-full" />
              </div>
            </div>
          </article>

          <section className="lg:col-span-8 relative rounded-3xl overflow-hidden min-h-[540px] border border-outline-variant/20 shadow-[0_20px_55px_rgba(28,27,27,0.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,#ccad9c_0,#b38f7a_30%,#987b69_55%,#7e6557_100%)]" />
            <div className="absolute inset-0 opacity-45 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.14)_100%)]" />

            <div className="absolute top-5 left-5 z-10 bg-surface-container-lowest/90 backdrop-blur px-4 py-2 rounded-full shadow-md flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '16px' }}>location_on</span>
              <span className="text-xs font-bold uppercase tracking-wide">Le Marais, Paris</span>
            </div>

            <div className="absolute top-5 right-5 z-10 flex flex-col gap-2">
              <button className="w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur shadow flex items-center justify-center">
                <span className="material-symbols-outlined">add</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur shadow flex items-center justify-center">
                <span className="material-symbols-outlined">remove</span>
              </button>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%] z-10">
              <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary shadow-[0_10px_25px_rgba(186,11,47,0.45)] flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              </div>
            </div>

            <article className="absolute left-4 right-4 bottom-4 md:left-8 md:right-8 bg-surface-container-lowest rounded-2xl p-3 md:p-4 shadow-[0_18px_45px_rgba(28,27,27,0.22)] flex items-center gap-3 z-20">
              <img
                src="https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=400&q=80"
                alt="L'Eclat Noir"
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg md:text-xl font-black tracking-tight truncate">L'Eclat Noir</h2>
                  <div className="flex items-center gap-1 text-sm font-bold text-tertiary-container">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span>4.9</span>
                  </div>
                </div>
                <p className="text-xs md:text-sm uppercase tracking-wider text-on-surface/55">Modern French Gastronomy</p>
                <div className="flex items-center gap-3 text-[11px] md:text-xs text-on-surface/45 font-semibold mt-1">
                  <span>18:00</span>
                  <span>23:00</span>
                  <span>Premium</span>
                </div>
              </div>
              <button className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:bg-primary transition-colors shrink-0">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
              </button>
            </article>
          </section>
        </section>
      </main>
    </div>
  );
}
