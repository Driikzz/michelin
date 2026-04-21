import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const STEPS = [
  { path: '/lobby', key: 'flow.step1', icon: 'meeting_room' },
  { path: '/deck', key: 'flow.step2', icon: 'style' },
  { path: '/roulette', key: 'flow.step3', icon: 'how_to_vote' },
  { path: '/verdict', key: 'flow.step4', icon: 'military_tech' },
];

export function FlowProgress() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const currentIdx = STEPS.findIndex(s => s.path === pathname);
  if (currentIdx === -1) return null;

  return (
    <div className="flex items-center justify-center px-6 py-3 gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const accessible = i <= currentIdx;

        return (
          <div key={step.path} className="flex items-center">
            <button
              onClick={() => accessible && navigate(step.path)}
              disabled={!accessible}
              className={`flex flex-col items-center gap-1 transition-all ${accessible ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                done ? 'bg-primary-container text-on-primary' :
                active ? 'bg-on-surface text-surface ring-4 ring-on-surface/10' :
                'bg-surface-container-high text-on-surface/30'
              }`}>
                {done
                  ? <span className="material-symbols-outlined text-sm" style={{ fontSize: '16px' }}>check</span>
                  : <span className="material-symbols-outlined text-sm" style={{ fontSize: '16px' }}>{step.icon}</span>
                }
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest hidden sm:block ${
                active ? 'text-on-surface' : done ? 'text-primary-container' : 'text-on-surface/30'
              }`}>
                {t(step.key)}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 sm:w-12 mx-1 transition-all ${i < currentIdx ? 'bg-primary-container' : 'bg-surface-container-high'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
