import { useEffect, useState } from 'react';
import { catalog } from '../lib/api';
import { useWishlist } from '../context/WishlistContext';
import useIsMobile from '../hooks/useIsMobile';
import MobileTopBar from '../components/MobileTopBar';
import MobileProductCard from '../components/product/MobileProductCard';
import ProductCard from '../components/ProductCard';
import { IconHeart } from '../components/icons';

export default function WishlistPage() {
  const { ids } = useWishlist();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    catalog
      .products()
      .then(({ products: all }) => {
        if (!cancelled) setProducts(all);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load your wishlist right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const idSet = new Set(ids);
  const saved = products.filter((p) => idSet.has(p.id));

  const EmptyState = (
    <div className="text-center py-[60px] px-5 bg-white border border-dashed border-border-strong rounded-2xl">
      <span className="w-14 h-14 rounded-full bg-surface-muted inline-flex items-center justify-center mb-5">
        <IconHeart width="22" height="22" className="text-text-muted" />
      </span>
      <p className="text-[16px] font-semibold text-ink mb-1.5">Nothing saved yet</p>
      <p className="text-sm text-text-muted max-w-[420px] mx-auto">
        Tap the heart on any product to save it here so you can find it again later.
      </p>
    </div>
  );

  const LoadingSkeleton = (
    <div className={isMobile ? 'grid grid-cols-2 gap-2.5' : 'grid gap-4'} style={!isMobile ? { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' } : undefined}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white border border-border rounded-2xl overflow-hidden">
          <div className={isMobile ? 'h-[150px] bg-surface-muted' : 'h-[180px] bg-surface-muted'} />
          <div className="p-3 flex flex-col gap-2">
            <div className="h-3 bg-surface-muted rounded w-full" />
            <div className="h-3 bg-surface-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  const content = (
    <>
      {loading && LoadingSkeleton}

      {!loading && error && (
        <div className="text-center py-8 px-5 bg-cream rounded-[14px] border border-dashed border-border-strong">
          <div className="text-[13.5px] text-orange-text">{error}</div>
        </div>
      )}

      {!loading && !error && saved.length === 0 && EmptyState}

      {!loading && !error && saved.length > 0 && (
        <div
          className={isMobile ? 'grid grid-cols-2 gap-2.5' : 'grid gap-4'}
          style={!isMobile ? { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' } : undefined}
        >
          {saved.map((p) => (isMobile ? <MobileProductCard key={p.id} product={p} /> : <ProductCard key={p.id} product={p} />))}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <MobileTopBar />
        <div className="px-[18px] pt-2 pb-4">
          <h1 className="font-display text-xl font-bold text-ink m-0 mb-4">Wishlist</h1>
          {content}
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-6 tracking-tight">Wishlist</h1>
      {content}
    </main>
  );
}
