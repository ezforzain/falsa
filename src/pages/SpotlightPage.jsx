import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { marketplace } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getBuyerCountry } from '../lib/buyerCountry';
import VerifiedBadge from '../components/VerifiedBadge';
import MobileTopBar from '../components/MobileTopBar';
import useIsMobile from '../hooks/useIsMobile';
import useInfiniteFeed from '../hooks/useInfiniteFeed';
import { IconPin, IconSparkle, IconGlobe, IconTruck } from '../components/icons';

// This page used to be driven by admin-curated "near"/"trending" rails (SpotlightEntry). It's
// now the same country-aware 70% local / 30% international ranked feed as the Spotlight
// marketplace tab (see server/src/routes/marketplace.routes.js) — same visual shape (a single
// featured hero + a secondary grid on desktop, one endless feed on mobile), real data underneath.
export default function SpotlightPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const buyerCountry = getBuyerCountry(user);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    marketplace
      .spotlight({ buyerCountry, limit: 48 })
      .then((res) => {
        if (!cancelled) setProducts(res.products);
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
  }, [buyerCountry]);

  const { items: feedProducts, loadingMore, sentinelRef } = useInfiniteFeed(products, { batchSize: 6 });

  const featured = products[0] || null;
  const rest = useMemo(() => products.slice(1), [products]);
  const isLocal = (p) => p && p.sellerCountry === buyerCountry;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <MobileTopBar />

        <div className="px-[18px] pt-2 pb-3">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-orange mb-1">
            <IconSparkle width="14" height="14" />
            Spotlight
          </div>
          <h1 className="font-display text-xl font-bold text-ink m-0">Curated for {buyerCountry}</h1>
        </div>

        {!loading && !error && featured && (
          <div className="mx-[18px] mb-5 bg-white border border-border rounded-[18px] overflow-hidden">
            <div className="relative h-[190px]">
              <img src={featured.img} alt={featured.name} className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 bg-green text-white text-[11px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5">
                <IconSparkle width="11" height="11" />
                Featured
              </span>
            </div>
            <div className="p-4">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-orange mb-1.5 flex items-center gap-1.5">
                {isLocal(featured) ? (
                  <>
                    <IconPin width="11" height="11" /> Near you
                  </>
                ) : (
                  <>
                    <IconGlobe width="11" height="11" /> From {featured.sellerCountry || 'abroad'}
                  </>
                )}
              </div>
              <div className="text-[15px] font-semibold text-ink leading-snug mb-1.5 line-clamp-2">{featured.name}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-text-muted mb-3 flex-wrap">
                <IconPin width="11" height="11" />
                {featured.seller}
                {featured.verified && <VerifiedBadge size={12} />}
              </div>
              <div className="font-display font-bold text-[19px] text-green mb-3">{featured.price}</div>
              <Link
                to={`/product/${featured.id}`}
                className="block text-center cursor-pointer bg-orange hover:bg-orange-hover text-white font-semibold text-[13.5px] py-2.5 rounded-full no-underline transition-colors"
              >
                View Product
              </Link>
            </div>
          </div>
        )}

        {loading && (
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

        {!loading && error && (
          <div className="mx-[18px] mb-8 text-center py-8 px-5 bg-cream rounded-[14px] border border-dashed border-border-strong">
            <div className="text-[13.5px] text-orange-text">{error}</div>
          </div>
        )}

        {!loading && !error && feedProducts.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2.5 px-[18px] pb-3">
              {feedProducts.map((p) => (
                <div key={p.feedKey} className="bg-white border border-[#EFEBE2] rounded-[14px] overflow-hidden">
                  <Link to={`/product/${p.id}`} className="block no-underline text-inherit">
                    <div className="h-[130px] overflow-hidden">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="px-2.5 pt-2.5 pb-2.5">
                      <div className="text-[12.5px] font-semibold text-ink leading-snug mb-1.5 line-clamp-2">{p.name}</div>
                      <div className="flex items-baseline justify-between">
                        <span className="font-display font-bold text-[14.5px] text-green">{p.price}</span>
                        <span className="text-[10px] text-orange-text bg-orange-tint px-1.5 py-1 rounded-md font-semibold">
                          MOQ {p.moq}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Infinite-scroll sentinel — loops the Spotlight pool endlessly, same as Home. */}
            <div ref={sentinelRef} className="flex items-center justify-center py-6">
              {loadingMore && (
                <span className="w-6 h-6 rounded-full border-2 border-border-strong border-t-green animate-[spin_0.7s_linear_infinite]" />
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Section title banner */}
      <section
        className="w-full flex items-center justify-center text-center px-4 py-14 sm:py-20 lg:py-24"
        style={{ background: 'radial-gradient(circle at 50% 50%, #7FC0A8 0%, #0E5A46 55%, #0A3D30 100%)' }}
      >
        <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 sm:gap-x-4 gap-y-1 font-display text-white m-0">
          <span className="text-2xl sm:text-3xl font-medium">Free Shipping</span>
          <span className="text-2xl sm:text-3xl font-medium">Worldwide</span>
          <span className="relative inline-block text-5xl sm:text-6xl font-semibold leading-none">
            Spotlight
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 sm:-bottom-3 w-14 sm:w-16 h-px bg-white" />
          </span>
        </h1>
      </section>

      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-11 pb-20 animate-fade-up">
      <div className="flex items-end justify-between flex-wrap gap-5 mb-2">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11.5px] tracking-[0.16em] uppercase text-orange mb-3">
            <IconSparkle />
            Spotlight
          </div>
          <h2 className="font-display text-[30px] sm:text-4xl font-bold m-0 tracking-tight">Curated for {buyerCountry}</h2>
          <p className="text-[15px] text-text max-w-[560px] leading-relaxed mt-3 text-balance">
            Mostly products from sellers in your country, ranked by relevance, quality, and popularity — plus a mix
            from other countries so there's always something new to discover.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-white border-[1.5px] border-border rounded-xl px-[18px] py-3">
          <IconPin className="text-text-muted" />
          <span className="text-[13px] text-text-muted">Your country</span>
          <span className="font-semibold text-sm">{buyerCountry}</span>
        </div>
      </div>

      {loading && (
        <div className="pt-8 grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-border rounded-2xl overflow-hidden">
              <div className="h-40 bg-surface-muted" />
              <div className="px-[18px] pt-4 pb-[18px] flex flex-col gap-2">
                <div className="h-4 bg-surface-muted rounded w-3/4" />
                <div className="h-3 bg-surface-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 text-center py-12 px-5 bg-white border border-dashed border-border-strong rounded-2xl">
          <p className="text-[15px] text-orange-text m-0">{error}</p>
        </div>
      )}

      {/* Featured product — Daraz-style single hero card instead of a grid: one large image,
          full details, and a clear CTA, rather than competing for attention with a dozen tiles. */}
      {!loading && !error && featured && (
        <section className="pt-8">
          <div className="grid lg:grid-cols-2 bg-white border border-border rounded-[24px] overflow-hidden">
            <div className="relative h-[300px] lg:h-full min-h-[380px] bg-surface-muted order-1">
              <img src={featured.img} alt={featured.name} className="w-full h-full object-cover" />
              <span className="absolute top-4 left-4 bg-green text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <IconSparkle width="12" height="12" />
                Featured
              </span>
            </div>

            <div className="p-7 lg:p-10 flex flex-col justify-center order-2">
              <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-orange mb-3">
                {isLocal(featured) ? 'From a seller in your country' : `From ${featured.sellerCountry || 'abroad'}`}
              </div>
              <h2 className="font-display text-2xl sm:text-[32px] font-bold text-ink m-0 mb-3 tracking-tight text-balance">
                {featured.name}
              </h2>
              <div className="flex items-center gap-1.5 text-[13.5px] text-text-muted mb-4 flex-wrap">
                <IconPin width="13" height="13" />
                {featured.seller}
                {featured.verified && <VerifiedBadge size={14} />}
              </div>
              <div className="font-display font-bold text-[28px] text-green mb-1">{featured.price}</div>
              <div className="text-[13px] text-text-muted mb-5">
                MOQ {featured.moq} / {featured.unit}
              </div>

              {featured.freeShipping && (
                <div className="inline-flex items-center gap-1.5 self-start bg-green-tint text-green text-[12.5px] font-bold px-3 py-1.5 rounded-full mb-6">
                  <IconTruck width="13" height="13" strokeWidth="2.2" />
                  Free shipping{featured.worldwideFreeShipping ? ' worldwide' : ` within ${featured.sellerCountry || 'origin country'}`}
                </div>
              )}

              <Link
                to={`/product/${featured.id}`}
                className="block text-center cursor-pointer bg-orange hover:bg-orange-hover text-white font-semibold text-[15px] py-3.5 rounded-full no-underline shadow-[0_8px_22px_rgba(201,123,45,0.3)] transition-all hover:-translate-y-0.5"
              >
                View Product
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Everything else Spotlight has to offer, as a lighter secondary strip beneath the
          featured product rather than a second competing grid. */}
      {!loading && !error && rest.length > 0 && (
        <section className="pt-12">
          <h2 className="font-display text-[20px] font-bold m-0 mb-5">More from Spotlight</h2>
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {rest.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="block bg-white border border-border rounded-2xl overflow-hidden no-underline text-inherit transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(20,40,32,0.12)]"
              >
                <div className="h-36 overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="px-4 pt-3.5 pb-3.5">
                  <div className="text-sm font-semibold mb-1.5 line-clamp-1">{p.name}</div>
                  <div className="font-display font-bold text-green text-[15px]">{p.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Similar products fallback */}
      <section className="mt-12 bg-green-deep rounded-[20px] p-6 sm:p-9 lg:p-11">
        <div className="flex gap-7 items-center flex-wrap">
          <div className="w-[52px] h-[52px] rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="flex-1 min-w-[280px]">
            <h3 className="font-display text-lg font-bold m-0 mb-1.5 text-white">Few sellers near you?</h3>
            <p className="text-sm text-teal-softer leading-relaxed m-0 text-balance">
              When your country has limited sellers for a product, Spotlight fills the remaining slots with the
              best matches from other countries instead of leaving them empty.
            </p>
          </div>
          <Link
            to="/"
            className="cursor-pointer bg-white hover:bg-green-tint text-green-deep font-semibold text-sm px-[26px] py-3.5 rounded-full whitespace-nowrap no-underline transition-colors"
          >
            Browse similar products
          </Link>
        </div>
      </section>
    </main>
    </>
  );
}
