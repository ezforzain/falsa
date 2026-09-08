import { useEffect, useRef, useState } from 'react';
import { IconSearch } from './icons';

// Generic searchable dropdown — a real listbox (not a dead styled <div>) with a search box
// pinned to the top, so a long list (countries, provinces, cities…) stays usable by typing
// instead of scrolling. Options can be plain strings or { value, label, icon } objects (icon is
// rendered before the label — used for country flags).
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  disabled = false,
  emptyText = 'No matches.',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const normalized = options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt, icon: null } : opt));
  const selected = normalized.find((opt) => opt.value === value) || null;

  const needle = query.trim().toLowerCase();
  const filtered = needle ? normalized.filter((opt) => opt.label.toLowerCase().includes(needle)) : normalized;

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex items-center justify-between px-[18px] py-[15px] border-[1.5px] border-border rounded-xl text-[15px] bg-surface transition-colors ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-green'
        }`}
      >
        <span className={`flex items-center gap-2 truncate ${selected ? 'text-ink' : 'text-text-muted'}`}>
          {selected?.icon && <span>{selected.icon}</span>}
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {open && !disabled && (
        <div className="absolute z-20 mt-1.5 w-full bg-surface border-[1.5px] border-border rounded-xl shadow-[0_20px_44px_-16px_rgba(0,0,0,0.24)] overflow-hidden">
          <div className="p-2 border-b border-border/60 relative">
            <IconSearch width="14" height="14" className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3.5 py-2.5 border-[1.5px] border-border rounded-lg text-[14px] bg-surface text-ink outline-none focus:border-green"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-[13.5px] text-text-muted">{emptyText}</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] hover:bg-green-tint/60 transition-colors ${
                    value === opt.value ? 'text-green font-semibold' : 'text-ink'
                  }`}
                >
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
