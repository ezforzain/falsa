import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { categories } from '../../data/mockData';
import Toast from '../../components/Toast';
import DragDropUpload from '../../components/DragDropUpload';
import { fileToDataUrl, validateImageFile } from '../../lib/file';
import { IconCheck, IconShield } from '../../components/icons';

export default function SellerSettings() {
  const { user, updateProfile, resubmitKyc } = useAuth();
  const isCorporate = user.sellerType === 'corporate';
  const [form, setForm] = useState({
    companyName: user.companyName || '',
    phone: user.phone || '',
    country: user.country || 'Pakistan',
    category: user.category || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  const [resubmitFront, setResubmitFront] = useState(null);
  const [resubmitBack, setResubmitBack] = useState(null);
  const [resubmitDocument, setResubmitDocument] = useState(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitError, setResubmitError] = useState(null);
  const [resubmitToastVisible, setResubmitToastVisible] = useState(false);

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

  const submitResubmission = async () => {
    setResubmitLoading(true);
    setResubmitError(null);
    try {
      if (isCorporate) {
        const businessDocument = await fileToDataUrl(resubmitDocument);
        await resubmitKyc({ businessDocument });
        setResubmitDocument(null);
      } else {
        const frontError = validateImageFile(resubmitFront);
        if (frontError) throw new Error(`CNIC front photo: ${frontError}`);
        const backError = validateImageFile(resubmitBack);
        if (backError) throw new Error(`CNIC back photo: ${backError}`);
        const [cnicFront, cnicBack] = await Promise.all([fileToDataUrl(resubmitFront), fileToDataUrl(resubmitBack)]);
        await resubmitKyc({ cnicFront, cnicBack });
        setResubmitFront(null);
        setResubmitBack(null);
      }
      setResubmitToastVisible(true);
    } catch (err) {
      setResubmitError(err.message);
    } finally {
      setResubmitLoading(false);
    }
  };

  const canResubmit = isCorporate ? Boolean(resubmitDocument) : Boolean(resubmitFront && resubmitBack);

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
        <div
          className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${
            user.cnicStatus === 'approved' ? 'bg-green-tint text-green' : 'bg-orange-tint text-orange-text'
          } ${user.cnicStatus === 'rejected' && user.cnicRejectionReason ? 'mb-2' : 'mb-6'}`}
        >
          <IconShield width="13" height="13" strokeWidth="2.2" />
          {user.cnicStatus === 'approved'
            ? isCorporate
              ? 'Business verified'
              : 'CNIC verified'
            : user.cnicStatus === 'rejected'
              ? 'Verification rejected'
              : 'Verification pending'}
        </div>
        {user.cnicStatus === 'rejected' && user.cnicRejectionReason && (
          <p className="text-xs text-orange-text-dark mb-4">{user.cnicRejectionReason}</p>
        )}

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

      {user.cnicStatus === 'rejected' && (
        <div className="bg-white border border-border rounded-2xl p-6 mt-4">
          <h2 className="font-display text-lg font-bold text-ink mb-1">
            {isCorporate ? 'Resubmit business document' : 'Resubmit CNIC documents'}
          </h2>
          <p className="text-sm text-text mb-5">
            {isCorporate
              ? 'Upload a fresh business registration document to go back into the review queue.'
              : 'Upload fresh front and back photos to go back into the review queue.'}
          </p>

          {resubmitError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-5">{resubmitError}</p>}

          {isCorporate ? (
            <div className="mb-5">
              <DragDropUpload label="Business Information Document" required file={resubmitDocument} onFileChange={setResubmitDocument} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className={labelClass}>CNIC front photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setResubmitFront(e.target.files?.[0] || null)}
                  className={`${fieldClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-green-tint file:px-3 file:py-2 file:text-xs file:font-semibold file:text-green`}
                />
                {resubmitFront && <p className="text-[11.5px] text-green mt-1.5 truncate">✓ {resubmitFront.name}</p>}
              </div>
              <div>
                <label className={labelClass}>CNIC back photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setResubmitBack(e.target.files?.[0] || null)}
                  className={`${fieldClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-green-tint file:px-3 file:py-2 file:text-xs file:font-semibold file:text-green`}
                />
                {resubmitBack && <p className="text-[11.5px] text-green mt-1.5 truncate">✓ {resubmitBack.name}</p>}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={submitResubmission}
            disabled={resubmitLoading || !canResubmit}
            className="flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-orange hover:bg-orange-hover text-white font-semibold text-sm py-3 px-7 rounded-full shadow-[0_6px_16px_rgba(201,123,45,0.25)] transition-colors"
          >
            {resubmitLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {resubmitLoading ? 'Submitting…' : 'Resubmit for review'}
          </button>
        </div>
      )}

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
      <Toast message="CNIC resubmitted — your account is now pending review" show={resubmitToastVisible} onHide={() => setResubmitToastVisible(false)} />
    </div>
  );
}
