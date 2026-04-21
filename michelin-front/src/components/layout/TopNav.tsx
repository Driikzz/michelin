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
      </div>
      <div className="border-t border-outline-variant/10">
        <FlowProgress />
      </div>
    </nav>
  );
}
