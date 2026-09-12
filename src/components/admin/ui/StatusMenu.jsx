import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCheck, IconChevronDown } from '../../icons';

const DOT_COLORS = {
  neutral: 'var(--admin-text-muted)',
  primary: 'var(--admin-primary)',
  success: 'var(--admin-success)',
  info: 'var(--admin-info)',
  warning: 'var(--admin-warning)',
  danger: 'var(--admin-danger)',
  solid: 'var(--admin-success)',
};

const TEXT_COLORS = {
  neutral: 'text-[var(--admin-text)]',
  primary: 'text-[var(--admin-primary)]',
  success: 'text-[var(--admin-success)]',
  info: 'text-[var(--admin-info)]',
  warning: 'text-[var(--admin-warning)]',
  danger: 'text-[var(--admin-danger)]',
  solid: 'text-[var(--admin-success)]',
};

const MENU_WIDTH = 190;
const GAP = 6;

// Replaces the plain native <select> the Orders tab used to change an order's status with a
// popover matching the "Change status" mockup (colored dot + label + checkmark). The positioning
// bug this fixes: a floating menu that computes its position once but never re-checks it will
// visually drift away from its own row the moment the page (or the table's own horizontal-scroll
// wrapper) scrolls. Rather than trying to track every scroll tick, this menu simply closes the
// instant ANY scroll happens (capture-phase, so it also catches the table's own overflow-x
// container) — the standard, robust pattern most dropdown libraries use — so it can never be seen
// hanging in the wrong place. It reopens, freshly positioned from its own trigger's current
// on-screen position, on the next click.
export default function StatusMenu({ value, options, toneOf, disabled, pending, onSelect }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const close = () => setOpen(false);

  const openMenu = () => {
    if (disabled || pending) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 220 && rect.top > 220;
    setCoords({
      left: Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8),
      top: openUpward ? rect.top - GAP : rect.bottom + GAP,
      openUpward,
      width: Math.max(rect.width, MENU_WIDTH),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;

    const onScroll = () => close();
    const onResize = () => close();
    const onKeyDown = (e) => e.key === 'Escape' && close();
    const onPointerDown = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      close();
    };

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open]);

  const tone = toneOf(value) || 'neutral';

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled || pending}
        onClick={() => (open ? close() : openMenu())}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full whitespace-nowrap cursor-pointer disabled:cursor-wait disabled:opacity-60 transition-colors"
        style={{ background: `color-mix(in srgb, ${DOT_COLORS[tone]} 16%, transparent)` }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: DOT_COLORS[tone] }} />
        <span className={TEXT_COLORS[tone]}>{pending ? 'Saving…' : value}</span>
        {!pending && <IconChevronDown width="11" height="11" className={TEXT_COLORS[tone]} />}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="admin-shell fixed z-[200] bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl shadow-[var(--admin-shadow-lg)] py-1.5 overflow-hidden"
            style={{
              left: coords.left,
              top: coords.openUpward ? undefined : coords.top,
              bottom: coords.openUpward ? window.innerHeight - coords.top : undefined,
              width: coords.width,
            }}
          >
            <div className="px-3.5 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--admin-text-muted)]">
              Change status
            </div>
            {options.map((opt) => {
              const optTone = toneOf(opt) || 'neutral';
              const isCurrent = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    close();
                    if (!isCurrent) onSelect(opt);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left cursor-pointer hover:bg-[var(--admin-canvas)] transition-colors"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DOT_COLORS[optTone] }} />
                  <span className="flex-1 text-[var(--admin-ink-soft)]">{opt}</span>
                  {isCurrent && <IconCheck width="13" height="13" className="text-[var(--admin-primary)] shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
