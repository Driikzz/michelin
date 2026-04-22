import { useToast } from '../../contexts/ToastContext';

const STYLE_MAP = {
  success: 'bg-green-900/90 border-green-700 text-green-100',
  error: 'bg-red-900/90 border-red-700 text-red-100',
  info: 'bg-neutral-800/90 border-neutral-600 text-neutral-100',
};

const ICON_MAP = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

export function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-sm shadow-xl pointer-events-auto max-w-sm w-full ${STYLE_MAP[toast.type]}`}
        >
          <span
            className="material-symbols-outlined shrink-0"
            style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
          >
            {ICON_MAP[toast.type]}
          </span>
          <p className="text-sm font-semibold flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
