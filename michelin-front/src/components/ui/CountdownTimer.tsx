import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CountdownTimerProps {
  initialSeconds: number;
  large?: boolean;
  onEnd?: () => void;
}

export function CountdownTimer({ initialSeconds, large = false, onEnd }: CountdownTimerProps) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) { onEnd?.(); return; }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, onEnd]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  if (large) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface/50 mb-1">
          {t('deck.timeToCurate')}
        </span>
        <div className="text-[4rem] font-bold tracking-tighter text-on-surface leading-none">{mm}:{ss}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-primary-container">
      <span className="material-symbols-outlined text-[3rem]" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
      <span className="text-[3.5rem] font-bold tracking-[-0.02em] leading-none">{seconds}</span>
    </div>
  );
}
