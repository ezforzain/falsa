import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sellers } from '../lib/api';
import ProductCard from '../components/ProductCard';
import VerifiedBadge from '../components/VerifiedBadge';
import { IconBox, IconShield } from '../components/icons';

export default function StorePage() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);

    sellers
      .get(id)
      .then(({ seller, products }) => {
        if (cancelled) return;
        setStore(seller);
        setStoreProducts(products);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) setNotFound(true);
        else setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20">
        <div className="animate-pulse bg-white border border-border rounded-2xl h-[140px] mb-8" />
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-border rounded-2xl h-[280px]" />
          ))}
        </div>
      </main>
    );
  }

  if (notFound || (!store && error)) {
    return (
      <main className="max-w-[1240px] mx-auto px-6 py-20 text-center">
        <p className="text-text mb-5">{notFound ? 'Store not found.' : error}</p>
        <Link to="/" className="text-green font-semibold no-underline hover:underline">
          Back to marketplace
        </Link>
      </main>
    );
  }

  if (!store) return null;

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 mb-8 flex items-center gap-5 flex-wrap">
        <span className="w-16 h-16 rounded-2xl bg-green-tint flex items-center justify-center shrink-0">
          <IconBox width="28" height="28" className="text-green" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl sm:text-[28px] font-bold m-0 tracking-tight text-ink truncate">{store.name}</h1>
            {store.verified && <VerifiedBadge size={20} />}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mt-2.5 ${
              store.verified ? 'bg-green-tint text-green' : 'bg-surface-muted text-text-muted'
            }`}
          >
            <IconShield width="13" height="13" strokeWidth="2.2" />
            {store.verified ? 'Verified Store' : 'Not yet verified'}
          </div>
        </div>
      </div>

      <h2 className="font-display text-xl font-bold m-0 mb-5 tracking-tight text-ink">
        {storeProducts.length} listing{storeProducts.length === 1 ? '' : 's'}
      </h2>

      {storeProducts.length > 0 ? (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
          {storeProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-[60px] px-5 bg-white border border-dashed border-border-strong rounded-2xl">
          <p className="text-[15px] text-text">This store doesn't have any active listings right now.</p>
        </div>
      )}
    </main>
  );
}
