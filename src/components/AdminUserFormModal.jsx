import { useEffect, useState } from 'react';
import ModalShell, { ModalError, adminFieldClass, adminLabelClass } from './admin/ui/ModalShell';
import Button from './admin/ui/Button';

const emptyForm = { companyName: '', email: '', phone: '', country: '' };

// Mirrors AdminProductFormModal's structure — edits basic account fields only. Role changes are
// intentionally excluded: a seller account depends on sellerId/KYC state that this form doesn't
// manage, so flipping role here would leave those in an inconsistent state.
export default function AdminUserFormModal({ open, user, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      user
        ? {
            companyName: user.companyName || '',
            email: user.email || '',
            phone: user.phone || '',
            country: user.country || '',
          }
        : emptyForm
    );
  }, [open, user]);

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
      companyName: form.companyName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      country: form.country.trim() || null,
    });
  };

  const canSubmit = form.companyName.trim() && form.email.trim();

  return (
    <ModalShell
      title="Edit user"
      maxWidth={420}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} disabled={!canSubmit} onClick={submit}>Save changes</Button>
        </>
      }
    >
      <ModalError>{error}</ModalError>

      <div className="flex flex-col gap-4">
        <div>
          <label className={adminLabelClass}>Company / account name</label>
          <input type="text" value={form.companyName} onChange={set('companyName')} className={adminFieldClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Email</label>
          <input type="email" value={form.email} onChange={set('email')} className={adminFieldClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Phone</label>
          <input type="text" value={form.phone} onChange={set('phone')} className={adminFieldClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Country (optional)</label>
          <input type="text" value={form.country} onChange={set('country')} className={adminFieldClass} />
        </div>
      </div>
    </ModalShell>
  );
}
