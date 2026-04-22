import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-2xl ring-1 ring-black/5 md:left-auto md:right-6 md:w-80">
      <img src="/michelin.png" alt="Michelin" className="h-6 w-auto shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1c1b1b]">Installer l'application</p>
        <p className="text-xs text-[#1c1b1b]/60">Accès rapide depuis votre écran d'accueil</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={dismiss}
          className="rounded-lg p-1.5 text-[#1c1b1b]/40 transition-colors hover:bg-black/5"
          aria-label="Fermer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
        <button
          onClick={install}
          className="rounded-lg bg-[#ba0b2f] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#9a0927]"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
