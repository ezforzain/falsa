import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { categories } from '../../data/mockData';
import Toast from '../../components/Toast';
import { IconCheck } from '../../components/icons';

export default function SellerSettings() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    companyName: user.companyName || '',
    phone: user.phone || '',
    country: user.country || 'Pakistan',
    category: user.category || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.companyName.trim()) {
      setError('Business name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateProfile(form);
      setToastVisible(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full px-[16px] py-[12px] border border-border rounded-xl text-[14.5px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const labelClass = 'block text-[13px] font-semibold text-ink-soft mb-2';

  return (
    <div className="animate-fade-up max-w-[560px]">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Business settings</h1>
        <p className="text-sm text-text mt-1">Keep your business profile up to date for buyers.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6">
        {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-5">{error}</p>}

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Business / factory name</label>
            <input type="text" value={form.companyName} onChange={set('companyName')} className={fieldClass} />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="text" value={user.email} disabled className={`${fieldClass} bg-surface-muted text-text-muted cursor-not-allowed`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone number</label>
              <input type="text" value={form.phone} onChange={set('phone')} placeholder="+92 300 0000000" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" value={form.country} onChange={set('country')} className={fieldClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Main product category</label>
            <select value={form.category} onChange={set('category')} className={fieldClass}>
              <option value="">Not set</option>
              {categories.map((c) => (
                <option key={c.key} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 px-7 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
          )}
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="flex items-start gap-3 bg-white border border-border rounded-2xl p-5 mt-4">
        <span className="w-8 h-8 rounded-lg bg-green-tint flex items-center justify-center shrink-0">
          <IconCheck width="15" height="15" className="text-green" />
        </span>
        <p className="text-[13px] text-text leading-relaxed">
          Your role is <strong className="text-ink-soft">Seller</strong>. To change your account type, contact support — role
          switching isn't available from this screen.
        </p>
      </div>

      <Toast message="Profile updated successfully" show={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}
