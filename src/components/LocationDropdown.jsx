import { useEffect, useId, useRef, useState } from 'react';
import { pkCities } from '../data/pkCities';
import { IconChevronDown } from './icons';

// Searchable "Location" combobox — type to filter, click/Enter to select, full keyboard nav
// (Up/Down/Enter/Escape) following the standard ARIA combobox pattern.
export default function LocationDropdown({ value, onChange, label = 'Location', required = false, error, placeholder = 'Search for a city' }) {
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

  const matches = query.trim()
    ? pkCities.filter((city) => city.toLowerCase().includes(query.trim().toLowerCase()))
    : pkCities;

  const select = (city) => {
    onChange(city);
    setQuery(city);
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
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[activeIndex]) select(matches[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const fieldClass = `w-full px-[16px] py-[12px] border rounded-xl text-[14.5px] font-sans bg-white text-ink outline-none transition-shadow ${
    error ? 'border-orange focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)]' : 'border-border focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)]'
  }`;

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink-soft mb-2">
          {label} {required && <span className="text-orange">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`${fieldClass} pr-10`}
        />
        <IconChevronDown width="14" height="14" className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>

      {open && matches.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white border border-border rounded-xl shadow-lg py-1.5"
        >
          {matches.map((city, i) => (
            <li
              key={city}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={value === city}
              onMouseDown={(e) => {
                e.preventDefault();
                select(city);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-4 py-2 text-[14px] cursor-pointer ${
                i === activeIndex ? 'bg-orange-tint text-orange-text' : 'text-ink hover:bg-surface-muted'
              }`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}

      {open && matches.length === 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-sm text-text-muted">
          No matching cities.
        </div>
      )}

      {error && <p className="text-xs text-orange-text mt-2">{error}</p>}
    </div>
  );
}
