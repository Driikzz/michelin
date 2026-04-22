import { NavLink } from 'react-router-dom';
import { FlowProgress } from './FlowProgress';

export function TopNav() {
  return (
    <nav className="flex flex-col w-full sticky top-0 z-50 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/10">
      <div className="flex items-center justify-end px-4 py-1.5">
        <NavLink
          to="/profile"
          className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-all"
          aria-label="Mon profil"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
        </NavLink>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-1 items-center">
          {[
            { to: '/lobby', label: t('nav.lobby') },
            { to: '/deck', label: t('nav.deck') },
            { to: '/roulette', label: t('nav.roulette') },
            { to: '/verdict', label: t('nav.rankings') },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? 'px-4 py-2 rounded-lg bg-primary-container text-on-primary text-sm font-bold transition-all'
                  : 'px-4 py-2 rounded-lg text-on-surface/60 hover:text-on-surface hover:bg-surface-container text-sm font-semibold transition-all'
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center">
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface/60 hover:text-on-surface hover:bg-surface-container transition-all"
            aria-label={t('common.notifications')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
          </button>
          <NavLink
            to="/profile"
            className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
          </NavLink>
        </div>
      </div>
      <div className="border-t border-outline-variant/10">
        <FlowProgress />
      </div>
    </nav>
  );
}
