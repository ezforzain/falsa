import { useEffect, useMemo, useRef, useState } from 'react';
import { catalog } from '../../lib/api';
import { IconSparkle } from '../icons';
import SpotlightCard from './SpotlightCard';

const AUTOPLAY_INTERVAL_MS = 3200;
const RESUME_AFTER_MS = 4000;

function SkeletonCard() {
  return (
    <div className="w-[210px] sm:w-[240px] shrink-0 bg-white border border-border rounded-2xl overflow-hidden">
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
// shown as an autoplaying horizontal carousel with its own category filter, independent of the
// near/trending SpotlightEntry rails on the dedicated Spotlight page.
export default function FeaturedSpotlight() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const scrollerRef = useRef(null);
  const autoplayRef = useRef(null);
  const resumeTimerRef = useRef(null);

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

  const stopAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (items.length < 2) return;
    autoplayRef.current = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      const cardWidth = el.firstChild?.offsetWidth || 220;
      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + cardWidth + 10,
        behavior: 'smooth',
      });
    }, AUTOPLAY_INTERVAL_MS);
  };

  useEffect(() => {
    if (!loading && !error && items.length > 0) startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, items]);

  const pauseThenResume = () => {
    stopAutoplay();
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(startAutoplay, RESUME_AFTER_MS);
  };

  useEffect(() => () => clearTimeout(resumeTimerRef.current), []);

  return (
    <div className="pb-3.5">
      <div className="px-[18px] pb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-orange">
        <IconSparkle width="14" height="14" />
        Featured Spotlight
      </div>

      {categoryChips.length > 1 && (
        <div className="flex gap-2 px-[18px] pb-3 overflow-x-auto no-scrollbar">
          {categoryChips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={`shrink-0 text-[12.5px] font-bold px-4 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap ${
                activeCategory === c ? 'bg-ink text-white' : 'bg-surface-muted text-text font-semibold hover:bg-[#EFEBE2]'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex gap-3 px-[18px] overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
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
        <div
          ref={scrollerRef}
          onPointerDown={pauseThenResume}
          onTouchStart={pauseThenResume}
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
          className="flex gap-3 px-[18px] overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
        >
          {items.map((item) => (
            <SpotlightCard key={item.product.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
