import { useEffect, useState } from 'react';
import ProductImagesUploader from './ProductImagesUploader';
import ModalShell, { ModalError, adminFieldClass, adminLabelClass } from './admin/ui/ModalShell';
import Button from './admin/ui/Button';

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
// `categoriesList` comes from the live Category collection (the same one buyer-facing category
// filters query against) rather than a hardcoded local copy — a category added via the admin's
// own Categories tab needs to be pickable here immediately, and a product's `category` string
// needs to always match something a buyer-facing filter actually recognizes.
export default function AdminProductFormModal({ open, product, sellersList, categoriesList, loading, error, onClose, onSubmit }) {
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

  return (
    <ModalShell
      title={isEdit ? 'Edit product' : 'Add new product'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} disabled={!canSubmit} onClick={submit}>
            {isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <ModalError>{error}</ModalError>

      <div className="flex flex-col gap-4">
        <div>
          <label className={adminLabelClass}>Product name</label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Cotton Twill Fabric 280 GSM" className={adminFieldClass} />
        </div>

        <div>
          <label className={adminLabelClass}>Store</label>
          <select value={form.sellerId} onChange={set('sellerId')} className={adminFieldClass}>
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
          <label className={adminLabelClass}>Description (optional)</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            placeholder="Describe the product — materials, grade, use case…"
            rows={3}
            className={`${adminFieldClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={adminLabelClass}>Category</label>
            <select value={form.category} onChange={set('category')} className={adminFieldClass} disabled={categoriesList.length === 0}>
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
            <label className={adminLabelClass}>Badge (optional)</label>
            <input type="text" value={form.badge} onChange={set('badge')} placeholder="e.g. Best seller" className={adminFieldClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={adminLabelClass}>Price (Rs)</label>
            <input type="text" inputMode="numeric" value={form.price} onChange={set('price')} placeholder="670" className={adminFieldClass} />
          </div>
          <div>
            <label className={adminLabelClass}>Unit</label>
            <input type="text" value={form.unit} onChange={set('unit')} placeholder="metre" className={adminFieldClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={adminLabelClass}>MOQ</label>
            <input type="text" value={form.moq} onChange={set('moq')} placeholder="500m" className={adminFieldClass} />
          </div>
          <div>
            <label className={adminLabelClass}>Stock (optional)</label>
            <input type="text" inputMode="numeric" value={form.stock} onChange={set('stock')} placeholder="2400" className={adminFieldClass} />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 border border-[var(--admin-border)] rounded-lg p-3.5">
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-[var(--admin-ink)] cursor-pointer">
            <input type="checkbox" checked={form.b2bEnabled} onChange={toggle('b2bEnabled')} className="w-4 h-4 accent-[var(--admin-primary)] cursor-pointer" />
            List this product on the B2B marketplace
          </label>
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-[var(--admin-ink)] cursor-pointer">
            <input type="checkbox" checked={form.freeShipping} onChange={toggle('freeShipping')} className="w-4 h-4 accent-[var(--admin-primary)] cursor-pointer" />
            Free shipping
          </label>
          {form.freeShipping && (
            <label className="flex items-center gap-2.5 text-[13px] text-[var(--admin-ink-soft)] cursor-pointer pl-6">
              <input
                type="checkbox"
                checked={form.worldwideFreeShipping}
                onChange={toggle('worldwideFreeShipping')}
                className="w-4 h-4 accent-[var(--admin-primary)] cursor-pointer"
              />
              Offer it worldwide, not just within the seller's own country
            </label>
          )}
        </div>

        <div>
          <label className={adminLabelClass}>Photos (optional)</label>
          <ProductImagesUploader images={form.images} onChange={setImages} max={MAX_IMAGES} />
        </div>
      </div>
    </ModalShell>
  );
}
