import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalog } from '../lib/api';
import { getRecentlyViewedIds } from '../lib/recentlyViewed';
import { IconClock } from './icons';

// YouTube-style "watch history" for the profile page — every product this account has opened
// (see recordRecentlyViewed in ProductPage), most-recent-first, as a horizontal scroll of
// thumbnail cards rather than the full ProductCard grid used for Related/Recently Viewed on the
// product page itself. Purely client-side (localStorage, see lib/recentlyViewed.js) — there's no
// server-side view-history concept to fetch instead.
export default function ProfileViewHistoryRail() {
  const [products, setProducts] = useState(null); // null = loading, [] = loaded-but-empty

  useEffect(() => {
    let cancelled = false;
    const ids = getRecentlyViewedIds();
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    catalog
      .products()
      .then(({ products: all }) => {
        if (cancelled) return;
        const byId = new Map(all.map((p) => [p.id, p]));
        setProducts(ids.map((id) => byId.get(id)).filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (products === null || products.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-1.5 px-1 mb-3">
        <IconClock width="14" height="14" className="text-text-muted" />
        <h3 className="text-[13.5px] font-bold text-ink">Recently Viewed</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="group shrink-0 w-[132px] no-underline text-inherit"
          >
            <div className="w-full h-[88px] rounded-xl overflow-hidden bg-surface-muted">
              <img
                src={product.img}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="mt-1.5 text-[12px] font-medium text-ink leading-snug line-clamp-2">{product.name}</p>
            <p className="text-[11.5px] font-semibold text-green mt-0.5">{product.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
