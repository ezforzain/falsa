import { useEffect, useRef, useState } from 'react';
import ProductImagesUploader from './ProductImagesUploader';
import { IconClose, IconChevronDown, IconSearch, IconCheck, IconStore } from './icons';

const MAX_IMAGES = 6;

const emptyForm = {
  name: '',
  sellerId: '',
  category: '',
  description: '',
  price: '',
  stock: '',
  badge: '',
  images: [],
  b2bEnabled: false,
  freeShipping: true,
  worldwideFreeShipping: false,
};

// Mirrors ProductFormModal (seller portal), but targets the public `Product` catalog directly:
// price is a plain number here (formatted as "Rs <n>" server-side) and every listing needs an
// owning store, since Product.sellerId is required — so this form adds a seller picker instead
// of a status/sku pair, neither of which exist on the Product model.
// `categoriesList` comes from the live Category collection (the same one buyer-facing category
// filters query against) rather than a hardcoded local copy — a category added via the admin's
// own Categories tab needs to be pickable here immediately, and a product's `category` string
// needs to always match something a buyer-facing filter actually recognizes.
export default function AdminProductFormModal({ open, product, sellersList, categoriesList, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [storeOpen, setStoreOpen] = useState(false);
  const [storeQuery, setStoreQuery] = useState('');
  const storeRef = useRef(null);
  const isEdit = Boolean(product);

  useEffect(() => {
    if (!open) return;
    setForm(
      product
        ? {
            name: product.name,
            sellerId: product.sellerId || '',
            category: product.category,
            description: product.description || '',
            price: String(product.price || '').replace(/^rs\s*/i, ''),
            stock: product.stock === null || product.stock === undefined ? '' : String(product.stock),
            badge: product.badge || '',
            images: product.images && product.images.length > 0 ? product.images : product.img ? [product.img] : [],
            b2bEnabled: Boolean(product.b2bEnabled),
            freeShipping: product.freeShipping !== false,
            worldwideFreeShipping: Boolean(product.worldwideFreeShipping),
          }
        : emptyForm
    );
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (storeOpen) {
        setStoreOpen(false);
        return;
      }
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, storeOpen]);

  useEffect(() => {
    if (!storeOpen) return;
    const onPointerDown = (e) => {
      if (storeRef.current && !storeRef.current.contains(e.target)) setStoreOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [storeOpen]);

  useEffect(() => {
    if (!open) {
      setStoreOpen(false);
      setStoreQuery('');
    }
  }, [open]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggle = (key) => () => setForm((f) => ({ ...f, [key]: !f[key], ...(key === 'freeShipping' && f.freeShipping ? { worldwideFreeShipping: false } : {}) }));
  const setImages = (images) => setForm((f) => ({ ...f, images }));

  const selectedStore = sellersList.find((s) => s.id === form.sellerId) || null;
  const filteredStores = storeQuery.trim()
    ? sellersList.filter((s) => s.name.toLowerCase().includes(storeQuery.trim().toLowerCase()))
    : sellersList;
  const pickStore = (id) => {
    setForm((f) => ({ ...f, sellerId: id }));
    setStoreOpen(false);
    setStoreQuery('');
  };

  const submit = () => {
    onSubmit({
      name: form.name.trim(),
      sellerId: form.sellerId,
      category: form.category,
      description: form.description.trim(),
      price: form.price.trim(),
      stock: form.stock.trim() === '' ? null : Number(form.stock),
      badge: form.badge.trim(),
      images: form.images,
      b2bEnabled: form.b2bEnabled,
      freeShipping: form.freeShipping,
      worldwideFreeShipping: form.freeShipping && form.worldwideFreeShipping,
    });
  };

  const canSubmit = form.name.trim() && form.sellerId && form.category && form.price.trim();

  const fieldClass =
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-surface text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-[460px] max-h-full overflow-y-auto bg-surface rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">{isEdit ? 'Edit product' : 'Add new product'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-ink cursor-pointer p-1">
            <IconClose width="18" height="18" />
          </button>
        </div>

        {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Product name</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Cotton Twill Fabric 280 GSM" className={fieldClass} />
          </div>

          <div ref={storeRef} className="relative">
            <label className={labelClass}>Store</label>
            <button
              type="button"
              onClick={() => setStoreOpen((v) => !v)}
              className={`${fieldClass} flex items-center justify-between gap-2 text-left cursor-pointer ${storeOpen ? 'border-green shadow-[0_0_0_3px_rgba(14,90,70,0.12)]' : ''}`}
            >
              <span className={`flex items-center gap-2 min-w-0 truncate ${selectedStore ? 'text-ink' : 'text-text-muted'}`}>
                <IconStore width="15" height="15" className="shrink-0 text-text-muted" />
                <span className="truncate">{selectedStore ? selectedStore.name : 'Select the store this product belongs to…'}</span>
              </span>
              <IconChevronDown width="16" height="16" className={`shrink-0 text-text-muted transition-transform ${storeOpen ? 'rotate-180' : ''}`} />
            </button>

            {storeOpen && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                  <IconSearch width="14" height="14" className="shrink-0 text-text-muted" />
                  <input
                    autoFocus
                    type="text"
                    value={storeQuery}
                    onChange={(e) => setStoreQuery(e.target.value)}
                    placeholder="Search stores…"
                    className="w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-text-muted"
                  />
                </div>
                <ul className="max-h-56 overflow-y-auto py-1">
                  {filteredStores.length === 0 && <li className="px-3.5 py-3 text-[13px] text-text-muted">No stores match "{storeQuery}"</li>}
                  {filteredStores.map((s) => {
                    const isSelected = s.id === form.sellerId;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => pickStore(s.id)}
                          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-[13.5px] text-left cursor-pointer transition-colors ${
                            isSelected ? 'bg-green/10 text-green font-medium' : 'text-ink hover:bg-surface-muted'
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          {isSelected && <IconCheck width="14" height="14" className="shrink-0" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Describe the product — materials, grade, use case…"
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={set('category')} className={fieldClass} disabled={categoriesList.length === 0}>
                <option value="" disabled>
                  {categoriesList.length === 0 ? 'Add a category first…' : 'Select…'}
                </option>
                {categoriesList.map((c) => (
                  <option key={c.key || c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Badge (optional)</label>
              <input type="text" value={form.badge} onChange={set('badge')} placeholder="e.g. Best seller" className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Price (Rs)</label>
              <input type="text" inputMode="numeric" value={form.price} onChange={set('price')} placeholder="670" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Stock (optional)</label>
              <input type="text" inputMode="numeric" value={form.stock} onChange={set('stock')} placeholder="2400" className={fieldClass} />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 border border-border rounded-lg p-3.5">
            <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink cursor-pointer">
              <input type="checkbox" checked={form.b2bEnabled} onChange={toggle('b2bEnabled')} className="w-4 h-4 accent-green cursor-pointer" />
              List this product on the B2B marketplace
            </label>
            <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink cursor-pointer">
              <input type="checkbox" checked={form.freeShipping} onChange={toggle('freeShipping')} className="w-4 h-4 accent-green cursor-pointer" />
              Free shipping
            </label>
            {form.freeShipping && (
              <label className="flex items-center gap-2.5 text-[13px] text-ink-soft cursor-pointer pl-6">
                <input
                  type="checkbox"
                  checked={form.worldwideFreeShipping}
                  onChange={toggle('worldwideFreeShipping')}
                  className="w-4 h-4 accent-green cursor-pointer"
                />
                Offer it worldwide, not just within the seller's own country
              </label>
            )}
          </div>

          <div>
            <label className={labelClass}>Photos (optional)</label>
            <ProductImagesUploader images={form.images} onChange={setImages} max={MAX_IMAGES} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer bg-surface border-[1.5px] border-border text-ink-soft font-semibold text-sm py-3 rounded-full hover:bg-surface-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !canSubmit}
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  );
}
