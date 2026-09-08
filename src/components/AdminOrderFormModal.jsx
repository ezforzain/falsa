import { useEffect, useState } from 'react';
import { IconClose } from './icons';
import { ORDER_STATUSES } from '../pages/seller/statusStyles';

const emptyForm = { sellerId: '', buyerCompany: '', buyerCountry: '', productName: '', qty: '', unitPrice: '', status: 'Pending' };

// Lets an admin record a manual/phone order against any seller — the marketplace doesn't yet
// persist an order automatically at checkout (see checkout.routes.js), so this is also how
// admins seed real order data to test order management with.
export default function AdminOrderFormModal({ open, sellersList, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    onSubmit({
      sellerId: form.sellerId,
      buyerCompany: form.buyerCompany.trim(),
      buyerCountry: form.buyerCountry.trim(),
      productName: form.productName.trim(),
      qty: Number(form.qty),
      unitPrice: Number(form.unitPrice),
      status: form.status,
    });
  };

  const canSubmit =
    form.sellerId &&
    form.buyerCompany.trim() &&
    form.buyerCountry.trim() &&
    form.productName.trim() &&
    Number(form.qty) > 0 &&
    Number(form.unitPrice) > 0;

  const fieldClass =
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-surface text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-[440px] max-h-full overflow-y-auto bg-surface rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">Record a manual order</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-ink cursor-pointer p-1">
            <IconClose width="18" height="18" />
          </button>
        </div>

        {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Seller</label>
            <select value={form.sellerId} onChange={set('sellerId')} className={fieldClass}>
              <option value="" disabled>
                Select a seller…
              </option>
              {sellersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Buyer company</label>
              <input type="text" value={form.buyerCompany} onChange={set('buyerCompany')} placeholder="e.g. Al-Noor Traders" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Buyer country</label>
              <input type="text" value={form.buyerCountry} onChange={set('buyerCountry')} placeholder="e.g. Pakistan" className={fieldClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Product name</label>
            <input type="text" value={form.productName} onChange={set('productName')} placeholder="e.g. Cotton Twill Fabric" className={fieldClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Quantity</label>
              <input type="text" inputMode="numeric" value={form.qty} onChange={set('qty')} placeholder="100" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Unit price (Rs)</label>
              <input type="text" inputMode="numeric" value={form.unitPrice} onChange={set('unitPrice')} placeholder="670" className={fieldClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={set('status')} className={fieldClass}>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
            {loading ? 'Saving…' : 'Add order'}
          </button>
        </div>
      </div>
    </div>
  );
}
