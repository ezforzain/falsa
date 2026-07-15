import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalog } from '../lib/api';
import VerifiedBadge from '../components/VerifiedBadge';
import { IconPin, IconSparkle, IconTrendingUp, IconTruck } from '../components/icons';

export default function SpotlightPage() {
  const [spotlightNear, setSpotlightNear] = useState([]);
  const [spotlightTrend, setSpotlightTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([catalog.spotlightNear(), catalog.spotlightTrending()])
      .then(([near, trend]) => {
        if (cancelled) return;
        setSpotlightNear(near.items);
        setSpotlightTrend(trend.items);
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
  }, []);

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
          <h2 className="font-display text-[30px] sm:text-4xl font-bold m-0 tracking-tight">Curated for Pakistan</h2>
          <p className="text-[15px] text-text max-w-[560px] leading-relaxed mt-3 text-balance">
            Products from the sellers nearest to you, ranked by lowest shipping cost — plus what's trending in your
            country right now.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-white border-[1.5px] border-border rounded-xl px-[18px] py-3 cursor-pointer hover:border-green transition-colors">
          <IconPin className="text-text-muted" />
          <span className="text-[13px] text-text-muted">Your country</span>
          <span className="font-semibold text-sm">🇵🇰 Pakistan</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <path d="m6 9 6 6 6-6" />
          </svg>
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

      {!loading && !error && (
      <>
      {/* Nearest sellers */}
      <section className="pt-8">
        <h2 className="font-display text-[22px] font-bold m-0 mb-1.5">Nearest sellers, lowest shipping</h2>
        <p className="text-[13.5px] text-text-muted mb-5">Ranked by shipping charges to your address</p>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {spotlightNear.map((s) => (
            <Link
              key={s.product.id}
              to={`/product/${s.product.id}`}
              className="group block bg-white border border-border rounded-2xl overflow-hidden no-underline text-inherit transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(20,40,32,0.12)]"
            >
              <div className="h-40 relative overflow-hidden">
                <img src={s.product.img} alt={s.product.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 bg-green text-white text-[11px] font-bold px-2.5 py-1.5 rounded-full">
                  #{s.rank} nearest
                </span>
              </div>
              <div className="px-[18px] pt-4 pb-[18px]">
                <div className="text-[15px] font-semibold mb-1">{s.product.name}</div>
                <div className="flex items-center gap-1.5 text-[12.5px] text-text-muted mb-3.5 flex-wrap">
                  <IconPin width="12" height="12" />
                  {s.product.seller}
                  {s.product.verified && <VerifiedBadge size={13} />}
                  <span>· {s.distance}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-green-tint text-green text-[12.5px] font-bold px-3 py-1.5 rounded-full">
                  <IconTruck width="13" height="13" strokeWidth="2.2" />
                  Shipping {s.shipping}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending in country */}
      <section className="pt-12">
        <h2 className="font-display text-[22px] font-bold m-0 mb-1.5">Trending in Pakistan</h2>
        <p className="text-[13.5px] text-text-muted mb-5">What buyers in your country are ordering this week</p>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
          {spotlightTrend.map((t) => (
            <Link
              key={t.product.id}
              to={`/product/${t.product.id}`}
              className="group block bg-white border border-border rounded-2xl overflow-hidden no-underline text-inherit transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(20,40,32,0.12)]"
            >
              <div className="h-[140px] overflow-hidden">
                <img src={t.product.img} alt={t.product.name} className="w-full h-full object-cover" />
              </div>
              <div className="px-4 pt-3.5 pb-4">
                <div className="text-sm font-semibold mb-1.5">{t.product.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-orange-text font-bold">
                  <IconTrendingUp />
                  {t.growth} this week
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      </>
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
              When your country has limited sellers for a product, Spotlight shows the closest matches — similar
              products from the nearest available regions.
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
