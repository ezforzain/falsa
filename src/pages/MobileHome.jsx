import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { IconSearch, IconBox, IconSparkle, IconGlobe, IconTruck, IconSliders } from '../components/icons';

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
  const [activeFilter, setActiveFilter] = useState('all');
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

  // Fetch the tabs + curated category circles once on mount. The B2B/Spotlight/Worldwide/Free
  // Shipping row is core navigation chrome, not optional decoration — so unlike the category
  // circles (which just stay empty on failure), it always falls back to the local static list
  // rather than silently disappearing if the backend is unseeded or unreachable.
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([catalog.mobileCategories(), catalog.mobileTabs()]).then(([catRes, tabRes]) => {
      if (cancelled) return;
      setCategories(catRes.status === 'fulfilled' ? catRes.value.categories : []);
      const fetchedTabs = tabRes.status === 'fulfilled' ? tabRes.value.tabs : [];
      setTabs(fetchedTabs && fetchedTabs.length > 0 ? fetchedTabs : fallbackTabs);
      setMetaLoading(false);
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
      category: activeCatDef?.fullName,
      q: debouncedQuery,
      buyerCountry: getBuyerCountry(user),
      country: marketplaceFilters.country || undefined,
      verified: marketplaceFilters.verified,
      officialStore: marketplaceFilters.officialStore,
      freeShipping: marketplaceFilters.freeShipping,
      priceMin: marketplaceFilters.priceMin,
      priceMax: marketplaceFilters.priceMax,
      moqMax: marketplaceFilters.moqMax,
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
  }, [activeTab, activeCatDef?.fullName, debouncedQuery, marketplaceFilters, user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const { pullDistance, refreshing, threshold } = usePullToRefresh(fetchProducts);

  let label = activeCatDef ? activeCatDef.name : t('home.allCategories');
  if (debouncedQuery) label = `Results for "${debouncedQuery}"`;

  // "Low MOQ" reads the leading number off the moq string (e.g. "150pc" -> 150) regardless of unit,
  // since MOQ units aren't comparable across product types — only the seller's own threshold is.
  const LOW_MOQ_THRESHOLD = 200;
  const filteredProducts = useMemo(() => {
    if (activeFilter === 'verified') return products.filter((p) => p.verified);
    if (activeFilter === 'lowMoq') {
      return products.filter((p) => {
        const n = parseInt(p.moq, 10);
        return !isNaN(n) && n <= LOW_MOQ_THRESHOLD;
      });
    }
    return products;
  }, [products, activeFilter]);

  // The mock catalog is small and finite — this loops it endlessly (reshuffled each lap) so the
  // feed behaves like an infinite/YouTube-style feed instead of stopping after ~9 products.
  const { items: feedProducts, loadingMore, sentinelRef } = useInfiniteFeed(filteredProducts, { batchSize: 6 });

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

      {/* Top tabs — pill chips (own icon + label per option) rather than an underlined text row,
          so B2B/Spotlight/Worldwide/Free Shipping read as distinct, tappable entry points. */}
      <div className="flex items-center gap-2 px-[18px] pt-3.5 pb-2.5 overflow-x-auto no-scrollbar">
        {metaLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse h-9 w-[104px] shrink-0 rounded-full bg-surface-muted" />
            ))
          : tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              const Icon = TAB_ICONS[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-full pl-2.5 pr-3.5 py-2 text-[13px] font-semibold cursor-pointer transition-colors border ${
                    isActive
                      ? 'bg-green text-white border-green shadow-[0_4px_12px_rgba(14,90,70,0.25)]'
                      : 'bg-surface text-ink-soft border-border hover:border-green/40 hover:text-ink'
                  }`}
                >
                  {Icon && (
                    <Icon
                      width="15"
                      height="15"
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
        <div className="mx-[18px] mb-2 bg-green-tint rounded-[10px] px-3.5 py-2.5 text-[12.5px] text-green font-medium">
          {activeTabDef.banner}
        </div>
      )}

      {/* Marketplace filters — collapsed by default so the compact mobile header doesn't get
          crowded; every field here actually narrows the fetch above (see fetchProducts). */}
      <div className="px-[18px] pb-1">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft cursor-pointer py-1"
        >
          <IconSliders width="14" height="14" />
          Filters
        </button>
      </div>
      {filtersOpen && (
        <div className="px-[18px] pb-3">
          <MarketplaceFilters categories={categories} value={marketplaceFilters} onChange={setMarketplaceFilters} />
        </div>
      )}

      {/* Search bar */}
      <div className="px-[18px] pt-2 pb-4">
        <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-white pl-4 pr-2 py-2 shadow-[0_1px_3px_rgba(27,31,29,0.05)] transition-all duration-150 focus-within:border-orange/40 focus-within:shadow-[0_0_0_3px_rgba(201,123,45,0.12)]">
          <IconSearch width="18" height="18" className="text-text-muted shrink-0" strokeWidth="1.8" />
          <span className="flex-1 relative min-w-0">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              className="w-full border-none outline-none bg-transparent text-[14.5px] text-ink font-sans relative z-10 py-1.5"
            />
            <SearchHintOverlay hint={currentHint} visible={!searchFocused && !searchQuery} />
          </span>
          <button
            type="button"
            onClick={runSearch}
            aria-label="Search"
            className="w-10 h-10 rounded-xl bg-orange hover:bg-orange-hover active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-[0_2px_8px_rgba(201,123,45,0.35)]"
          >
            <IconSearch width="16" height="16" className="text-white" strokeWidth="2.4" />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 px-[18px] pb-4">
        {[
          { label: 'Start exploring', bg: 'bg-green-tint', icon: <IconGrid />, onClick: () => navigate('/categories') },
          { label: 'Request for Quotation', bg: 'bg-orange-tint', icon: <IconTarget />, onClick: () => navigate('/messenger') },
          {
            label: 'Top Sellers',
            bg: 'bg-green-tint',
            icon: <IconTrophy />,
            onClick: () => {
              setActiveFilter('verified');
              productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            },
          },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="group flex-1 bg-white border border-border rounded-2xl px-3 py-3.5 flex flex-col items-start gap-2.5 text-left cursor-pointer transition-all duration-150 hover:border-green/20 hover:shadow-[0_10px_24px_rgba(27,31,29,0.08)] hover:-translate-y-0.5 active:scale-[0.97] active:shadow-none"
          >
            <span className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center transition-transform duration-150 group-hover:scale-105`}>
              {a.icon}
            </span>
            <span className="font-display text-[12.5px] font-semibold text-ink leading-snug tracking-[-0.01em]">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Trust banner — labels wrap onto a second line instead of forcing single-line width, so
          a long line like "Money-back protection" never overflows past the card. */}
      <div className="mx-[18px] mb-1.5 rounded-2xl border border-orange/15 bg-gradient-to-br from-orange-tint to-[#FBF2E4] px-4 py-3.5 flex items-center shadow-[0_1px_3px_rgba(27,31,29,0.03)]">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-[0_1px_4px_rgba(122,74,20,0.16)]">
            <IconShipFast />
          </span>
          <span className="min-w-0">
            <span className="font-display block text-[12.5px] font-bold text-ink leading-snug tracking-[-0.01em]">FREE shipping</span>
            <span className="block text-[11px] text-orange-text-dark/80 leading-snug">on your first order</span>
          </span>
        </div>
        <span className="w-px self-stretch bg-orange/20 mx-3.5 shrink-0" />
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-[0_1px_4px_rgba(122,74,20,0.16)]">
            <IconMoneyBack />
          </span>
          <span className="min-w-0">
            <span className="font-display block text-[12.5px] font-bold text-ink leading-snug tracking-[-0.01em]">Money-back protection</span>
            <span className="block text-[11px] text-orange-text-dark/80 leading-snug">for up to 60 days</span>
          </span>
        </div>
      </div>

      {/* Category circles */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-[18px] pt-4 pb-1.5">
        {metaLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="animate-pulse w-[62px] h-[62px] rounded-full bg-surface-muted" />
              </div>
            ))
          : categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <div
                  key={cat.key}
                  onClick={() => setActiveCategory((c) => (c === cat.key ? 'all' : cat.key))}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <span
                    className="w-[62px] h-[62px] rounded-full overflow-hidden transition-colors"
                    style={{
                      border: isActive ? '2.5px solid #0E5A46' : '2px solid #EFEBE2',
                      boxShadow: isActive ? '0 4px 10px rgba(14,90,70,0.25)' : 'none',
                    }}
                  >
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                  </span>
                  <span
                    className="text-[11.5px] text-center leading-tight"
                    style={{ fontWeight: isActive ? 700 : 600, color: isActive ? '#0E5A46' : '#3A362D' }}
                  >
                    {cat.name}
                  </span>
                </div>
              );
            })}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-[18px] pt-2.5 pb-3.5">
        {[
          { key: 'all', label: 'All' },
          { key: 'verified', label: 'Verified' },
          { key: 'lowMoq', label: 'Low MOQ' },
        ].map((f) => (
          <span
            key={f.key}
            data-testid={`filter-pill-${f.key}`}
            onClick={() => setActiveFilter(f.key)}
            className={`text-[12.5px] font-bold px-4 py-1.5 rounded-full cursor-pointer transition-colors ${
              activeFilter === f.key ? 'bg-ink text-white' : 'bg-surface-muted text-text font-semibold hover:bg-[#EFEBE2]'
            }`}
          >
            {f.label}
          </span>
        ))}
      </div>

      {/* Active label */}
      <div ref={productGridRef} className="px-[18px] pb-2.5 text-[13px] text-text scroll-mt-4">
        Showing <strong className="text-ink">{label}</strong>
        {activeFilter !== 'all' && (
          <>
            {' '}· <strong className="text-ink">{activeFilter === 'verified' ? 'Verified sellers' : 'Low MOQ'}</strong>
          </>
        )}
      </div>

      {/* Product grid */}
      {productsLoading && (
        <div className="grid grid-cols-2 gap-2.5 px-[18px] pb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-[#EFEBE2] rounded-[14px] overflow-hidden">
              <div className="h-[130px] bg-surface-muted" />
              <div className="px-2.5 pt-2.5 pb-3 flex flex-col gap-1.5">
                <div className="h-3 bg-surface-muted rounded w-full" />
                <div className="h-3 bg-surface-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!productsLoading && productsError && (
        <div className="mx-[18px] mb-8 text-center py-8 px-5 bg-cream rounded-[14px] border border-dashed border-border-strong">
          <div className="text-[13.5px] text-orange-text">{productsError}</div>
        </div>
      )}

      {!productsLoading && !productsError && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2.5 px-[18px] pb-3">
            {feedProducts.map((p) => (
              <MobileProductCard key={p.feedKey} product={p} />
            ))}
          </div>

          {/* Infinite-scroll sentinel — the feed loops the catalog endlessly rather than ever
              showing an "end", so there's a loading spinner here but no end-of-feed message. */}
          <div ref={sentinelRef} className="flex items-center justify-center py-6">
            {loadingMore && (
              <span className="w-6 h-6 rounded-full border-2 border-border-strong border-t-green animate-[spin_0.7s_linear_infinite]" />
            )}
          </div>
        </>
      )}

      {!productsLoading && !productsError && products.length === 0 && (
        <div className="mx-[18px] mb-8 text-center py-8 px-5 bg-cream rounded-[14px] border border-dashed border-border-strong">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E5A46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A05E17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="#A05E17" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E5A46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 6h2a2 2 0 0 1 0 4h-1M7 6H5a2 2 0 0 0 0 4h1" />
    </svg>
  );
}
function IconShipFast() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C97B2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M14 9h4l3 3v5h-3" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  );
}
function IconMoneyBack() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2D6FC9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
