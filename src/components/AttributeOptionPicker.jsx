import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconPlus, IconSearch } from './icons';

// Searchable single-select combobox for one spec attribute (Brand, Warranty, Material…) — same
// combobox shell as VariantOptionPicker, but single-select: it commits straight to the field's
// plain string value instead of a comma-separated multi-select list. `options` supplies the
// preset list (see data/attributeOptions.js); anything the seller types that isn't in it can
// still be committed as a custom value via the "Add …" row (or just by typing and clicking away)
// — an unlisted brand/warranty/material is never a dead end.
export default function AttributeOptionPicker({ options, value, onChange, placeholder, itemLabel = 'value', fieldClass }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!rootRef.current || rootRef.current.contains(e.target)) return;
      setOpen(false);
      // Free text typed but never explicitly selected/added still commits on blur — otherwise a
      // custom value typed and then clicked away from would be silently lost.
      const trimmed = query.trim();
      if (trimmed !== (value || '')) onChange(trimmed);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, value]);

  const q = query.trim().toLowerCase();
  const matches = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const exactMatch = options.some((o) => o.toLowerCase() === q);

  const select = (name) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[0] && matches[0].toLowerCase() === q) select(matches[0]);
      else if (query.trim()) select(query.trim());
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
          placeholder={placeholder || `Search ${itemLabel}s…`}
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
            {matches.map((name) => (
              <li
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(name);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-[13.5px] cursor-pointer ${
                  value === name ? 'bg-green/10 text-green' : 'text-ink hover:bg-surface-muted'
                }`}
              >
                <span className="flex-1">{name}</span>
                {value === name && <IconCheck width="13" height="13" className="text-green shrink-0" />}
              </li>
            ))}
          </ul>

          {q && !exactMatch && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                select(query.trim());
              }}
              className="w-full flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold text-green hover:bg-green/5 cursor-pointer border-t border-border"
            >
              <IconPlus width="13" height="13" />
              Add "{query.trim()}" as a custom {itemLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
