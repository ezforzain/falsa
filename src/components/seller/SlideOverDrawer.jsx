import { useEffect, useRef } from 'react';
import { IconClose } from '../icons';

// Right-side "quick view" detail panel — used where a table has no dedicated detail page (e.g.
// SellerCustomers). Same open/close mechanics as ProfileDrawer.jsx (scrim fade + slide
// transition, Escape-to-close, body-scroll-lock), mirrored on the opposite edge.
export default function SlideOverDrawer({ open, onClose, kicker, title, subtitle, stats = [], history = [] }) {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (open) wasOpenRef.current = true;
  if (!wasOpenRef.current) return null;

  return (
    <div className="fixed inset-0 z-[110]" aria-hidden={!open} style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-y-0 right-0 w-[min(420px,92vw)] h-full overflow-y-auto bg-cream-dark border-l border-border p-6 flex flex-col gap-5 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-[11px] tracking-[1.6px] uppercase font-bold text-text">{kicker}</div>
            <div className="text-xl font-extrabold tracking-[-0.3px] text-ink truncate">{title}</div>
            {subtitle && <div className="text-xs text-text">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-8 h-8 rounded-lg border border-border bg-surface text-text-muted hover:text-ink flex items-center justify-center cursor-pointer"
          >
            <IconClose width="14" height="14" />
          </button>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((s) => (
              <div key={s.label} className="border border-border rounded-2xl bg-surface p-3.5">
                <div className="text-[10.5px] tracking-[1.3px] uppercase font-bold text-text">{s.label}</div>
                <div className="text-base font-extrabold text-ink mt-1.5">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="text-[11px] tracking-[1.6px] uppercase font-bold text-text">History</div>
            {history.map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface border border-border">
                <span className="w-2 h-2 mt-1.5 shrink-0 rounded-full" style={{ background: h.dot || '#5B8DEF' }} />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-ink">{h.title}</span>
                  {h.note && <span className="text-xs text-text-muted">{h.note}</span>}
                </div>
                {h.when && <span className="text-xs text-text-muted whitespace-nowrap">{h.when}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
