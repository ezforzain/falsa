import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { seller } from '../../lib/api';
import { isValidPkMobile } from '../../lib/shipping';
import Toast from '../../components/Toast';
import { IconCheck } from '../../components/icons';
import CategoryPicker from '../../components/CategoryPicker';
import SellerCard from '../../components/seller/SellerCard';

export default function SellerSettings() {
  const { user, updateProfile, applyUserUpdate } = useAuth();
  const [form, setForm] = useState({
    companyName: user.companyName || '',
    phone: user.phone || '',
    country: user.country || 'Pakistan',
    category: user.category || '',
    address: user.address || '',
    city: user.city || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  const [bankForm, setBankForm] = useState({
    bankName: user.bankName || '',
    accountTitle: user.accountTitle || '',
    accountNumber: user.accountNumber || '',
    iban: user.iban || '',
  });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState(null);
  const [bankToastVisible, setBankToastVisible] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setBank = (key) => (e) => setBankForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.companyName.trim()) {
      setError('Business name is required.');
      return;
    }
    if (form.phone.trim() && !isValidPkMobile(form.phone)) {
      setError('Phone number must be an 11-digit mobile number like 03001234567 — this is what TCS uses for pickup.');
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

  const submitBank = async () => {
    if (!bankForm.bankName.trim() || !bankForm.accountTitle.trim() || !bankForm.accountNumber.trim() || !bankForm.iban.trim()) {
      setBankError('Please fill in all four fields — this is what Falsafah needs to pay you out.');
      return;
    }
    setBankLoading(true);
    setBankError(null);
    try {
      const { user: updated } = await seller.updateBankDetails(bankForm);
      applyUserUpdate(updated);
      setBankToastVisible(true);
    } catch (err) {
      setBankError(err.message);
    } finally {
      setBankLoading(false);
    }
  };

  const fieldClass =
    'w-full px-[16px] py-[12px] border border-border rounded-xl text-[14.5px] font-sans bg-surface-muted text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(59,111,224,0.12)] transition-shadow';
  const labelClass = 'block text-[13px] font-semibold text-ink-soft mb-2';

  return (
    <div className="animate-fade-up max-w-[760px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SellerCard eyebrow="Business profile">
          {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Business / factory name</label>
              <input type="text" value={form.companyName} onChange={set('companyName')} className={fieldClass} />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Email</label>
              <input type="text" value={user.email} disabled className={`${fieldClass} opacity-60 cursor-not-allowed`} />
            </div>

            <div>
              <label className={labelClass}>Phone number *</label>
              <input type="text" value={form.phone} onChange={set('phone')} placeholder="+92 300 0000000" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" value={form.country} onChange={set('country')} className={fieldClass} />
            </div>

            <div className="col-span-2">
              <CategoryPicker
                value={form.category}
                onChange={(name) => setForm((f) => ({ ...f, category: name }))}
                fieldClass={fieldClass}
                labelClass={labelClass}
                label="Main product category"
              />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Pickup address</label>
              <input type="text" value={form.address} onChange={set('address')} placeholder="Shop / warehouse address" className={fieldClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Pickup city *</label>
              <input type="text" value={form.city} onChange={set('city')} placeholder="e.g. Karachi" className={fieldClass} />
              <p className="text-[11.5px] text-text mt-1">Required to ship with Falsafah — this is where TCS collects the parcel from.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-2.5 rounded-full shadow-[0_6px_16px_rgba(59,111,224,0.25)] transition-colors"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </SellerCard>

        <div className="flex flex-col gap-4">
          <SellerCard eyebrow="Bank details">
            <p className="text-[12.5px] text-text mb-3 -mt-2">Required to ship with Falsafah — this is how payouts reach you.</p>

            {bankError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-3">{bankError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Bank name</label>
                <input type="text" value={bankForm.bankName} onChange={setBank('bankName')} placeholder="e.g. Meezan Bank" className={fieldClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Account title</label>
                <input type="text" value={bankForm.accountTitle} onChange={setBank('accountTitle')} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Account number</label>
                <input type="text" value={bankForm.accountNumber} onChange={setBank('accountNumber')} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>IBAN</label>
                <input type="text" value={bankForm.iban} onChange={setBank('iban')} placeholder="PK00XXXX0000000000000000" className={fieldClass} />
              </div>
            </div>

            <button
              type="button"
              onClick={submitBank}
              disabled={bankLoading}
              className="mt-4 w-full flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-2.5 rounded-full shadow-[0_6px_16px_rgba(59,111,224,0.25)] transition-colors"
            >
              {bankLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              )}
              {bankLoading ? 'Saving…' : 'Save bank details'}
            </button>
          </SellerCard>

          <div className="flex items-start gap-2.5 bg-surface border border-border rounded-2xl p-4">
            <span className="w-7 h-7 rounded-lg bg-green-tint flex items-center justify-center shrink-0">
              <IconCheck width="13" height="13" className="text-green" />
            </span>
            <p className="text-[12.5px] text-text leading-relaxed">
              Your role is <strong className="text-ink-soft">Seller</strong>. Contact support to change your account type.
            </p>
          </div>
        </div>
      </div>

      <Toast message="Profile updated successfully" show={toastVisible} onHide={() => setToastVisible(false)} />
      <Toast message="Bank details saved" show={bankToastVisible} onHide={() => setBankToastVisible(false)} />
    </div>
  );
}
