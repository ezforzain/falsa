import { useEffect, useState } from 'react';
import { categories } from '../data/mockData';
import ProductImagesUploader from './ProductImagesUploader';
import { IconClose } from './icons';

const MAX_IMAGES = 6;

const emptyForm = {
  name: '',
  sellerId: '',
  category: '',
  description: '',
  price: '',
  unit: '',
  moq: '',
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
export default function AdminProductFormModal({ open, product, sellersList, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
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
            unit: product.unit || '',
            moq: product.moq || '',
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
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggle = (key) => () => setForm((f) => ({ ...f, [key]: !f[key], ...(key === 'freeShipping' && f.freeShipping ? { worldwideFreeShipping: false } : {}) }));
  const setImages = (images) => setForm((f) => ({ ...f, images }));

  const submit = () => {
    onSubmit({
      name: form.name.trim(),
      sellerId: form.sellerId,
      category: form.category,
      description: form.description.trim(),
      price: form.price.trim(),
      unit: form.unit.trim(),
      moq: form.moq.trim(),
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
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-[460px] max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 animate-fade-up">
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

          <div>
            <label className={labelClass}>Store</label>
            <select value={form.sellerId} onChange={set('sellerId')} className={fieldClass}>
              <option value="" disabled>
                Select the store this product belongs to…
              </option>
              {sellersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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
              <select value={form.category} onChange={set('category')} className={fieldClass}>
                <option value="" disabled>
                  Select…
                </option>
                {categories.map((c) => (
                  <option key={c.key} value={c.name}>
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
              <label className={labelClass}>Unit</label>
              <input type="text" value={form.unit} onChange={set('unit')} placeholder="metre" className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>MOQ</label>
              <input type="text" value={form.moq} onChange={set('moq')} placeholder="500m" className={fieldClass} />
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
            className="flex-1 cursor-pointer bg-white border-[1.5px] border-border text-ink-soft font-semibold text-sm py-3 rounded-full hover:bg-surface-muted transition-colors"
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
