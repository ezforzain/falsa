import { useEffect, useState } from 'react';
import { seller } from '../../lib/api';
import Toast from '../../components/Toast';
import StoreLogoUploader from '../../components/StoreLogoUploader';
import StoreBannerUploader from '../../components/StoreBannerUploader';
import PromoBannerManager from '../../components/PromoBannerManager';
import StoreSectionsManager from '../../components/StoreSectionsManager';
import { IconStore } from '../../components/icons';

export default function SellerStoreProfile() {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ logoUrl: null, bannerUrl: null, description: '', hours: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    seller
      .getStoreProfile()
      .then(({ store: s }) => {
        setStore(s);
        setForm({ logoUrl: s.logoUrl || null, bannerUrl: s.bannerUrl || null, description: s.description || '', hours: s.hours || '' });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // Only active listings — a draft can't usefully go in a customer-facing store section, and
    // this is purely what StoreSectionsManager's "add product" picker offers.
    seller
      .products()
      .then((res) => setProducts(res.products.filter((p) => p.status === 'active')))
      .catch(() => {});
  }, []);

  const submit = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const { store: updated } = await seller.updateStoreProfile(form);
      setStore(updated);
      setToastVisible(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'w-full px-[16px] py-[12px] border border-border rounded-xl text-[14.5px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const labelClass = 'block text-[13px] font-semibold text-ink-soft mb-2';

  return (
    <div className="animate-fade-up max-w-[560px]">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Store profile</h1>
        <p className="text-sm text-text mt-1">This is what buyers see on your public store page.</p>
      </div>

      {loading && <div className="animate-pulse bg-white border border-border rounded-2xl h-[320px]" />}

      {!loading && error && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && store && (
        <div className="bg-white border border-border rounded-2xl p-6">
          {saveError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-5">{saveError}</p>}

          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Store logo</label>
              <StoreLogoUploader value={form.logoUrl} onChange={(logoUrl) => setForm((f) => ({ ...f, logoUrl }))} />
            </div>

            <div>
              <label className={labelClass}>
                <IconStore width="14" height="14" className="inline mr-1.5 -mt-0.5" />
                Store banner
              </label>
              <StoreBannerUploader value={form.bannerUrl} onChange={(bannerUrl) => setForm((f) => ({ ...f, bannerUrl }))} />
            </div>

            <div>
              <label className={labelClass}>Store description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Tell buyers what you sell, your specialties, and what sets your store apart…"
                rows={4}
                className={`${fieldClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Business hours (optional)</label>
              <input
                type="text"
                value={form.hours}
                onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                placeholder="e.g. Mon–Sat, 9am–6pm"
                className={fieldClass}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 px-7 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}

      {!loading && !error && store && (
        <>
          <div className="bg-white border border-border rounded-2xl p-6 mt-4">
            <h2 className="font-display text-lg font-bold text-ink mb-1">Promo banners</h2>
            <p className="text-sm text-text mb-5">Extra sale/announcement banners, shown as a carousel above your products. GIFs supported.</p>
            <PromoBannerManager banners={store.promoBanners} onChange={(promoBanners) => setStore((s) => ({ ...s, promoBanners }))} />
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 mt-4">
            <h2 className="font-display text-lg font-bold text-ink mb-1">Custom sections</h2>
            <p className="text-sm text-text mb-5">
              Group your own products into named sections — e.g. "New Arrivals" — shown on your public store page. Only affects your
              store, not the platform-wide catalog.
            </p>
            <StoreSectionsManager sections={store.sections} products={products} onChange={(sections) => setStore((s) => ({ ...s, sections }))} />
          </div>
        </>
      )}

      <Toast message="Store profile updated" show={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}
