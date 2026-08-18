import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfileDrawer } from '../context/ProfileDrawerContext';
import { IconUser, IconMenu, IconMail, IconPhone, IconPin, IconClock, IconShield, IconCheck, IconAlertCircle, IconChevronRight } from '../components/icons';
import VerifiedBadge from '../components/VerifiedBadge';
import AvatarUploader from '../components/AvatarUploader';

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

function InfoRow({ icon, children }) {
  return (
    <div className="flex items-center gap-2.5 text-[13.5px] text-text-muted min-w-0">
      <span className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center shrink-0 text-text-muted">
        {icon}
      </span>
      <span className="truncate">{children}</span>
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
    <div className="mt-4 bg-surface border border-orange-tint rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex gap-3.5 items-start">
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
            className={`text-[12.5px] font-semibold text-orange-text cursor-pointer hover:underline ${state === 'sending' ? 'opacity-60 pointer-events-none' : ''}`}
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
      className="mt-4 bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex items-center gap-3.5 no-underline text-inherit hover:border-border-strong transition-colors group"
    >
      <span className={`w-10 h-10 rounded-full ${meta.iconBg} inline-flex items-center justify-center shrink-0`}>
        <Icon width="17" height="17" className={meta.iconColor} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-ink m-0">{meta.title}</p>
        <p className="text-[12.5px] text-text-muted mt-0.5 mb-0 leading-snug">{meta.body}</p>
      </div>
      <IconChevronRight width="16" height="16" className="text-text-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// "My Profile" — just the profile itself now. Orders, seller tools, settings, support, and
// sign-out all moved into the Facebook-style account menu — see AccountMenuContent. The
// trigger for it only ever appears here: Header's hamburger only renders while viewing this
// page (desktop), and this page renders bare on mobile (no Header at all — see MainLayout's
// bare-route list), so it needs its own trigger too, rather than relying on the bottom nav.
export default function AccountPage() {
  const { user, isAuthenticated, resendVerificationEmail } = useAuth();
  const { open: openAccountMenu } = useProfileDrawer();

  const TopBar = (
    <div className="flex items-center justify-between gap-3 mb-1.5">
      <h1 className="font-display text-[28px] font-bold m-0 tracking-tight">My Profile</h1>
      <button
        type="button"
        onClick={openAccountMenu}
        aria-label="Account menu"
        aria-haspopup="dialog"
        className="md:hidden cursor-pointer w-10 h-10 rounded-lg flex items-center justify-center text-text hover:bg-surface-muted transition-colors shrink-0"
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
          <div className="text-center py-[60px] px-5 bg-surface border border-dashed border-border-strong rounded-2xl">
            <span className="w-14 h-14 rounded-full bg-surface-muted inline-flex items-center justify-center mb-5">
              <IconUser width="22" height="22" className="text-text-muted" />
            </span>
            <p className="text-[16px] font-semibold text-ink mb-1.5">You're not signed in</p>
            <p className="text-sm text-text-muted mb-6">Sign in to view your account, orders, and saved stores.</p>
            <Link
              to="/auth"
              className="cursor-pointer inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-[26px] py-3 rounded-full no-underline transition-colors"
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
        <p className="text-sm text-text-muted mb-7 flex items-center gap-1.5 flex-wrap">
          Orders, settings, and more now live in the account menu
          <IconMenu width="14" height="14" className="text-text-muted" />
          — tap it above.
        </p>

        <div className="bg-surface border border-border rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-8px_rgba(0,0,0,0.08)] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6 text-center sm:text-left">
            <AvatarUploader size={84} avatarClassName="ring-4 ring-cream" />
            <div className="min-w-0 flex-1 w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <p className="font-display text-[19px] sm:text-[21px] font-bold text-ink truncate m-0 tracking-tight max-w-full">
                  {user.companyName}
                </p>
                {isSeller && user.verified && <VerifiedBadge size={17} />}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wide text-green bg-green-tint px-2.5 py-1 rounded-full">
                  {isSeller && <IconShield width="11" height="11" />}
                  {ROLE_LABEL[user.role] || user.role}
                </span>
                <MemberSince date={user.createdAt} />
              </div>
            </div>
          </div>

          <div className="h-px bg-border my-6" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
            {user.email && <InfoRow icon={<IconMail width="14" height="14" />}>{user.email}</InfoRow>}
            {user.phone && <InfoRow icon={<IconPhone width="14" height="14" />}>{user.phone}</InfoRow>}
            {user.country && <InfoRow icon={<IconPin width="14" height="14" />}>{user.country}</InfoRow>}
          </div>
        </div>

        {!user.emailVerified && <EmailVerifyNotice email={user.email} resend={resendVerificationEmail} />}
        {isSeller && <SellerVerificationCard cnicStatus={user.cnicStatus} />}
      </div>
    </main>
  );
}
