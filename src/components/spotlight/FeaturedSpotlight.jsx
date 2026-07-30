import { useEffect, useMemo, useState } from 'react';
import { catalog } from '../../lib/api';
import { IconSparkle } from '../icons';
import SpotlightCard from './SpotlightCard';

function SkeletonCard() {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="h-[150px] sm:h-[168px] bg-surface-muted animate-pulse" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-surface-muted rounded animate-pulse w-full" />
        <div className="h-3 bg-surface-muted rounded animate-pulse w-2/3" />
        <div className="h-3 bg-surface-muted rounded animate-pulse w-1/2" />
        <div className="h-7 bg-surface-muted rounded-full animate-pulse w-full mt-1" />
      </div>
    </div>
  );
}

// Featured Spotlight — admin-curated products (via the /admin products "Spotlight" toggle),
// shown as a vertically-scrolling grid with its own category filter, independent of the
// near/trending SpotlightEntry rails on the dedicated Spotlight page.
export default function FeaturedSpotlight() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    catalog
      .spotlightFeatured(activeCategory === 'all' ? undefined : activeCategory)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setCategories(res.categories);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load Spotlight right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const categoryChips = useMemo(() => ['all', ...categories], [categories]);

  return (
    <div className="pb-3.5">
      <div className="px-[18px] pb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-orange">
        <IconSparkle width="14" height="14" />
        Featured Spotlight
      </div>

      {categoryChips.length > 1 && (
        <div className="flex flex-wrap gap-2 px-[18px] pb-3">
          {categoryChips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={`text-[12.5px] font-bold px-4 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap ${
                activeCategory === c ? 'bg-ink text-white' : 'bg-surface-muted text-text font-semibold hover:bg-[#EFEBE2]'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-3 px-[18px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="mx-[18px] text-center py-8 px-5 bg-cream rounded-[14px] border border-dashed border-border-strong">
          <div className="text-[13.5px] text-orange-text">{error}</div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mx-[18px] text-center py-10 px-5 bg-white rounded-[14px] border border-dashed border-border-strong">
          <span className="w-11 h-11 rounded-full bg-surface-muted inline-flex items-center justify-center mb-3">
            <IconSparkle width="18" height="18" className="text-text-muted" />
          </span>
          <p className="text-[13.5px] font-semibold text-ink mb-1">No spotlight products yet</p>
          <p className="text-[12.5px] text-text-muted">
            {activeCategory === 'all'
              ? 'Check back soon — admins are still curating this section.'
              : 'No spotlight products in this category yet. Try a different filter.'}
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-[18px]">
          {items.map((item) => (
            <SpotlightCard key={item.product.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
