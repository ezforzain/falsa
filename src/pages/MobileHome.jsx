import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { normalizeQuery, searchHints, unsplash, mobileTabs as fallbackTabs } from '../data/mockData';
import { catalog, marketplace } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getBuyerCountry } from '../lib/buyerCountry';
import useRotatingHints from '../hooks/useRotatingHints';
import useInfiniteFeed from '../hooks/useInfiniteFeed';
import usePullToRefresh from '../hooks/usePullToRefresh';
import SearchHintOverlay from '../components/SearchHintOverlay';
import MobileTopBar from '../components/MobileTopBar';
import MarketplaceFilters, { EMPTY_MARKETPLACE_FILTERS } from '../components/marketplace/MarketplaceFilters';
import MobileProductCard from '../components/product/MobileProductCard';
import { IconSearch, IconSliders, IconArrowRight, IconTruck, IconPin, IconGift, IconStore, IconBox, IconSparkle, IconGrid, IconClock } from '../components/icons';

// Accent used only for this new home look (hero CTA + active tab pill) — deliberately a
// different shade from the admin panel's #7C3AED so the two never read as the same theme.
const ACCENT = '#6C63FF';

// Static, decorative shortcuts into the Categories page — the reference design shows a fixed
// fashion-style set (Women/Men/Kids/...) that doesn't correspond to this catalog's real,
// admin-managed taxonomy (Textiles, Electronics, Rice & Grains, ...). Rather than mislabel real
// products or fork the real Category model, these are presentational nav shortcuts only; live
// category filtering still happens via the Filters panel below and the dedicated Categories page.
const DISPLAY_CATEGORIES = [
  { key: 'women', name: 'Women', img: unsplash('photo-1483985988355-763728e1935b', 200), fallback: IconGrid },
  { key: 'men', name: 'Men', img: unsplash('photo-1516257984-b1b4d707412e', 200), fallback: IconGrid },
  { key: 'kids', name: 'Kids', img: unsplash('photo-1503457574465-89094ee2d2b0', 200), fallback: IconGift },
  { key: 'beauty', name: 'Beauty', img: unsplash('photo-1596462502278-27bfdc403348', 200), fallback: IconSparkle },
  { key: 'home', name: 'Home', img: unsplash('photo-1567016432779-094069958ea5', 200), fallback: IconBox },
  { key: 'accessories', name: 'Accessories', img: unsplash('photo-1584917865442-de89df76afd3', 200), fallback: IconBox },
  { key: 'market', name: 'Market', img: unsplash('photo-1555529669-e69e7aa0ba9a', 200), fallback: IconStore },
];

// The real B2B / Spotlight / Worldwide / Free Shipping marketplace tabs — kept as-is per
// feedback (only their look changed to the segmented-pill style, not the tabs themselves).
// Same keys as the seeded MobileTab list (server/src/seed/data.js).
const MARKETPLACE_FETCHERS = {
  aimode: marketplace.b2b,
  spotlight: marketplace.spotlight,
  worldwide: marketplace.worldwide,
  freeshipping: marketplace.freeShipping,
};

function CategoryCircleImg({ img, alt, FallbackIcon }) {
  return (
    <span className="relative w-full h-full block bg-surface-muted">
      <span className="absolute inset-0 flex items-center justify-center text-text-muted">
        <FallbackIcon width="22" height="22" strokeWidth="1.8" />
      </span>
      <img
        src={img}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </span>
  );
}

