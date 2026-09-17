import { useEffect, useState } from 'react';
import { marketplace } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import useIsMobile from '../hooks/useIsMobile';
import useSafahMartLocation from '../hooks/useSafahMartLocation';
import MobileTopBar from '../components/MobileTopBar';
import SafahMartProductCard from '../components/product/SafahMartProductCard';
import { IconPin, IconSearch } from '../components/icons';

const ACCENT = '#6C63FF';

const CATEGORIES = [
  { key: null, labelKey: 'safahMart.categoryAll' },
  { key: 'grocery', labelKey: 'safahMart.categoryGrocery' },
  { key: 'fastfood', labelKey: 'safahMart.categoryFastFood' },
  { key: 'restaurant', labelKey: 'safahMart.categoryRestaurant' },
  { key: 'bakery', labelKey: 'safahMart.categoryBakery' },
  { key: 'mall', labelKey: 'safahMart.categoryMall' },
  { key: 'shop', labelKey: 'safahMart.categoryShop' },
];

// Single page for both breakpoints (mobile chrome via MobileTopBar, desktop via MainLayout's own
// Header/Footer) — same pattern as WishlistPage.jsx. Unlike Home's Mobile/Desktop split, the
// Safah Mart experience (location gate, category chips, distance-sorted grid) doesn't actually
// differ enough between breakpoints to justify two separate page files.
export default function SafahMartPage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { status, coords, geocodeManualAddress, manualError, manualLoading } = useSafahMartLocation();

  const [category, setCategory] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status !== 'granted' || !coords) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    marketplace
      .safahMart({ lat: coords.lat, lng: coords.lng, safahCategory: category || undefined })
      .then(({ products: fetched }) => {
        if (!cancelled) setProducts(fetched);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load nearby shops right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, coords, category]);

  const submitManualAddress = (e) => {
    e.preventDefault();
    if (manualAddress.trim()) geocodeManualAddress(manualAddress.trim());
  };

  const LocationGate = (
    <div className="text-center py-10 px-5 bg-surface border border-dashed border-border-strong rounded-2xl">
      {(status === 'idle' || status === 'requesting') && (
        <>
          <span className="w-6 h-6 rounded-full border-2 border-border-strong inline-block mb-3" style={{ borderTopColor: ACCENT, animation: 'spin 0.8s linear infinite' }} />
          <p className="text-sm text-text">{t('safahMart.locating')}</p>
        </>
      )}
      {status === 'denied' && (
        <>
          <IconPin width="22" height="22" className="mx-auto mb-3 text-text-muted" />
          <p className="text-[14.5px] font-semibold text-ink mb-1.5">{t('safahMart.locationDeniedTitle')}</p>
          <p className="text-sm text-text-muted mb-4 max-w-[360px] mx-auto">{t('safahMart.locationDeniedBody')}</p>
          <form onSubmit={submitManualAddress} className="flex items-center gap-2 max-w-[360px] mx-auto">
            <div className="flex-1 flex items-center gap-2 rounded-full border border-border bg-surface-muted/60 px-4 py-2.5">
              <IconSearch width="15" height="15" className="text-text-muted shrink-0" strokeWidth="1.8" />
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder={t('safahMart.addressPlaceholder')}
                className="w-full border-none outline-none bg-transparent text-[13.5px] text-ink font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={manualLoading || !manualAddress.trim()}
              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 rounded-full text-white font-semibold text-[13px] px-4 py-2.5"
              style={{ background: ACCENT }}
            >
              {manualLoading ? '…' : t('safahMart.find')}
            </button>
          </form>
          {manualError && <p className="text-[12.5px] text-orange-text mt-3">{manualError}</p>}
        </>
      )}
    </div>
  );

  const CategoryChips = (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {CATEGORIES.map((c) => {
        const isActive = c.key === category;
        return (
          <button
            key={c.key ?? 'all'}
            type="button"
            onClick={() => setCategory(c.key)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-semibold cursor-pointer transition-colors ${
              isActive ? 'text-white' : 'text-ink-soft bg-surface-muted hover:text-ink'
            }`}
            style={isActive ? { background: ACCENT } : undefined}
          >
            {t(c.labelKey)}
          </button>
        );
      })}
    </div>
  );

  const grid = (
    <div className={isMobile ? 'grid grid-cols-2 gap-2.5' : 'grid gap-4'} style={!isMobile ? { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' } : undefined}>
      {products.map((p) => (
        <SafahMartProductCard key={p.id} product={p} />
      ))}
    </div>
  );

  const content = (
    <div className="flex flex-col gap-3">
      {CategoryChips}

      {status !== 'granted' && LocationGate}

      {status === 'granted' && loading && (
        <div className={isMobile ? 'grid grid-cols-2 gap-2.5' : 'grid gap-4'} style={!isMobile ? { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' } : undefined}>
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

      {status === 'granted' && !loading && error && (
        <div className="text-center py-8 px-5 bg-cream rounded-[14px] border border-dashed border-border-strong">
          <div className="text-[13.5px] text-orange-text">{error}</div>
        </div>
      )}

      {status === 'granted' && !loading && !error && products.length === 0 && (
        <div className="text-center py-10 px-5 bg-cream rounded-[14px] border border-dashed border-border-strong">
          <p className="text-[14.5px] font-semibold text-ink mb-1">{t('safahMart.emptyTitle')}</p>
          <p className="text-sm text-text-muted">{t('safahMart.emptyBody')}</p>
        </div>
      )}

      {status === 'granted' && !loading && !error && products.length > 0 && grid}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-cream font-sans">
        <MobileTopBar />
        <div className="px-[18px] pt-2 pb-4">
          <h1 className="font-display text-xl font-bold text-ink m-0 mb-1">{t('safahMart.title')}</h1>
          <p className="text-[12.5px] text-text-muted mb-4">{t('safahMart.subtitle')}</p>
          {content}
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-1 tracking-tight">{t('safahMart.title')}</h1>
      <p className="text-sm text-text-muted mb-6">{t('safahMart.subtitle')}</p>
      {content}
    </main>
  );
}
