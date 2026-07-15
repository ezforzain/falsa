import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalog } from '../lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    catalog
      .categories()
      .then(({ categories: list }) => {
        if (!cancelled) setCategories(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load categories.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">Categories</h1>
      <p className="text-sm text-text-muted mb-7">Browse the marketplace by product category.</p>

      {loading && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col items-center gap-3 bg-white border border-border rounded-2xl py-6">
              <div className="w-14 h-14 rounded-full bg-surface-muted" />
              <div className="h-3 w-3/5 bg-surface-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-[60px] px-5 bg-white border border-dashed border-border-strong rounded-2xl">
          <p className="text-[15px] text-orange-text">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(cat.name)}`)}
              className="cursor-pointer flex flex-col items-center gap-3 bg-white border border-border rounded-2xl py-6 hover:border-border-strong hover:-translate-y-0.5 transition-all"
            >
              <span className="w-14 h-14 rounded-full overflow-hidden border-2 border-cream-dark">
                <img src={cat.img} alt="" className="w-full h-full object-cover" />
              </span>
              <span className="text-[13px] font-semibold text-ink-soft text-center px-2 leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
