import { useEffect, useRef, useState } from 'react';
import { IconChevronDown } from '../icons';

// Pill-shaped status chip used across Orders/Products/Promotions/Payouts. Renders read-only
// (no chevron, no click handler) whenever there's nothing real to change to — no `onChange`, a
// single-option cycle, or an explicit `readOnly` — so chips backed by admin-only or non-existent
// state (Promotions, Payouts) can share the exact same visual component as the genuinely
// editable ones (Orders, Products) without ever looking clickable when they aren't.
export default function StatusChipMenu({ status, cycleOptions = [], palette = {}, labelFor, onChange, readOnly = false, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const interactive = !readOnly && typeof onChange === 'function' && cycleOptions.length > 1;

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const display = (value) => (labelFor ? labelFor[value] ?? value : value);
  const colors = palette[status] || { bg: '#0D1329', fg: '#8E9CBF', border: '#1A2242' };

  return (
    <span ref={ref} className="relative inline-block">
      <span
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={() => interactive && !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => interactive && e.key === 'Enter' && setOpen((v) => !v)}
        style={{ background: colors.bg, color: colors.fg, borderColor: colors.border }}
        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border select-none ${
          interactive ? 'cursor-pointer' : ''
        } ${disabled ? 'opacity-60 cursor-wait' : ''}`}
      >
        {display(status)}
        {interactive && <IconChevronDown width="10" height="10" className="opacity-80" />}
      </span>

      {open && interactive && (
        <span className="absolute top-[calc(100%+6px)] left-0 z-20 flex flex-col gap-0.5 p-1.5 rounded-xl bg-surface border border-border-strong shadow-xl min-w-[140px]">
          {cycleOptions.map((opt) => (
            <span
              key={opt}
              role="button"
              tabIndex={0}
              onClick={() => {
                setOpen(false);
                if (opt !== status) onChange(opt);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (setOpen(false), opt !== status && onChange(opt))}
              className={`text-xs font-semibold px-2.5 py-2 rounded-lg cursor-pointer hover:bg-surface-muted ${
                opt === status ? 'text-green' : 'text-text'
              }`}
            >
              {display(opt)}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
