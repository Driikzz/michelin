import { NavLink } from 'react-router-dom';
import { FlowProgress } from './FlowProgress';

export function TopNav() {
  return (
    <nav className="flex flex-col w-full sticky py-5 top-0 z-50 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/10">
      
      <div className="border-t border-outline-variant/10 relative flex items-center">
        <div className="absolute left-1/2 -translate-x-1/2">
          <FlowProgress />
        </div>
        <NavLink
          to="/profile"
          className="ml-auto mr-3 w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-all"
          aria-label="Mon profil"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
        </NavLink>
      </div>
    </nav>
  );
}
