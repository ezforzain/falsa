import { useEffect, useState } from 'react';
import { categories } from '../data/mockData';
import ProductImagesUploader from './ProductImagesUploader';
import { IconClose } from './icons';

const MAX_IMAGES = 6;

const emptyForm = { name: '', category: '', description: '', sku: '', price: '', unit: '', moq: '', stock: '', status: 'active', images: [] };

export default function ProductFormModal({ open, product, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(product);

  useEffect(() => {
    if (!open) return;
    setForm(
      product
        ? {
            name: product.name,
            category: product.category,
            description: product.description || '',
            sku: product.sku || '',
            price: String(product.price),
            unit: product.unit,
            moq: product.moq,
            stock: String(product.stock),
            status: product.status,
            images: product.images && product.images.length > 0 ? product.images : product.img ? [product.img] : [],
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
  const setImages = (images) => setForm((f) => ({ ...f, images }));

  const submit = () => {
    onSubmit({
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      unit: form.unit.trim(),
      moq: form.moq.trim(),
      stock: Number(form.stock),
      status: form.status,
      images: form.images,
    });
  };

  const fieldClass =
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-[460px] max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">{isEdit ? 'Edit listing' : 'Add new listing'}</h2>
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
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={set('status')} className={fieldClass}>
                <option value="active">Active (visible)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
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
              <label className={labelClass}>Stock</label>
              <input type="text" inputMode="numeric" value={form.stock} onChange={set('stock')} placeholder="2400" className={fieldClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>SKU (optional)</label>
            <input type="text" value={form.sku} onChange={set('sku')} placeholder="Auto-generated if left blank" className={fieldClass} />
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
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
