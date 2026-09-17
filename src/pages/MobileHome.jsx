import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeQuery, searchHints, mobileTabs as fallbackTabs } from '../data/mockData';
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
import { IconSearch, IconBox, IconSparkle, IconGlobe, IconTruck, IconSliders, IconArrowRight, IconCamera } from '../components/icons';

// Icon per tab key — the backend only knows key/label/banner, so the visual mark lives here,
// keyed the same way as the seeded tabs (see server/src/seed/data.js).
const TAB_ICONS = {
  aimode: IconBox,
  spotlight: IconSparkle,
  worldwide: IconGlobe,
  freeshipping: IconTruck,
};

// Each tab now drives a real, distinct query instead of just swapping a banner string — same
// keys as TAB_ICONS/the seeded MobileTab list.
const MARKETPLACE_FETCHERS = {
  aimode: marketplace.b2b,
  spotlight: marketplace.spotlight,
  worldwide: marketplace.worldwide,
  freeshipping: marketplace.freeShipping,
};

export default function MobileHome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState('all');
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
  const navigate = useNavigate();

  // Fetch the tabs + category circles once on mount, and again whenever the active marketplace
  // tab changes. Categories now come from the same admin-managed taxonomy Desktop uses (rather
  // than the old static, non-admin-editable `kind: 'mobile'` list) so a category created in the
  // Admin Panel shows up here too, filtered by placement just like Desktop's chip row. The
  // B2B/Spotlight/Worldwide/Free Shipping row is core navigation chrome, not optional decoration
  // — so unlike the category circles (which just stay empty on failure), it always falls back to
  // the local static list rather than silently disappearing if the backend is unseeded or
  // unreachable.
  const categoryPlacement = activeTab === 'aimode' ? 'b2b' : activeTab === 'spotlight' ? 'spotlight' : undefined;

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);
    Promise.allSettled([catalog.categories({ placement: categoryPlacement }), catalog.mobileTabs()]).then(([catRes, tabRes]) => {
      if (cancelled) return;
      setCategories(catRes.status === 'fulfilled' ? catRes.value.categories : []);
      const fetchedTabs = tabRes.status === 'fulfilled' ? tabRes.value.tabs : [];
      setTabs(fetchedTabs && fetchedTabs.length > 0 ? fetchedTabs : fallbackTabs);
      setMetaLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [categoryPlacement]);

  // Debounce the search box so we're not firing a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(normalizeQuery(searchQuery)), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const activeCatDef = categories.find((c) => c.key === activeCategory);

  // Fetch the product grid from the server whenever the tab, its filters, the category, or the
  // (debounced) search changes. Each tab now hits its own real marketplace endpoint (B2B,
  // country-aware Spotlight/Worldwide, or Free Shipping eligibility) instead of the tabs only
  // ever swapping a banner string over the same generic catalog query. Pulled out to a stable
  // callback (rather than inline in the effect) so pull-to-refresh can re-trigger the same fetch
  // on demand; a request-id ref discards stale responses the same way the old effect-local
  // `cancelled` flag did.
  const fetchIdRef = useRef(0);
  const fetchProducts = useCallback(() => {
    const requestId = ++fetchIdRef.current;
    setProductsLoading(true);
    setProductsError(null);

    const fetcher = MARKETPLACE_FETCHERS[activeTab] || catalog.products;
    return fetcher({
      // The category quick-circles (activeCatDef) and the filter panel's own Category multiselect
      // both narrow by category — a circle tap wins when set, since it's the more deliberate,
      // single-purpose action; the panel's category filter only applies once no circle is active.
      category: activeCatDef?.name || marketplaceFilters.category,
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
  }, [activeTab, activeCatDef?.name, debouncedQuery, marketplaceFilters, user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const { pullDistance, refreshing, threshold } = usePullToRefresh(fetchProducts);

  let label = activeCatDef ? activeCatDef.name : t('home.allCategories');
  if (debouncedQuery) label = `Results for "${debouncedQuery}"`;

  // The mock catalog is small and finite — this loops it endlessly (reshuffled each lap) so the
  // feed behaves like an infinite/YouTube-style feed instead of stopping after ~9 products.
  // Filtering itself now happens server-side (the section's own marketplace endpoint, driven by
  // the filter panel below) rather than client-side over whatever already loaded.
  const { items: feedProducts, loadingMore, sentinelRef } = useInfiniteFeed(products, { batchSize: 6 });

  // Paused the moment the user focuses the search field or has typed anything, and only
  // resumes — with a fresh full dwell time — once it's empty and unfocused again.
  const hintsPaused = searchFocused || searchQuery.trim().length > 0;
  const currentHint = useRotatingHints(searchHints, 4000, hintsPaused);

  const runSearch = () => searchInputRef.current?.blur();

  const activeTabDef = tabs.find((t) => t.key === activeTab);

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

      {/* Standalone search bar — pulled out of the hero card so it reads as its own entry point
          at the very top of the page, matching the new reference layout, instead of being nested
          inside the dark hero card alongside the quick-action tiles. */}
      <div className="px-[18px] pt-1 pb-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface pl-4 pr-1.5 py-1.5 shadow-[0_1px_3px_rgba(27,31,29,0.05)] transition-all duration-150 focus-within:border-green/40">
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
              className="w-full border-none outline-none bg-transparent text-[13.5px] text-ink font-sans relative z-10 py-1"
            />
            <SearchHintOverlay hint={currentHint} visible={!searchFocused && !searchQuery} />
          </span>
          <IconCamera width="16" height="16" className="text-text-muted shrink-0" strokeWidth="1.8" />
          <button
            type="button"
            onClick={runSearch}
            aria-label="Search"
            className="w-9 h-9 rounded-lg bg-ink hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          >
            <IconSearch width="15" height="15" className="text-white" strokeWidth="2.4" />
          </button>
        </div>
      </div>

      {/* Top tabs — pill chips (own icon + label per option) rather than an underlined text row,
          so B2B/Spotlight/Worldwide/Free Shipping read as distinct, tappable entry points. Kept
          low-profile/flat (rounded-md, no glow) rather than full rounded pills so the row reads
          as a slim marketplace tab bar instead of a chunky floating-button row. */}
      <div className="flex items-center gap-2 px-[18px] pt-2.5 pb-2 overflow-x-auto no-scrollbar">
        {metaLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse h-7 w-[84px] shrink-0 rounded-md bg-surface-muted" />
            ))
          : tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              const Icon = TAB_ICONS[tab.key];
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
                  className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded-md pl-2 pr-2.5 py-1.5 text-[12px] font-semibold cursor-pointer transition-colors border ${
                    isActive
                      ? 'bg-green text-white border-green'
                      : 'bg-surface text-ink-soft border-border hover:border-green/40 hover:text-ink'
                  }`}
                >
                  {Icon && (
                    <Icon
                      width="13"
                      height="13"
                      className={isActive ? 'text-white' : 'text-green'}
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                  )}
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

      {/* Hero card — dark navy "sourcing" card matching the new home design: overline + headline,
          a full-width "Start exploring" row, a 2-up quotation/top-sellers grid, and the
          shipping/money-back trust banner, all boxed together. Search now lives in its own
          standalone bar above (see top of this component) rather than nested in here. */}
      <div className="mx-[18px] mb-3 rounded-[22px] bg-green-deep px-4 pt-4 pb-4">
        <div className="inline-flex items-center gap-2 font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-gold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block shrink-0" />
          {t('home.verifiedSuppliers')}
        </div>
        <h1 className="font-display text-[22px] leading-[1.2] font-bold text-white mb-4 tracking-tight text-balance">
          {t('home.sourcingToday')}
        </h1>

        <button
          type="button"
          onClick={() => navigate('/categories')}
          className="group w-full flex items-center gap-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-3.5 py-3 mb-3 text-left cursor-pointer transition-colors"
        >
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange to-[#E0973F] flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105">
            <IconGrid />
          </span>
          <span className="flex-1 min-w-0">
            <span className="font-display block text-[14px] font-semibold text-white leading-snug tracking-[-0.01em]">{t('home.startExploring')}</span>
            <span className="block text-[11.5px] text-teal-mist leading-snug">{t('home.startExploringSub')}</span>
          </span>
          <IconArrowRight width="16" height="16" className="text-white/50 shrink-0" strokeWidth="2.2" />
        </button>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => navigate('/messenger')}
            className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-3 py-3 text-left cursor-pointer transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange to-[#E0973F] flex items-center justify-center shrink-0">
              <IconTarget />
            </span>
            <span className="font-display text-[12.5px] font-semibold text-white leading-snug tracking-[-0.01em]">{t('home.requestQuotation')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMarketplaceFilters((f) => ({ ...f, verified: true }));
              setFiltersOpen(true);
              productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-3 py-3 text-left cursor-pointer transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-orange flex items-center justify-center shrink-0">
              <IconTrophy />
            </span>
            <span className="font-display text-[12.5px] font-semibold text-white leading-snug tracking-[-0.01em]">{t('home.topSellers')}</span>
          </button>
        </div>

        <div className="rounded-2xl bg-white/[0.06] border border-white/10 px-3.5 py-3 flex items-center">
          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-orange to-[#E0973F] flex items-center justify-center shrink-0">
              <IconShipFast />
            </span>
            <span className="min-w-0">
              <span className="font-display block text-[12px] font-bold text-white leading-snug tracking-[-0.01em]">{t('home.freeShipping')}</span>
              <span className="block text-[10.5px] text-teal-mist leading-snug">{t('home.freeShippingSub')}</span>
            </span>
          </div>
          <span className="w-px self-stretch bg-white/10 mx-3 shrink-0" />
          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-orange flex items-center justify-center shrink-0">
              <IconMoneyBack />
            </span>
            <span className="min-w-0">
              <span className="font-display block text-[12px] font-bold text-white leading-snug tracking-[-0.01em]">{t('home.moneyBack')}</span>
              <span className="block text-[10.5px] text-teal-mist leading-snug">{t('home.moneyBackSub')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Category row — WhatsApp Status-style horizontal scroll: a single row the user swipes
          through (3–4 circles visible at a time) instead of wrapping into a multi-row grid. */}
      <div className="flex gap-x-4 overflow-x-auto no-scrollbar px-[18px] pt-3 pb-1.5">
        {metaLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[70px] flex flex-col items-center gap-2">
                <div className="animate-pulse w-[62px] h-[62px] rounded-full bg-surface-muted" />
              </div>
            ))
          : categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <div
                  key={cat.key}
                  onClick={() => setActiveCategory((c) => (c === cat.key ? 'all' : cat.key))}
                  className="shrink-0 w-[70px] flex flex-col items-center gap-2 cursor-pointer"
                >
                  <span
                    className="w-[62px] h-[62px] rounded-full overflow-hidden transition-colors"
                    style={{
                      border: isActive ? '2.5px solid var(--color-green)' : '2px solid var(--color-border)',
                      boxShadow: isActive ? '0 4px 10px rgba(14,90,70,0.25)' : 'none',
                    }}
                  >
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                  </span>
                  <span
                    className="text-[11.5px] text-center leading-tight line-clamp-2"
                    style={{ fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--color-green)' : 'var(--color-ink-soft)' }}
                  >
                    {cat.name}
                  </span>
                </div>
              );
            })}
      </div>

      {/* Active label + filters toggle — merged onto one row (instead of two separate stacked
          blocks) so the space between the category row and the grid stays tight. The expanded
          filters panel still narrows fetchProducts exactly as before. */}
      <div ref={productGridRef} className="flex items-center justify-between gap-3 px-[18px] pt-2.5 pb-2.5 scroll-mt-4">
        <span className="text-[12.5px] text-text min-w-0 truncate">
          {t('home.showing')} <strong className="text-ink">{label}</strong>
        </span>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-1 shrink-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-ink-soft cursor-pointer transition-colors hover:border-green/40 hover:text-ink"
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

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
// These four sit on colored gradient badges (quick actions + trust banner, see above) rather
// than flat tint chips, so they're plain white strokes now instead of each hardcoding its own
// muted brand color.
function IconTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="#fff" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 6h2a2 2 0 0 1 0 4h-1M7 6H5a2 2 0 0 0 0 4h1" />
    </svg>
  );
}
function IconShipFast() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M14 9h4l3 3v5h-3" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  );
}
function IconMoneyBack() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
