import { useCallback, useEffect, useRef, useState } from 'react';
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
import { IconSearch, IconSliders, IconArrowRight, IconTruck, IconShield } from '../components/icons';

// Accent used only for this new home look (hero CTA + active tab pill) — deliberately a
// different shade from the admin panel's #7C3AED so the two never read as the same theme.
const ACCENT = '#6C63FF';

// Each tab drives a real, distinct marketplace query — same keys as the seeded MobileTab list
// (server/src/seed/data.js), just rendered as a segmented pill row instead of icon chips now.
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

  // Fetch the tabs + category circles once on mount, and again whenever the active marketplace
  // tab changes. Categories come from the same admin-managed taxonomy Desktop uses, filtered by
  // placement just like Desktop's chip row. The tab row is core navigation chrome, not optional
  // decoration — so unlike the category circles (which just stay empty on failure), it always
  // falls back to the local static list rather than silently disappearing if the backend is
  // unseeded or unreachable.
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
  // (debounced) search changes. Each tab hits its own real marketplace endpoint (B2B,
  // country-aware Spotlight/Worldwide, or Free Shipping eligibility). Pulled out to a stable
  // callback (rather than inline in the effect) so pull-to-refresh can re-trigger the same fetch
  // on demand; a request-id ref discards stale responses the same way an effect-local `cancelled`
  // flag would.
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
  // Filtering itself happens server-side (the section's own marketplace endpoint, driven by the
  // filter panel below) rather than client-side over whatever already loaded.
  const { items: feedProducts, loadingMore, sentinelRef } = useInfiniteFeed(products, { batchSize: 6 });

  // Paused the moment the user focuses the search field or has typed anything, and only
  // resumes — with a fresh full dwell time — once it's empty and unfocused again.
  const hintsPaused = searchFocused || searchQuery.trim().length > 0;
  const currentHint = useRotatingHints(searchHints, 4000, hintsPaused);

  const runSearch = () => searchInputRef.current?.blur();

  const scrollToGrid = () => productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

      {/* Search bar — a single plain pill (icon + input, no camera/inline button) so it reads as
          a light entry point rather than a boxy toolbar. */}
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

      {/* Hero banner — soft gradient promo card replacing the old dark-navy sourcing card, with a
          product photo, an eyebrow label, headline, and a single CTA into the grid below. */}
      <div
        className="mx-[18px] mb-3 rounded-[22px] overflow-hidden relative grid grid-cols-[1.3fr_1fr] min-h-[172px]"
        style={{ background: 'linear-gradient(135deg, #F5ECF8 0%, #FBEDE9 100%)' }}
      >
        <div className="p-4 flex flex-col justify-center">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase mb-2" style={{ color: ACCENT }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ background: ACCENT }} />
            {t('home.heroEyebrow')}
          </span>
          <h1 className="font-display text-[19px] leading-[1.2] font-bold text-ink mb-1.5 tracking-tight text-balance">
            {t('home.heroTitle')}
          </h1>
          <p className="text-[11.5px] text-text leading-snug mb-3 text-balance">{t('home.heroSubtitle')}</p>
          <button
            type="button"
            onClick={scrollToGrid}
            className="self-start flex items-center gap-1.5 rounded-full text-white font-semibold text-[12px] pl-3.5 pr-3 py-2 cursor-pointer transition-transform active:scale-95"
            style={{ background: ACCENT }}
          >
            {t('home.heroCta')}
            <IconArrowRight width="13" height="13" strokeWidth="2.4" />
          </button>
        </div>
        <div className="relative min-h-[172px]">
          <img
            src={unsplash('photo-1473188588951-666fce8e7c68', 400)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Trust strip — two tiles, same real actions the old hero exposed (free-shipping framing
          + a verified-sellers shortcut into the filter panel), just restyled as light cards. */}
      <div className="mx-[18px] mb-3 grid grid-cols-2 gap-2.5">
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-3">
          <span className="w-8 h-8 rounded-full bg-green-tint flex items-center justify-center shrink-0">
            <IconTruck width="16" height="16" className="text-green" strokeWidth="2.2" />
          </span>
          <span className="min-w-0">
            <span className="font-display block text-[12px] font-bold text-ink leading-snug">{t('home.trustFreeShipping')}</span>
            <span className="block text-[10.5px] text-text-muted leading-snug">{t('home.trustFreeShippingSub')}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setMarketplaceFilters((f) => ({ ...f, verified: true }));
            setFiltersOpen(true);
            scrollToGrid();
          }}
          className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-3 text-left cursor-pointer transition-colors hover:border-border-strong"
        >
          <span className="w-8 h-8 rounded-full bg-orange-tint flex items-center justify-center shrink-0">
            <IconShield width="16" height="16" className="text-orange-text" strokeWidth="2.2" />
          </span>
          <span className="min-w-0">
            <span className="font-display block text-[12px] font-bold text-ink leading-snug">{t('home.trustVerified')}</span>
            <span className="block text-[10.5px] text-text-muted leading-snug">{t('home.trustVerifiedSub')}</span>
          </span>
        </button>
      </div>

      {/* Category row — WhatsApp Status-style horizontal scroll: a single row the user swipes
          through (3–4 circles visible at a time) instead of wrapping into a multi-row grid. */}
      <div className="flex gap-x-4 overflow-x-auto no-scrollbar px-[18px] pt-1 pb-2">
        {metaLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[70px] flex flex-col items-center gap-2">
                <div className="animate-pulse w-[64px] h-[64px] rounded-full bg-surface-muted" />
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
                    className="w-[64px] h-[64px] rounded-full overflow-hidden transition-colors"
                    style={{
                      border: isActive ? `2.5px solid ${ACCENT}` : '2px solid var(--color-border)',
                      boxShadow: isActive ? '0 4px 10px rgba(108,99,255,0.25)' : 'none',
                    }}
                  >
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                  </span>
                  <span
                    className="text-[11.5px] text-center leading-tight line-clamp-2"
                    style={{ fontWeight: isActive ? 700 : 600, color: isActive ? ACCENT : 'var(--color-ink-soft)' }}
                  >
                    {cat.name}
                  </span>
                </div>
              );
            })}
      </div>

      {/* Marketplace tabs — segmented pill control (B2B / Spotlight / Worldwide / Free Shipping,
          same real data as before) instead of a row of icon chips. */}
      <div className="flex items-center gap-1 mx-[18px] mb-2 rounded-full bg-surface-muted p-1 overflow-x-auto no-scrollbar">
        {metaLoading
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
      {tabs.find((tab) => tab.key === activeTab)?.banner && (
        <div className="mx-[18px] mb-2 bg-green-tint rounded-md px-3 py-2 text-[12.5px] text-green font-medium">
          {tabs.find((tab) => tab.key === activeTab)?.banner}
        </div>
      )}

      {/* Active label + filters toggle — merged onto one row so the space between the tab row
          and the grid stays tight. The expanded filters panel still narrows fetchProducts
          exactly as before. */}
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
