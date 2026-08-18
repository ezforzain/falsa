import { useEffect, useState } from 'react';
import { marketplace } from '../../lib/api';
import { IconCheck } from '../icons';

export const EMPTY_MARKETPLACE_FILTERS = {
  category: '',
  country: '',
  verified: false,
  officialStore: false,
  freeShipping: false,
  priceMin: '',
  priceMax: '',
  moqMax: '',
};

// Shared filter row for the B2B / Spotlight / Worldwide / Free Shipping marketplace tabs — one
// implementation reused across Desktop Home, Mobile Home, and Search, so every tab's filters
// behave identically and combine (every field here is ANDed together server-side, see
// server/src/utils/marketplaceQuery.js). Product name/keyword filtering reuses each page's own
// existing search input rather than duplicating a text field here.
export default function MarketplaceFilters({ categories = [], value, onChange }) {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    let cancelled = false;
    marketplace
      .countries()
      .then(({ countries: fetched }) => {
        if (!cancelled) setCountries(fetched);
      })
      .catch(() => {
        /* country dropdown just stays empty on failure — not fatal */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const toggle = (key) => () => onChange({ ...value, [key]: !value[key] });

  const fieldClass =
    'px-3 py-2 border border-border rounded-lg text-[13px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const pillClass = (active) =>
    `flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[12.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
      active ? 'border-green text-green bg-green-tint' : 'border-border bg-white text-ink-soft hover:border-green/40'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button type="button" onClick={toggle('freeShipping')} className={pillClass(value.freeShipping)}>
        {value.freeShipping && <IconCheck width="13" height="13" strokeWidth="2.6" />}
        Free Shipping
      </button>
      <button type="button" onClick={toggle('verified')} className={pillClass(value.verified)}>
        {value.verified && <IconCheck width="13" height="13" strokeWidth="2.6" />}
        Verified Sellers
      </button>
      <button type="button" onClick={toggle('officialStore')} className={pillClass(value.officialStore)}>
        {value.officialStore && <IconCheck width="13" height="13" strokeWidth="2.6" />}
        Mall / Official Store
      </button>

      <select value={value.category} onChange={set('category')} className={fieldClass}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.key} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <select value={value.country} onChange={set('country')} className={fieldClass}>
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Min price"
          value={value.priceMin}
          onChange={set('priceMin')}
          className={`${fieldClass} w-[100px]`}
        />
        <span className="text-text-muted text-xs">–</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Max price"
          value={value.priceMax}
          onChange={set('priceMax')}
          className={`${fieldClass} w-[100px]`}
        />
      </div>

      <input
        type="number"
        inputMode="numeric"
        placeholder="Max MOQ"
        value={value.moqMax}
        onChange={set('moqMax')}
        className={`${fieldClass} w-[100px]`}
      />

      {Object.values(value).some((v) => v !== '' && v !== false) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_MARKETPLACE_FILTERS)}
          className="text-[12.5px] font-semibold text-orange-text hover:underline cursor-pointer"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
