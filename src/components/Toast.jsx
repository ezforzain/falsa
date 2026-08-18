import { useEffect } from 'react';
import { IconAlertCircle, IconCheck } from './icons';

export default function Toast({ message, show, onHide, duration = 2500, variant = 'success' }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onHide, duration);
    return () => clearTimeout(t);
  }, [show, onHide, duration]);

  if (!show) return null;

  const isError = variant === 'error';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-4 w-full flex justify-center pointer-events-none">
      {/* Deliberately a fixed dark pill in both themes (like most snackbar/toast UIs) rather
          than `bg-ink`, which flips to near-white in dark mode and would swallow the white text. */}
      <div className="pointer-events-auto flex items-center gap-2.5 bg-[#1B1F1D] text-white text-sm font-semibold pl-3.5 pr-5 py-3 rounded-full shadow-2xl animate-fade-up">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isError ? 'bg-orange' : 'bg-green'}`}>
          {isError ? <IconAlertCircle width="13" height="13" strokeWidth="3" /> : <IconCheck width="13" height="13" strokeWidth="3" />}
        </span>
        {message}
      </div>
    </div>
  );
}
