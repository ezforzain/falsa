import { useEffect, useState } from 'react';
import { ORDER_STATUSES } from '../pages/seller/statusStyles';
import ModalShell, { ModalError, adminFieldClass, adminLabelClass } from './admin/ui/ModalShell';
import Button from './admin/ui/Button';

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

  return (
    <ModalShell
      title="Record a manual order"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} disabled={!canSubmit} onClick={submit}>Add order</Button>
        </>
      }
    >
      <ModalError>{error}</ModalError>

      <div className="flex flex-col gap-4">
        <div>
          <label className={adminLabelClass}>Seller</label>
          <select value={form.sellerId} onChange={set('sellerId')} className={adminFieldClass}>
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
            <label className={adminLabelClass}>Buyer company</label>
            <input type="text" value={form.buyerCompany} onChange={set('buyerCompany')} placeholder="e.g. Al-Noor Traders" className={adminFieldClass} />
          </div>
          <div>
            <label className={adminLabelClass}>Buyer country</label>
            <input type="text" value={form.buyerCountry} onChange={set('buyerCountry')} placeholder="e.g. Pakistan" className={adminFieldClass} />
          </div>
        </div>

        <div>
          <label className={adminLabelClass}>Product name</label>
          <input type="text" value={form.productName} onChange={set('productName')} placeholder="e.g. Cotton Twill Fabric" className={adminFieldClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={adminLabelClass}>Quantity</label>
            <input type="text" inputMode="numeric" value={form.qty} onChange={set('qty')} placeholder="100" className={adminFieldClass} />
          </div>
          <div>
            <label className={adminLabelClass}>Unit price (Rs)</label>
            <input type="text" inputMode="numeric" value={form.unitPrice} onChange={set('unitPrice')} placeholder="670" className={adminFieldClass} />
          </div>
        </div>

        <div>
          <label className={adminLabelClass}>Status</label>
          <select value={form.status} onChange={set('status')} className={adminFieldClass}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </ModalShell>
  );
}
