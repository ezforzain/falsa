import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalog } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { IconArrowRight, IconCheck, IconShield, IconTrendingUp, IconTruck } from '../components/icons';

// Single source of truth for what the "Trending Now" section is showing — replaces two
// separate state variables (an active-category key + an "all products" boolean) that could
// only ever legitimately represent one of exactly these three states anyway.
const TRENDING_VIEW = { type: 'trending' };
const ALL_VIEW = { type: 'all' };
const categoryView = (key) => ({ type: 'category', key });

export default function DesktopHome() {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [view, setView] = useState(TRENDING_VIEW);

  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    catalog
      .categories()
      .then(({ categories: fetched }) => {
        if (!cancelled) setCategories(fetched);
      })
      .catch(() => {
        /* category chips just stay empty on failure — not fatal to the page */
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = view.type === 'category' ? categories.find((cat) => cat.key === view.key) || null : null;
  const sectionTitle = selectedCategory ? selectedCategory.name : view.type === 'all' ? 'All Products' : 'Trending Now';
  const isDefaultView = view.type === 'trending';

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    setProductsError(null);

    // Filter by the category's real display name (what product.category actually stores),
    // not its short `key` — falls back to the raw key only in the split second before the
    // categories list itself has finished loading.
    const fetcher =
      view.type === 'category'
        ? catalog.products({ category: selectedCategory ? selectedCategory.name : view.key })
        : view.type === 'all'
          ? catalog.products({})
          : catalog.trendingProducts();

    fetcher
      .then((data) => {
        if (!cancelled) setDisplayedProducts(data.products);
      })
      .catch((err) => {
        if (!cancelled) setProductsError(err.message || 'Could not load products right now.');
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, selectedCategory]);

  // Selecting the SAME category again clears the filter back to Trending — this is the
  // only place `view` is ever constructed from a click, and it always builds a brand-new
  // object, so React always sees a real state change and this effect always re-runs.
  const toggleCategory = (key) => {
    setView((current) => (current.type === 'category' && current.key === key ? TRENDING_VIEW : categoryView(key)));
  };

  const viewAllProducts = () => setView(ALL_VIEW);
  const resetToTrending = () => setView(TRENDING_VIEW);

  // Hero has no single product in context, so "Order Now" takes the buyer straight
  // to the product grid below where they can pick something to order.
  const scrollToTrending = (e) => {
    e.preventDefault();
    document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pb-20 animate-fade-up">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2.5 py-5 pb-6">
        {categoriesLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse h-[38px] w-[130px] rounded-full bg-surface-muted" />
            ))
          : categories.map((cat) => {
              const isActive = view.type === 'category' && view.key === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-2 whitespace-nowrap px-[18px] py-2.5 rounded-full border text-[13.5px] font-medium cursor-pointer transition-colors ${
                    isActive
                      ? 'border-green text-green bg-green-tint'
                      : 'border-border bg-white text-ink-soft hover:border-green hover:text-green hover:bg-green-tint'
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E5A46" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={cat.icon} />
                  </svg>
                  {cat.name}
                </button>
              );
            })}
      </div>

      {/* Hero banner */}
      <section className="bg-green-deep rounded-[22px] overflow-hidden relative grid min-h-[400px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>
        <div className="p-7 sm:p-10 lg:p-[60px] flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-2 font-mono text-[11.5px] tracking-[0.16em] uppercase text-gold mb-[18px]">
            <span className="w-6 h-px bg-gold inline-block" />
            First-order offer
          </div>
          <h1 className="font-display text-[32px] sm:text-[40px] lg:text-[50px] leading-[1.05] font-bold text-white mb-[18px] tracking-tight text-balance">
            Free shipping on your first order.
          </h1>
          <p className="text-base leading-relaxed text-teal-softer mb-7 max-w-[420px] text-balance">
            Source wholesale from verified sellers worldwide — zero shipping cost on your first B2B order.
          </p>
          <div className="flex gap-3.5 items-center flex-wrap">
            <a
              href="#trending"
              onClick={scrollToTrending}
              className="relative z-10 pointer-events-auto cursor-pointer bg-orange hover:bg-orange-hover active:bg-orange-hover text-white font-semibold text-[15px] px-8 py-[15px] rounded-full no-underline flex items-center gap-2 shadow-[0_8px_24px_rgba(201,123,45,0.35)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Order Now
              <IconArrowRight width="15" height="15" strokeWidth="2.4" />
            </a>
            <Link
              to="/spotlight"
              className="cursor-pointer text-teal-mist font-medium text-[15px] px-3 py-[15px] no-underline underline decoration-white/40 underline-offset-[5px] hover:decoration-teal-mist"
            >
              See your Spotlight →
            </Link>
          </div>
        </div>
        <div className="relative min-h-[300px]">
          <img
            src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80"
            alt="Shipping containers"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, #0A3D30 0%, rgba(10,61,48,0.25) 40%, rgba(10,61,48,0) 100%)' }}
          />
          <div className="absolute bottom-6 right-6 bg-white/92 backdrop-blur-sm rounded-2xl px-[18px] py-3.5 flex items-center gap-3">
            <IconTruck width="22" height="22" className="text-green" />
            <div>
              <div className="font-bold text-sm text-ink">190+ countries</div>
              <div className="text-xs text-text">Door-to-door logistics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div className="flex justify-center items-center gap-11 py-[30px] border-b border-border flex-wrap">
        <div className="flex items-center gap-2.5 font-display font-bold text-base text-green">
          <IconShield width="20" height="20" />
          100% Trusted — falsafah tot
        </div>
        <div className="flex gap-[30px] text-[13.5px] text-text flex-wrap">
          <span className="flex items-center gap-1.5">
            <IconCheck className="text-green" strokeWidth="2.2" />
            Verified sellers
          </span>
          <span className="flex items-center gap-1.5">
            <IconCheck className="text-green" strokeWidth="2.2" />
            Secure escrow payments
          </span>
          <span className="flex items-center gap-1.5">
            <IconCheck className="text-green" strokeWidth="2.2" />
            Worldwide delivery
          </span>
          <span className="flex items-center gap-1.5">
            <IconCheck className="text-green" strokeWidth="2.2" />
            Trade assurance
          </span>
        </div>
      </div>

      {/* Trending Now / category results */}
      <section id="trending" className="pt-11 scroll-mt-24">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-[28px] font-bold m-0 tracking-tight">{sectionTitle}</h2>
            {isDefaultView && (
              <span className="flex items-center gap-1 bg-orange-tint text-orange-text text-xs font-semibold px-3 py-1.5 rounded-full">
                <IconTrendingUp />
                Live
              </span>
            )}
            {view.type === 'all' && !productsLoading && (
              <span className="text-xs font-medium text-text-muted">{displayedProducts.length} products</span>
            )}
          </div>
          {isDefaultView ? (
            <button
              type="button"
              onClick={viewAllProducts}
              className="cursor-pointer text-sm font-semibold text-green flex items-center gap-1.5 group hover:gap-2.5 transition-all"
            >
              View all
              <IconArrowRight width="14" height="14" strokeWidth="2.2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={resetToTrending}
              className="cursor-pointer text-sm font-semibold text-green flex items-center gap-1.5 hover:underline"
            >
              {selectedCategory ? 'Clear filter' : 'Show trending only'}
            </button>
          )}
        </div>

        {productsLoading && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-border rounded-2xl overflow-hidden">
                <div className="h-[180px] bg-surface-muted" />
                <div className="px-[18px] pt-4 pb-[18px] flex flex-col gap-2">
                  <div className="h-4 bg-surface-muted rounded w-3/4" />
                  <div className="h-3 bg-surface-muted rounded w-1/2" />
                  <div className="h-4 bg-surface-muted rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!productsLoading && productsError && (
          <div className="text-center py-12 px-5 bg-white border border-dashed border-border-strong rounded-2xl">
            <p className="text-[15px] text-orange-text m-0">{productsError}</p>
          </div>
        )}

        {!productsLoading && !productsError && displayedProducts.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {displayedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {!productsLoading && !productsError && displayedProducts.length === 0 && (
          <div className="text-center py-12 px-5 bg-white border border-dashed border-border-strong rounded-2xl">
            <p className="text-[15px] text-text m-0">
              No products in {selectedCategory ? selectedCategory.name : 'this view'} yet. Check back soon.
            </p>
          </div>
        )}
      </section>

      {/* Sourcing CTA */}
      <section
        className="mt-14 bg-white border border-border rounded-[20px] grid overflow-hidden"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}
      >
        <div className="relative min-h-[240px]">
          <img
            src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1000&q=80"
            alt="Warehouse"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="p-8 sm:p-11 lg:p-12 flex flex-col justify-center">
          <h3 className="font-display text-2xl font-bold m-0 mb-2.5 tracking-tight">Can't find what you need?</h3>
          <p className="text-[15px] text-text leading-relaxed mb-6 max-w-[440px] text-balance">
            Post a sourcing request and let verified suppliers come to you with quotes — free for buyers.
          </p>
          <a className="cursor-pointer self-start bg-green hover:bg-green-hover text-white font-semibold text-[14.5px] px-7 py-3.5 rounded-full transition-colors">
            Post a request
          </a>
        </div>
      </section>
    </main>
  );
}