export default function MobileHome() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [tabs, setTabs] = useState([]);
  const [tabsLoading, setTabsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('spotlight');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const [marketplaceFilters, setMarketplaceFilters] = useState(EMPTY_MARKETPLACE_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const searchInputRef = useRef(null);
  const productGridRef = useRef(null);

  // Tab row is core navigation chrome, not optional decoration — always falls back to the local
  // static list rather than silently disappearing if the backend is unseeded or unreachable.
  useEffect(() => {
    let cancelled = false;
    setTabsLoading(true);
    catalog
      .mobileTabs()
      .then(({ tabs: fetched }) => {
        if (cancelled) return;
        setTabs(fetched && fetched.length > 0 ? fetched : fallbackTabs);
      })
      .catch(() => {
        if (!cancelled) setTabs(fallbackTabs);
      })
      .finally(() => {
        if (!cancelled) setTabsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce the search box so we're not firing a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(normalizeQuery(searchQuery)), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch the product grid from the server whenever the tab, its filters, or the (debounced)
  // search changes. Pulled out to a stable callback (rather than inline in the effect) so
  // pull-to-refresh can re-trigger the same fetch on demand; a request-id ref discards stale
  // responses the same way an effect-local `cancelled` flag would.
  const fetchIdRef = useRef(0);
  const fetchProducts = useCallback(() => {
    const requestId = ++fetchIdRef.current;
    setProductsLoading(true);
    setProductsError(null);

    const fetcher = MARKETPLACE_FETCHERS[activeTab] || catalog.products;
    return fetcher({
      category: marketplaceFilters.category,
      q: debouncedQuery,
      buyerCountry: getBuyerCountry(user),
      country: marketplaceFilters.country,
      verified: marketplaceFilters.verified,
      officialStore: marketplaceFilters.officialStore,
      freeShipping: marketplaceFilters.freeShipping,
      discountOnly: marketplaceFilters.discountOnly,
      priceMin: marketplaceFilters.priceMin,
      priceMax: marketplaceFilters.priceMax,
      moqMax: marketplaceFilters.moqMax,
      ratingMin: marketplaceFilters.ratingMin,
      sortBy: marketplaceFilters.sortBy,
    })
      .then(({ products: fetched }) => {
        if (fetchIdRef.current === requestId) setProducts(fetched);
      })
      .catch((err) => {
        if (fetchIdRef.current === requestId) setProductsError(err.message || 'Could not load products right now.');
      })
      .finally(() => {
        if (fetchIdRef.current === requestId) setProductsLoading(false);
      });
  }, [activeTab, debouncedQuery, marketplaceFilters, user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const { pullDistance, refreshing, threshold } = usePullToRefresh(fetchProducts);

  const label = debouncedQuery ? `Results for "${debouncedQuery}"` : t('home.allCategories');

  // The mock catalog is small and finite — this loops it endlessly (reshuffled each lap) so the
  // feed behaves like an infinite/YouTube-style feed instead of stopping after ~9 products.
  const { items: feedProducts, loadingMore, sentinelRef } = useInfiniteFeed(products, { batchSize: 6 });

  // Paused the moment the user focuses the search field or has typed anything, and only
  // resumes — with a fresh full dwell time — once it's empty and unfocused again.
  const hintsPaused = searchFocused || searchQuery.trim().length > 0;
  const currentHint = useRotatingHints(searchHints, 4000, hintsPaused);

  const runSearch = () => searchInputRef.current?.blur();

  const scrollToGrid = () => productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const activeTabDef = tabs.find((tab) => tab.key === activeTab);

  return (
    <div className="min-h-screen bg-surface font-sans">
      {/* Pull-to-refresh indicator — height tracks the live pull distance, spins while refreshing */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
          style={{ height: refreshing ? 44 : Math.min(pullDistance, 44) }}
        >
          <span
            className="w-5 h-5 rounded-full border-2 border-border-strong border-t-green"
            style={{
              animation: refreshing ? 'spin 0.7s linear infinite' : 'none',
              transform: refreshing ? undefined : `rotate(${(pullDistance / threshold) * 360}deg)`,
              opacity: refreshing ? 1 : Math.min(pullDistance / threshold, 1),
            }}
          />
        </div>
      )}

      <MobileTopBar />

      {/* Search bar — a single plain pill. Placeholder stays the real, rotating search-hint
          system (shows actual catalog queries like "cotton twill fabric") rather than the
          reference's fashion-specific copy, since this catalog isn't apparel-only. */}
      <div className="px-[18px] pt-1 pb-3">
        <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface-muted/60 px-4 py-2.5 transition-all duration-150 focus-within:border-border-strong focus-within:bg-surface">
          <IconSearch width="17" height="17" className="text-text-muted shrink-0" strokeWidth="1.8" />
          <span className="flex-1 relative min-w-0">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              className="w-full border-none outline-none bg-transparent text-[13.5px] text-ink font-sans relative z-10 py-0.5"
            />
            <SearchHintOverlay hint={currentHint} visible={!searchFocused && !searchQuery} />
          </span>
        </div>
      </div>

      {/* Hero banner — soft gradient promo card, matching the reference design's "New Season /
          Fresh Looks For You" hero: two-tone headline, script flourish, peach CTA, photo. */}
      <div
        className="mx-[18px] mb-3 rounded-[22px] overflow-hidden relative grid grid-cols-[1.3fr_1fr] min-h-[190px]"
        style={{ background: 'linear-gradient(135deg, #F5ECF8 0%, #FBEDE9 100%)' }}
      >
        <div className="p-4 flex flex-col justify-center relative">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase mb-2" style={{ color: ACCENT }}>
            {t('home.heroEyebrow')}
          </span>
          <h1 className="font-display text-[21px] leading-[1.15] font-bold mb-1.5 tracking-tight text-balance">
            <span className="text-ink block">{t('home.heroTitleLine1')}</span>
            <span className="block" style={{ color: ACCENT }}>{t('home.heroTitleLine2')}</span>
          </h1>
          <p className="text-[11px] text-text leading-snug mb-3 text-balance">{t('home.heroSubtitle')}</p>
          <button
            type="button"
            onClick={scrollToGrid}
            className="self-start flex items-center gap-1.5 rounded-full text-ink font-semibold text-[12px] pl-3.5 pr-3 py-2 cursor-pointer transition-transform active:scale-95"
            style={{ background: 'var(--color-gold)' }}
          >
            {t('home.heroCta')}
            <IconArrowRight width="13" height="13" strokeWidth="2.4" />
          </button>
        </div>
        <div className="relative min-h-[190px]">
          <img
            src={unsplash('photo-1483985988355-763728e1935b', 400)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = unsplash('photo-1473188588951-666fce8e7c68', 400);
            }}
          />
          {/* Small handwritten-style flourish, matching the reference design's script accent —
              sits over the photo rather than the cramped text column. */}
          <span
            className="absolute top-2.5 right-2 text-[10.5px] leading-tight text-right drop-shadow-sm"
            style={{ fontFamily: 'cursive', color: '#fff', opacity: 0.95, transform: 'rotate(-4deg)' }}
          >
            {t('home.heroFlourish')} <span aria-hidden>♥</span>
          </span>
        </div>
      </div>

      {/* "Safah Mart" promo banner — mirrors the reference design's second banner: light-blue
          card, pin + brand wordmark, a two-line "Fast delivery / 40 min" ribbon badge, a
          skyline silhouette, a row of shopping categories, and a CTA. Purely decorative/
          navigational (links into the real Categories page) — not a live backend feature —
          since it's a marketing block, not a functional filter. */}
      <Link
        to="/categories"
        className="block mx-[18px] mb-3 rounded-[22px] overflow-hidden relative px-4 pt-4 pb-3.5 no-underline text-inherit"
        style={{ background: 'linear-gradient(135deg, #EAF2FF 0%, #D9E9FB 100%)' }}
      >
        {/* Decorative city-skyline silhouette, bottom-right — plain SVG rects, no image asset. */}
        <svg
          className="absolute bottom-0 right-0 pointer-events-none"
          width="150"
          height="60"
          viewBox="0 0 150 60"
          fill="#2D6FC9"
          opacity="0.1"
          aria-hidden="true"
        >
          <rect x="0" y="26" width="18" height="34" />
          <rect x="22" y="14" width="16" height="46" />
          <rect x="42" y="30" width="14" height="30" />
          <rect x="60" y="6" width="18" height="54" />
          <rect x="82" y="22" width="16" height="38" />
          <rect x="102" y="34" width="14" height="26" />
          <rect x="120" y="16" width="16" height="44" />
          <rect x="138" y="28" width="12" height="32" />
        </svg>

        <div className="relative flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <IconPin width="13" height="13" style={{ color: '#2D6FC9' }} strokeWidth="2.4" />
              </span>
              <span className="font-display text-[17px] font-extrabold tracking-tight truncate">
                <span className="text-orange">{t('home.bannerBrand1')}</span> <span className="text-ink">{t('home.bannerBrand2')}</span>
              </span>
            </div>
            <p className="text-[11px] text-ink-soft mt-1 ml-[34px]">{t('home.bannerTagline')}</p>
          </div>
          <div className="shrink-0 rounded-xl px-2.5 py-1.5 text-center text-white shadow-sm" style={{ background: '#2D6FC9' }}>
            <div className="flex items-center gap-1 justify-center text-[8.5px] font-bold uppercase tracking-wide">
              <IconTruck width="10" height="10" strokeWidth="2.6" />
              {t('home.bannerBadge')}
            </div>
            <div className="flex items-center gap-1 justify-center text-[12.5px] font-extrabold mt-0.5 leading-none">
              <IconClock width="12" height="12" strokeWidth="2.6" />
              {t('home.bannerEta')}
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-2 mt-3">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar min-w-0">
            {[
              { Icon: IconGift, label: t('home.bannerFreshFood') },
              { Icon: IconStore, label: t('home.bannerRestaurants') },
              { Icon: IconBox, label: t('home.bannerMalls') },
              { Icon: IconSparkle, label: t('home.bannerBakeries') },
              { Icon: IconGrid, label: t('home.bannerMore') },
            ].map(({ Icon, label: itemLabel }) => (
              <span key={itemLabel} className="flex items-center gap-1 shrink-0 text-[10.5px] font-medium text-ink-soft">
                <Icon width="13" height="13" strokeWidth="2" style={{ color: '#2D6FC9' }} />
                {itemLabel}
              </span>
            ))}
          </div>
          <span
            className="shrink-0 inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-white font-semibold text-[11.5px]"
            style={{ background: '#2D6FC9' }}
          >
            {t('home.bannerCta')}
            <IconArrowRight width="12" height="12" strokeWidth="2.4" />
          </span>
        </div>
      </Link>

      {/* Category row — the reference design's fixed Women/Men/Kids/Beauty/Home/Accessories/
          Market set, as static shortcuts into the Categories page (see DISPLAY_CATEGORIES). */}
      <div className="flex gap-x-4 overflow-x-auto no-scrollbar px-[18px] pt-1 pb-2">
        {DISPLAY_CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            to="/categories"
            className="shrink-0 w-[70px] flex flex-col items-center gap-2 no-underline text-inherit"
          >
            <span
              className="w-[64px] h-[64px] rounded-full overflow-hidden"
              style={{ border: '2px solid var(--color-border)' }}
            >
              <CategoryCircleImg img={cat.img} alt={cat.name} FallbackIcon={cat.fallback} />
            </span>
            <span className="text-[11.5px] text-center leading-tight font-semibold text-ink-soft">{cat.name}</span>
          </Link>
        ))}
      </div>

      {/* B2B / Spotlight / Worldwide / Free Shipping — same real tabs and data as before, just in
          the segmented-pill look instead of icon chips. */}
      <div className="flex items-center gap-1 mx-[18px] mb-2 rounded-full bg-surface-muted p-1 overflow-x-auto no-scrollbar">
        {tabsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse h-8 w-[80px] shrink-0 rounded-full bg-surface" />
            ))
          : tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    // Each section has its own filter panel (see FilterConfig) — a value picked
                    // under one section (say B2B's Max MOQ) would otherwise silently keep being
                    // sent to the new section's query even though its panel doesn't show that
                    // control anymore.
                    setMarketplaceFilters(EMPTY_MARKETPLACE_FILTERS);
                  }}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-semibold cursor-pointer transition-colors ${
                    isActive ? 'text-white shadow-sm' : 'text-ink-soft hover:text-ink'
                  }`}
                  style={isActive ? { background: ACCENT } : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
      </div>

      {/* Tab context banner */}
      {activeTabDef?.banner && (
        <div className="mx-[18px] mb-2 bg-green-tint rounded-md px-3 py-2 text-[12.5px] text-green font-medium">
          {activeTabDef.banner}
        </div>
      )}

      {/* Active label + filters toggle — merged onto one row so the space between the tab row
          and the grid stays tight. The expanded filters panel still narrows fetchProducts exactly
          as before. */}
      <div ref={productGridRef} className="flex items-center justify-between gap-3 px-[18px] pt-1.5 pb-2.5 scroll-mt-4">
        <span className="text-[12.5px] text-text min-w-0 truncate">
          {t('home.showing')} <strong className="text-ink">{label}</strong>
        </span>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-1 shrink-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-ink-soft cursor-pointer transition-colors hover:border-border-strong hover:text-ink"
        >
          <IconSliders width="13" height="13" />
          {t('common.filters')}
        </button>
      </div>
      {filtersOpen && (
        <div className="px-[18px] pb-3">
          <MarketplaceFilters section={activeTab} value={marketplaceFilters} onChange={setMarketplaceFilters} />
        </div>
      )}

      {/* Product grid */}
      {productsLoading && (
        <div className="grid grid-cols-2 gap-2.5 px-[18px] pb-[110px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-surface border border-border rounded-[14px] overflow-hidden">
              <div className="aspect-square bg-surface-muted" />
              <div className="px-2.5 pt-2.5 pb-3 flex flex-col gap-1.5">
                <div className="h-3 bg-surface-muted rounded w-full" />
                <div className="h-3 bg-surface-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!productsLoading && productsError && (
        <div className="mx-[18px] mb-[110px] text-center py-8 px-5 bg-cream rounded-[14px] border border-dashed border-border-strong">
          <div className="text-[13.5px] text-orange-text">{productsError}</div>
        </div>
      )}

      {!productsLoading && !productsError && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2.5 px-[18px] pb-2">
            {feedProducts.map((p) => (
              <MobileProductCard key={p.feedKey} product={p} />
            ))}
          </div>

          {/* Infinite-scroll sentinel — the feed loops the catalog endlessly rather than ever
              showing an "end", so there's a loading spinner here but no end-of-feed message. Bottom
              padding clears the fixed BottomNavBar (72px + safe-area-inset, up to ~106px on
              notched devices) so the last row/spinner never sits under it. */}
          <div ref={sentinelRef} className="flex items-center justify-center pt-4 pb-[110px]">
            {loadingMore && (
              <span className="w-6 h-6 rounded-full border-2 border-border-strong border-t-green animate-[spin_0.7s_linear_infinite]" />
            )}
          </div>
        </>
      )}

      {!productsLoading && !productsError && products.length === 0 && (
        <div className="mx-[18px] mb-[110px] text-center py-8 px-5 bg-cream rounded-[14px] border border-dashed border-border-strong">
          <div className="text-[13.5px] font-semibold text-ink mb-1">No results found</div>
          <div className="text-[13.5px] text-text mb-2.5">Nothing matched "{debouncedQuery}". Try a different keyword or category.</div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="cursor-pointer inline-block bg-green text-white text-[12.5px] font-semibold px-[18px] py-2 rounded-full"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
