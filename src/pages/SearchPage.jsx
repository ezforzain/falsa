import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { normalizeQuery } from '../data/mockData';
import { catalog } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { IconSearch } from '../components/icons';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = normalizeQuery(searchParams.get('q'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    catalog
      .products({ q: query })
      .then(({ products }) => {
        if (!cancelled) setResults(products);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Something went wrong while searching.');
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">
        {query ? <>Results for &ldquo;{query}&rdquo;</> : 'All products'}
      </h1>
      <p className="text-sm text-text-muted mb-7">
        {loading ? 'Searching…' : `${results.length} product${results.length === 1 ? '' : 's'} found`}
      </p>

      {loading && (
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

      {!loading && error && (
        <div className="text-center py-[60px] px-5 bg-white border border-dashed border-border-strong rounded-2xl">
          <p className="text-[15px] text-orange-text mb-5">{error}</p>
          <Link
            to="/"
            className="cursor-pointer inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-[26px] py-3 rounded-full no-underline transition-colors"
          >
            Back to marketplace
          </Link>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
          {results.map((r) => (
            <ProductCard key={r.id} product={r} />
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="text-center py-[60px] px-5 bg-white border border-dashed border-border-strong rounded-2xl">
          <span className="w-14 h-14 rounded-full bg-surface-muted inline-flex items-center justify-center mb-5">
            <IconSearch width="22" height="22" className="text-text-muted" />
          </span>
          <p className="text-[16px] font-semibold text-ink mb-1.5">No results found</p>
          <p className="text-[15px] text-text mb-5">
            {query ? <>Nothing matched &ldquo;{query}&rdquo;. Try a different keyword or category.</> : 'Try searching for a product, category, or seller.'}
          </p>
          <Link
            to="/"
            className="cursor-pointer inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-[26px] py-3 rounded-full no-underline transition-colors"
          >
            Back to marketplace
          </Link>
        </div>
      )}
    </main>
  );
}
