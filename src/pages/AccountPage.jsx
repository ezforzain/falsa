import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfileDrawer } from '../context/ProfileDrawerContext';
import {
  IconUser,
  IconMenu,
  IconMail,
  IconPhone,
  IconPin,
  IconClock,
  IconShield,
  IconCheck,
  IconAlertCircle,
  IconChevronRight,
  IconEdit,
} from '../components/icons';
import VerifiedBadge from '../components/VerifiedBadge';
import AvatarUploader from '../components/AvatarUploader';
import Toast from '../components/Toast';

const ROLE_LABEL = { buyer: 'Buyer', seller: 'Seller', admin: 'Admin' };

function MemberSince({ date }) {
  if (!date) return null;
  const formatted = new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted">
      <IconClock width="13" height="13" />
      Member since {formatted}
    </span>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-cream/60 px-3.5 py-3 min-w-0">
      <span className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0 text-green border border-border/70">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
        <span className="block text-[13.5px] font-medium text-ink truncate">{children}</span>
      </span>
    </div>
  );
}

const fieldClass =
  'w-full px-3.5 py-2.5 border border-border rounded-xl text-[14px] font-sans bg-surface text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
const fieldLabelClass = 'block text-[11.5px] font-semibold text-text-muted uppercase tracking-wide mb-1.5';

