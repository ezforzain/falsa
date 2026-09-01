import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BannerUploader from './BannerUploader';
import AvatarUploader from './AvatarUploader';
import { IconClose } from './icons';

const fieldClass =
  'w-full px-3.5 py-2.5 border border-border rounded-xl text-[14px] font-sans bg-surface text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
const fieldLabelClass = 'block text-[11.5px] font-semibold text-text-muted uppercase tracking-wide mb-1.5';
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

// The one place every editable piece of the TikTok-style profile hero lives together — banner,
// avatar, display name, and @handle — instead of the old inline name/phone/country form. Opened
// from the "Edit Profile" button on AccountPage; banner/avatar changes save themselves instantly
// (see BannerUploader/AvatarUploader), while name/handle/phone/country batch into one
// PATCH /api/auth/profile on Save, same as before.
export default function EditProfileSheet({ open, onClose, onSaved }) {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ companyName: '', handle: '', phone: '', country: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      companyName: user.companyName || '',
      handle: user.handle || '',
      phone: user.phone || '',
      country: user.country || '',
    });
    setError(null);
  }, [open, user]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.companyName.trim()) {
      setError('Name is required.');
      return;
    }
    const normalizedHandle = form.handle.trim().toLowerCase();
    if (normalizedHandle && !HANDLE_RE.test(normalizedHandle)) {
      setError('Handle must be 3-20 characters: lowercase letters, numbers, underscores only.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        companyName: form.companyName,
        phone: form.phone,
        country: form.country,
        ...(normalizedHandle ? { handle: normalizedHandle } : {}),
      });
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={saving ? undefined : onClose} />
      <div className="relative w-full sm:max-w-[480px] max-h-[92vh] overflow-y-auto bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 animate-slide-up sm:animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">Edit profile</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="cursor-pointer disabled:cursor-not-allowed text-text-muted hover:text-ink p-1"
          >
            <IconClose width="18" height="18" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <BannerUploader />

          <div className="flex justify-center -mt-14">
            <AvatarUploader size={80} avatarClassName="ring-[4px] ring-surface" />
          </div>

          {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{error}</p>}

          <div>
            <label className={fieldLabelClass}>Name</label>
            <input type="text" value={form.companyName} onChange={set('companyName')} className={fieldClass} />
          </div>

          <div>
            <label className={fieldLabelClass}>Handle</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[14px] font-medium pointer-events-none">@</span>
              <input
                type="text"
                value={form.handle}
                onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value.toLowerCase() }))}
                placeholder="yourhandle"
                maxLength={20}
                className={`${fieldClass} pl-7`}
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1">3-20 characters: lowercase letters, numbers, underscores.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={fieldLabelClass}>Phone</label>
              <input type="text" value={form.phone} onChange={set('phone')} placeholder="+92 300 0000000" className={fieldClass} />
            </div>
            <div>
              <label className={fieldLabelClass}>Country</label>
              <input type="text" value={form.country} onChange={set('country')} className={fieldClass} />
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-1">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover active:translate-y-0 text-white font-semibold text-[13.5px] py-2.5 px-5 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] hover:-translate-y-0.5 transition-all"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              )}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-text-muted hover:text-ink font-semibold text-[13.5px] py-2.5 px-4 rounded-full hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
