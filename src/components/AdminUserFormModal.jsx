import { useEffect, useState } from 'react';
import { IconClose } from './icons';

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

  const fieldClass =
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-surface text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-[420px] max-h-full overflow-y-auto bg-surface rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">Edit user</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-ink cursor-pointer p-1">
            <IconClose width="18" height="18" />
          </button>
        </div>

        {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Company / account name</label>
            <input type="text" value={form.companyName} onChange={set('companyName')} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="text" value={form.phone} onChange={set('phone')} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Country (optional)</label>
            <input type="text" value={form.country} onChange={set('country')} className={fieldClass} />
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
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
