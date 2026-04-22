import { NavLink } from 'react-router-dom';
import { FlowProgress } from './FlowProgress';

export function TopNav() {
  return (
    <nav className="flex flex-col w-full sticky top-0 z-50 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/10" aria-label="Navigation principale">
      <a href="#main-content" className="skip-link">Aller au contenu principal</a>

      {/* Mobile: brand left + profile right */}
      <div className="flex sm:hidden items-center justify-between px-5 py-3">
        <img
          src="/michelin.png"
          alt="Michelin"
          className="h-8 w-auto object-contain"
        />
        <NavLink
          to="/profile"
          className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-all"
          aria-label="Mon profil"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
        </NavLink>
      </div>

      {/* Flow progress row — full width on mobile, centered+profile on desktop */}
      <div className="border-t border-outline-variant/10 relative flex items-center sm:px-6 sm:py-3">
        <img
          src="/michelin.png"
          alt="Michelin"
          className="hidden sm:block h-[5.5rem] w-auto object-contain"
        />
        <div className="flex-1 sm:flex-none sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex justify-center">
          <FlowProgress />
        </div>
        <NavLink
          to="/profile"
          className="hidden sm:flex ml-auto w-9 h-9 rounded-full bg-surface-container-high items-center justify-center text-on-surface hover:bg-surface-container-highest transition-all"
          aria-label="Mon profil"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
        </NavLink>
      </div>
    </nav>
  );
}
