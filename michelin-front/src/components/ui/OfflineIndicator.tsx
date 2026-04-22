import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setTimeout(() => setShowBanner(false), 2000);
    };
    const onOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-all ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-[#1c1b1b] text-white'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">
        {isOnline ? 'wifi' : 'wifi_off'}
      </span>
      {isOnline ? 'Connexion rétablie' : 'Hors ligne'}
    </div>
  );
}
