import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconClose, IconPlus, IconSearch } from './icons';

// Searchable, multi-select combobox for one variant axis (Color, Size, Shade…) — same combobox
// shell as CategoryPicker, but multi-select with chips instead of single-select. `preset` supplies
// the full option list (with search); anything the seller types that isn't in that list can be
// added as a one-off custom option via the "Add …" row, so an unlisted color/size is never a
// dead end. Selection is kept as the same comma-separated string the rest of the form already
// reads (form.variantAxes[key]) so cartesianVariants/submit don't need to change.
export default function VariantOptionPicker({ preset, value, onChange, placeholder, fieldClass }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [customOptions, setCustomOptions] = useState([]);
  const rootRef = useRef(null);

  const selected = String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const allOptions = [
    ...preset.options.map((o) => (typeof o === 'string' ? { name: o, hex: undefined } : o)),
    ...customOptions.map((name) => ({ name, hex: undefined })),
  ];
  const q = query.trim().toLowerCase();
  const matches = q ? allOptions.filter((o) => o.name.toLowerCase().includes(q)) : allOptions;
  const exactMatch = allOptions.some((o) => o.name.toLowerCase() === q);

  const commit = (names) => onChange(names.join(', '));

  const toggle = (name) => {
    const isSelected = selected.some((s) => s.toLowerCase() === name.toLowerCase());
    commit(isSelected ? selected.filter((s) => s.toLowerCase() !== name.toLowerCase()) : [...selected, name]);
  };

  const addCustom = () => {
    const name = query.trim();
    if (!name) return;
    if (!allOptions.some((o) => o.name.toLowerCase() === name.toLowerCase())) {
      setCustomOptions((c) => [...c, name]);
    }
    if (!selected.some((s) => s.toLowerCase() === name.toLowerCase())) commit([...selected, name]);
    setQuery('');
  };

  const remove = (name) => commit(selected.filter((s) => s !== name));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!q) return;
      const hit = matches[0];
      if (hit && hit.name.toLowerCase() === q) toggle(hit.name);
      else addCustom();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <IconSearch width="13" height="13" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          placeholder={selected.length > 0 ? 'Search or add more…' : placeholder || 'Search options…'}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`${fieldClass} !pl-8`}
        />
      </div>

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white border border-border rounded-xl shadow-lg py-1.5">
          {matches.length === 0 && !q && <div className="px-3.5 py-3 text-[12.5px] text-text-muted">No options yet — type to add one.</div>}
          <ul>
            {matches.map((opt) => {
              const isSelected = selected.some((s) => s.toLowerCase() === opt.name.toLowerCase());
              return (
                <li
                  key={opt.name}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggle(opt.name);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-[13.5px] cursor-pointer ${
                    isSelected ? 'bg-green/10 text-green' : 'text-ink hover:bg-surface-muted'
                  }`}
                >
                  {preset.type === 'color' && (
                    <span
                      className="w-4 h-4 rounded-full border border-border shrink-0"
                      style={{
                        background:
                          opt.hex || 'conic-gradient(red, orange, yellow, green, blue, purple, red)',
                      }}
                    />
                  )}
                  <span className="flex-1">{opt.name}</span>
                  {isSelected && <IconCheck width="13" height="13" className="text-green shrink-0" />}
                </li>
              );
            })}
          </ul>

          {q && !exactMatch && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addCustom();
              }}
              className="w-full flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold text-green hover:bg-green/5 cursor-pointer border-t border-border"
            >
              <IconPlus width="13" height="13" />
              Add "{query.trim()}" as a custom option
            </button>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {selected.map((name) => {
            const opt = allOptions.find((o) => o.name.toLowerCase() === name.toLowerCase());
            return (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft bg-surface-muted rounded-full pl-1.5 pr-1.5 py-0.5"
              >
                {preset.type === 'color' && (
                  <span
                    className="w-3 h-3 rounded-full border border-border shrink-0"
                    style={{ background: opt?.hex || 'conic-gradient(red, orange, yellow, green, blue, purple, red)' }}
                  />
                )}
                {name}
                <button
                  type="button"
                  onClick={() => remove(name)}
                  aria-label={`Remove ${name}`}
                  className="cursor-pointer text-text-muted hover:text-orange-text p-0.5 rounded-full"
                >
                  <IconClose width="10" height="10" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