// Replaces the read-only info grid in place while active — see PATCH /api/auth/profile
// (server/src/routes/auth.routes.js), which only ever accepts companyName/phone/country/category.
// Email isn't editable here (or on the server route) since it's tied to sign-in and verification.
function ProfileEditForm({ user, updateProfile, onSaved, onCancel }) {
  const [form, setForm] = useState({
    companyName: user.companyName || '',
    phone: user.phone || '',
    country: user.country || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.companyName.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile(form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{error}</p>}

      <div>
        <label className={fieldLabelClass}>Name</label>
        <input type="text" value={form.companyName} onChange={set('companyName')} className={fieldClass} />
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
          onClick={onCancel}
          disabled={saving}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-text-muted hover:text-ink font-semibold text-[13.5px] py-2.5 px-4 rounded-full hover:bg-surface-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Sits under the profile card whenever the signed-in account hasn't clicked the link from its
// verification email yet — see VerifyEmailPage / server's /api/auth/verify-email.
function EmailVerifyNotice({ email, resend }) {
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState(null);

  const handleResend = async () => {
    if (state === 'sending') return;
    setState('sending');
    setError(null);
    try {
      await resend();
      setState('sent');
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  };

  return (
    <div className="mt-4 bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-10px_rgba(0,0,0,0.08)] p-4 sm:p-5 flex gap-3.5 items-start">
      <span className="w-10 h-10 rounded-full bg-orange-tint inline-flex items-center justify-center shrink-0">
        <IconMail width="17" height="17" className="text-orange-text" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-ink m-0">Verify your email</p>
        <p className="text-[12.5px] text-text-muted mt-1 mb-2.5 leading-snug break-words">
          We sent a link to <span className="font-medium text-ink">{email}</span>. Open it to verify your account.
        </p>
        {state === 'sent' ? (
          <p className="text-[12.5px] font-semibold text-green m-0 flex items-center gap-1.5">
            <IconCheck width="13" height="13" /> Email sent — check your inbox.
          </p>
        ) : (
          <a
            onClick={handleResend}
            className={`text-[12.5px] font-semibold text-orange-text cursor-pointer hover:underline underline-offset-2 ${state === 'sending' ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {state === 'sending' ? 'Sending…' : 'Resend verification email'}
          </a>
        )}
        {state === 'error' && <p className="text-[12px] text-orange-text mt-1.5 mb-0">{error}</p>}
      </div>
    </div>
  );
}

// Seller-only — mirrors the review states set by the admin's "Seller ID Verification" queue
// (server/src/routes/admin.routes.js PATCH /kyc/:userId). Approving there also flips the
// account's public "Verified Store" badge automatically, so `verified` and `cnicStatus` stay in
// lockstep here without this component needing to reconcile them itself.
const KYC_STATUS_META = {
  approved: {
    icon: IconCheck,
    iconBg: 'bg-green-tint',
    iconColor: 'text-green',
    title: 'Identity verified',
    body: 'Your seller ID documents have been reviewed and approved.',
  },
  pending: {
    icon: IconClock,
    iconBg: 'bg-orange-tint',
    iconColor: 'text-orange-text',
    title: 'Verification in review',
    body: "We're reviewing your submitted documents. This usually takes 1–2 business days.",
  },
  rejected: {
    icon: IconAlertCircle,
    iconBg: 'bg-orange-tint',
    iconColor: 'text-orange-text',
    title: 'Verification needs attention',
    body: 'Your submitted documents couldn’t be approved. Resubmit them to try again.',
  },
};

function SellerVerificationCard({ cnicStatus }) {
  const meta = KYC_STATUS_META[cnicStatus];
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <Link
      to="/seller/settings"
      className="mt-4 bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-10px_rgba(0,0,0,0.08)] p-4 sm:p-5 flex items-center gap-3.5 no-underline text-inherit hover:border-green/40 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-8px_rgba(14,90,70,0.16)] transition-all group"
    >
      <span className={`w-10 h-10 rounded-full ${meta.iconBg} inline-flex items-center justify-center shrink-0`}>
        <Icon width="17" height="17" className={meta.iconColor} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-ink m-0">{meta.title}</p>
        <p className="text-[12.5px] text-text-muted mt-0.5 mb-0 leading-snug">{meta.body}</p>
      </div>
      <IconChevronRight width="16" height="16" className="text-text-muted shrink-0 group-hover:translate-x-0.5 group-hover:text-green transition-all" />
    </Link>
  );
}

// "My Profile" — just the profile itself now. Orders, seller tools, settings, support, and
// sign-out all moved into the Facebook-style account menu — see AccountMenuContent. The
// trigger for it only ever appears here: Header's hamburger only renders while viewing this
// page (desktop), and this page renders bare on mobile (no Header at all — see MainLayout's
// bare-route list), so it needs its own trigger too, rather than relying on the bottom nav.
export default function AccountPage() {
  const { user, isAuthenticated, resendVerificationEmail, updateProfile } = useAuth();
  const { open: openAccountMenu } = useProfileDrawer();
  const [editing, setEditing] = useState(false);
  const [savedToastVisible, setSavedToastVisible] = useState(false);

  const TopBar = (
    <div className="flex items-center justify-between gap-3 mb-1.5">
      <h1 className="font-display text-[26px] sm:text-[28px] font-bold m-0 tracking-tight">My Profile</h1>
      <button
        type="button"
        onClick={openAccountMenu}
        aria-label="Account menu"
        aria-haspopup="dialog"
        className="md:hidden cursor-pointer w-10 h-10 rounded-lg flex items-center justify-center text-text hover:bg-surface-muted active:scale-95 transition-all shrink-0"
      >
        <IconMenu />
      </button>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
        <div className="max-w-[640px] mx-auto">
          {TopBar}
          <div className="text-center py-14 sm:py-[60px] px-6 bg-surface border border-border rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-8px_rgba(0,0,0,0.08)]">
            <span className="w-16 h-16 rounded-full bg-green-tint inline-flex items-center justify-center mb-5">
              <IconUser width="24" height="24" className="text-green" />
            </span>
            <p className="text-[17px] font-bold text-ink mb-1.5 font-display tracking-tight">You're not signed in</p>
            <p className="text-sm text-text-muted mb-7 max-w-[280px] mx-auto leading-relaxed">
              Sign in to view your account, orders, and saved stores.
            </p>
            <Link
              to="/auth"
              className="cursor-pointer inline-flex items-center gap-2 bg-green hover:bg-green-hover active:translate-y-0 text-white font-semibold text-sm px-7 py-3.5 rounded-full no-underline shadow-[0_8px_20px_rgba(14,90,70,0.25)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(14,90,70,0.3)] transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isSeller = user.role === 'seller';

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <div className="max-w-[640px] mx-auto">
        {TopBar}
        <p className="text-sm text-text-muted mb-6 flex items-center gap-1.5 flex-wrap">
          Orders, settings, and more now live in the account menu
          <IconMenu width="14" height="14" className="text-text-muted" />
          — tap it above.
        </p>

        <div className="bg-surface border border-border rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_36px_-12px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Brand banner — the avatar overlaps its bottom edge, giving the card a proper
              "profile" hero treatment instead of sitting flush in a flat box. */}
          <div className="relative h-20 sm:h-24 bg-gradient-to-br from-green-deep via-green to-green-hover overflow-hidden">
            <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit profile"
                title="Edit profile"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 cursor-pointer flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-[12.5px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
              >
                <IconEdit width="13" height="13" />
                Edit
              </button>
            )}
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-10 sm:-mt-12 text-center sm:text-left">
              <AvatarUploader size={88} avatarClassName="ring-[5px] ring-surface" />
              <div className="min-w-0 flex-1 w-full sm:pb-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <p className="font-display text-[19px] sm:text-[22px] font-bold text-ink truncate m-0 tracking-tight max-w-full">
                    {user.companyName}
                  </p>
                  {isSeller && user.verified && <VerifiedBadge size={17} />}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-green bg-green-tint px-2.5 py-1 rounded-full">
                    {isSeller && <IconShield width="11" height="11" />}
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                  <MemberSince date={user.createdAt} />
                </div>
              </div>
            </div>

            <div className="h-px bg-border my-6" />

            {editing ? (
              <ProfileEditForm
                user={user}
                updateProfile={updateProfile}
                onSaved={() => {
                  setEditing(false);
                  setSavedToastVisible(true);
                }}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.email && (
                  <InfoRow icon={<IconMail width="14" height="14" />} label="Email">
                    {user.email}
                  </InfoRow>
                )}
                {user.phone && (
                  <InfoRow icon={<IconPhone width="14" height="14" />} label="Phone">
                    {user.phone}
                  </InfoRow>
                )}
                {user.country && (
                  <InfoRow icon={<IconPin width="14" height="14" />} label="Country">
                    {user.country}
                  </InfoRow>
                )}
              </div>
            )}
          </div>
        </div>

        {!user.emailVerified && <EmailVerifyNotice email={user.email} resend={resendVerificationEmail} />}
        {isSeller && <SellerVerificationCard cnicStatus={user.cnicStatus} />}
      </div>

      <Toast message="Profile updated" show={savedToastVisible} onHide={() => setSavedToastVisible(false)} />
    </main>
  );
}
