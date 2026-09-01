import { useEffect, useId, useRef, useState } from 'react';
import { productCategories } from '../data/productCategories';
import { IconChevronDown } from './icons';

// Searchable "Category" combobox for the seller product form — same combobox pattern as
// LocationDropdown, but grouped by category group and filtered across name + keywords.
export default function CategoryPicker({ value, onChange, fieldClass, labelClass, label = 'Category' }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const listboxId = useId();
  const inputId = useId();

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? productCategories.filter((c) => c.name.toLowerCase().includes(q) || c.keywords.some((k) => k.includes(q)))
    : productCategories;

  const grouped = matches.reduce((acc, c) => {
    (acc[c.group] ||= []).push(c);
    return acc;
  }, {});
  const flatMatches = Object.values(grouped).flat();

  const select = (cat) => {
    onChange(cat.name);
    setQuery(cat.name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatMatches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatMatches[activeIndex]) select(flatMatches[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={query}
          placeholder="Search categories…"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange('');
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`${fieldClass} pr-9`}
        />
        <IconChevronDown width="13" height="13" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>

      {open && flatMatches.length > 0 && (
        <ul id={listboxId} role="listbox" className="absolute z-20 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white border border-border rounded-xl shadow-lg py-1.5">
          {Object.entries(grouped).map(([group, cats]) => (
            <li key={group}>
              <div className="px-3.5 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">{group}</div>
              <ul>
                {cats.map((cat) => {
                  const i = flatMatches.indexOf(cat);
                  return (
                    <li
                      key={cat.key}
                      role="option"
                      aria-selected={value === cat.name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        select(cat);
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`px-3.5 py-2 text-[13.5px] cursor-pointer ${
                        i === activeIndex ? 'bg-green/10 text-green' : 'text-ink hover:bg-surface-muted'
                      }`}
                    >
                      {cat.name}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {open && flatMatches.length === 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-lg px-3.5 py-3 text-sm text-text-muted">
          No matching categories.
        </div>
      )}
    </div>
  );
}
