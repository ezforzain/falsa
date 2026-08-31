import { useEffect, useState } from 'react';
import { marketplace } from '../../lib/api';
import { IconCheck, IconStar } from '../icons';

export const EMPTY_MARKETPLACE_FILTERS = {
  category: [],
  country: [],
  verified: false,
  officialStore: false,
  freeShipping: false,
  discountOnly: false,
  priceMin: '',
  priceMax: '',
  moqMax: '',
  ratingMin: '',
  sortBy: 'relevance',
};

const SORT_LABELS = {
  relevance: 'Relevance',
  priceAsc: 'Price: Low to High',
  priceDesc: 'Price: High to Low',
  bestSelling: 'Best Selling',
  newest: 'Newest',
  topRated: 'Top Rated',
};

const RATING_OPTIONS = [4, 3];

// The B2B tab's UI/routing key is the legacy 'aimode' (see MARKETPLACE_TABS,
// src/components/marketplace/MarketplaceTabs.jsx — matches the seeded MobileTab key), but the
// backend's FilterConfig section enum (and every /api/marketplace/* route) uses 'b2b'. Normalized
// here, once, rather than needing every page that passes `section` to know about the alias.
const SECTION_ALIASES = { aimode: 'b2b' };

// Section-driven filter panel for the B2B / Spotlight / Worldwide / Free Shipping marketplace
// tabs — one implementation reused across Desktop Home, Mobile Home, and Search. WHICH filters
// appear, in what order, and (for category/country) which option values are offered is admin-
// configured per section (see server/src/models/FilterConfig.js, GET /api/marketplace/filters/:section)
// rather than hardcoded here — that's what makes B2B's panel and Spotlight's panel genuinely
// different. Every field is ANDed together server-side (server/src/utils/marketplaceQuery.js).
// Product name/keyword filtering reuses each page's own existing search input rather than
// duplicating a text field here.
export default function MarketplaceFilters({ section: rawSection, value, onChange }) {
  const section = SECTION_ALIASES[rawSection] || rawSection;
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    marketplace
      .filters(section)
      .then(({ filters: fetched }) => {
        if (!cancelled) setFilters(fetched);
      })
      .catch(() => {
        /* panel just stays empty on failure — not fatal, the tab's products still load */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  const setField = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const toggleBool = (key) => () => onChange({ ...value, [key]: !value[key] });
  const toggleListValue = (key, option) => () => {
    const current = value[key] || [];
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
    onChange({ ...value, [key]: next });
  };
  const toggleRating = (n) => () => onChange({ ...value, ratingMin: value.ratingMin === n ? '' : n });

  const fieldClass =
    'px-3 py-2 border border-border rounded-lg text-[13px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const pillClass = (active) =>
    `flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[12.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
      active ? 'border-green text-green bg-green-tint' : 'border-border bg-white text-ink-soft hover:border-green/40'
    }`;
  const groupLabelClass = 'text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1.5';

  const hasActive =
    (value.category?.length || 0) > 0 ||
    (value.country?.length || 0) > 0 ||
    value.verified ||
    value.officialStore ||
    value.freeShipping ||
    value.discountOnly ||
    value.priceMin !== '' ||
    value.priceMax !== '' ||
    value.moqMax !== '' ||
    value.ratingMin !== '' ||
    (value.sortBy && value.sortBy !== 'relevance');

  if (loading) {
    return <div className="h-9 w-40 bg-surface-muted rounded-lg animate-pulse" />;
  }
  if (filters.length === 0) return null;

  const toggleTypes = { verified: 'Verified Sellers', officialStore: 'Mall / Official Store', freeShipping: 'Free Shipping', discountOnly: 'On Sale' };
  const toggleFilters = filters.filter((f) => f.type in toggleTypes || f.type === 'discount');
  const listFilters = filters.filter((f) => f.type === 'category' || f.type === 'country');
  const rangeFilters = filters.filter((f) => f.type === 'priceRange' || f.type === 'moq');
  const ratingFilter = filters.find((f) => f.type === 'rating');
  const sortFilter = filters.find((f) => f.type === 'sortBy');

  return (
    <div className="flex flex-col gap-4">
      {sortFilter && (
        <div className="flex items-center gap-2">
          <label className="text-[12.5px] font-semibold text-ink-soft shrink-0">{sortFilter.label}</label>
          <select value={value.sortBy} onChange={setField('sortBy')} className={fieldClass}>
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {toggleFilters.map((f) => {
          const key = f.type === 'discount' ? 'discountOnly' : f.type;
          const active = Boolean(value[key]);
          return (
            <button key={f.type} type="button" onClick={toggleBool(key)} className={pillClass(active)}>
              {active && <IconCheck width="13" height="13" strokeWidth="2.6" />}
              {f.label}
            </button>
          );
        })}

        {ratingFilter &&
          RATING_OPTIONS.map((n) => (
            <button key={n} type="button" onClick={toggleRating(n)} className={pillClass(value.ratingMin === n)}>
              <IconStar width="12" height="12" strokeWidth="2.4" />
              {n}★ &amp; up
            </button>
          ))}
      </div>

      {listFilters.map((f) => (
        <div key={f.type}>
          <div className={groupLabelClass}>{f.label}</div>
          <div className="flex flex-wrap gap-2">
            {(f.options || []).map((opt) => (
              <button key={opt} type="button" onClick={toggleListValue(f.type, opt)} className={pillClass((value[f.type] || []).includes(opt))}>
                {(value[f.type] || []).includes(opt) && <IconCheck width="13" height="13" strokeWidth="2.6" />}
                {opt}
              </button>
            ))}
            {(f.options || []).length === 0 && <span className="text-xs text-text-muted">No options yet.</span>}
          </div>
        </div>
      ))}

      {rangeFilters.length > 0 && (
        <div className="flex flex-wrap items-end gap-4">
          {rangeFilters.some((f) => f.type === 'priceRange') && (
            <div>
              <div className={groupLabelClass}>{rangeFilters.find((f) => f.type === 'priceRange').label}</div>
              <div className="flex items-center gap-1.5">
                <input type="number" inputMode="numeric" placeholder="Min" value={value.priceMin} onChange={setField('priceMin')} className={`${fieldClass} w-[90px]`} />
                <span className="text-text-muted text-xs">–</span>
                <input type="number" inputMode="numeric" placeholder="Max" value={value.priceMax} onChange={setField('priceMax')} className={`${fieldClass} w-[90px]`} />
              </div>
            </div>
          )}
          {rangeFilters.some((f) => f.type === 'moq') && (
            <div>
              <div className={groupLabelClass}>{rangeFilters.find((f) => f.type === 'moq').label}</div>
              <input type="number" inputMode="numeric" placeholder="Max MOQ" value={value.moqMax} onChange={setField('moqMax')} className={`${fieldClass} w-[110px]`} />
            </div>
          )}
        </div>
      )}

      {hasActive && (
        <button type="button" onClick={() => onChange(EMPTY_MARKETPLACE_FILTERS)} className="self-start text-[12.5px] font-semibold text-orange-text hover:underline cursor-pointer">
          Clear filters
        </button>
      )}
    </div>
  );
}
