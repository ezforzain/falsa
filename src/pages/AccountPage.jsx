import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfileDrawer } from '../context/ProfileDrawerContext';
import { myOrders, messages } from '../lib/api';
import {
  IconUser,
  IconSettings,
  IconMail,
  IconClock,
  IconShield,
  IconEdit,
  IconBox,
  IconMessageCircle,
  IconPin,
  IconKey,
  IconHelpCircle,
  IconChevronRight,
  IconReceipt,
  IconGift,
  IconStore,
} from '../components/icons';
import VerifiedBadge from '../components/VerifiedBadge';
import AvatarUploader from '../components/AvatarUploader';
import EditProfileSheet from '../components/EditProfileSheet';
import Toast from '../components/Toast';
import logoMark from '../assets/logo-mark.png';

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

// Sits under the profile card whenever the signed-in account hasn't entered the code from its
// verification email yet — see server's PATCH /api/auth/verify-email/otp. A 6-digit code typed
// right here (WhatsApp/Facebook-style) rather than a link to click elsewhere.
function EmailVerifyNotice({ email, resend, verify }) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent | error
  const [resendError, setResendError] = useState(null);

  const handleVerify = async () => {
    if (verifying || code.trim().length !== 6) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      await verify(code.trim());
    } catch (err) {
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendState === 'sending') return;
    setResendState('sending');
    setResendError(null);
    try {
      await resend();
      setResendState('sent');
    } catch (err) {
      setResendError(err.message);
      setResendState('error');
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
          Enter the 6-digit code we sent to <span className="font-medium text-ink">{email}</span>.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            placeholder="000000"
            className="w-[104px] px-3.5 py-2 border border-border rounded-xl text-[15px] font-semibold tracking-[3px] text-center outline-none focus:border-green bg-surface-muted"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || code.trim().length !== 6}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-green hover:bg-green-hover text-white font-semibold text-[12.5px] px-4 py-2 rounded-xl transition-colors"
          >
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
        </div>
        {verifyError && <p className="text-[12px] text-orange-text mt-1.5 mb-0">{verifyError}</p>}

        <div className="mt-2">
          {resendState === 'sent' ? (
            <p className="text-[12.5px] font-semibold text-green m-0">Code sent — check your inbox.</p>
          ) : (
            <a
              onClick={handleResend}
              className={`text-[12.5px] font-semibold text-orange-text cursor-pointer hover:underline underline-offset-2 ${resendState === 'sending' ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {resendState === 'sending' ? 'Sending…' : "Didn't get a code? Resend"}
            </a>
          )}
          {resendState === 'error' && <p className="text-[12px] text-orange-text mt-1.5 mb-0">{resendError}</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="flex-1 flex items-center gap-2.5 bg-surface border border-border rounded-2xl px-3.5 py-3 min-w-0">
      <span className="w-9 h-9 rounded-xl bg-green-tint text-green flex items-center justify-center shrink-0">
        <Icon width="16" height="16" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[19px] font-bold text-ink m-0 leading-none">{value}</p>
        <p className="text-[11.5px] text-text-muted mt-1 mb-0 leading-tight whitespace-nowrap">{label}</p>
      </div>
    </div>
  );
}

// One row of the inline account menu (Personal Information / Addresses / Security / Help &
// Support) — either a real route (`to`) or an in-page action (`onClick`, e.g. opening
// EditProfileSheet), same MenuRow shape/behavior as AccountMenuContent's drawer version so
// nothing here duplicates a second, drifting implementation of "what these items do".
function MenuLinkRow({ icon: Icon, label, subtitle, to, onClick }) {
  const className =
    'flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-surface border border-border no-underline text-inherit cursor-pointer hover:border-green/40 hover:bg-surface-muted active:scale-[0.99] transition-all w-full text-left';
  const content = (
    <>
      <span className="w-10 h-10 rounded-xl bg-green-tint text-green flex items-center justify-center shrink-0">
        <Icon width="17" height="17" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold text-ink truncate">{label}</span>
        {subtitle && <span className="block text-[12px] text-text-muted mt-0.5 truncate">{subtitle}</span>}
      </span>
      <IconChevronRight width="16" height="16" className="text-text-muted shrink-0" />
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

// The buyer/seller/admin Account page — profile header, real order/chat stats, quick actions,
// an inline account menu, and a My Orders shortcut, all built from the actual signed-in user's
// data (AuthContext) and real endpoints (myOrders, messages) rather than anything hardcoded.
// Settings, seller/admin tools, notifications, and sign-out still live one level deeper in the
// account menu (AccountMenuContent) — the gear button below opens the same drawer/dropdown used
// everywhere else, so that logic isn't duplicated here.
export default function AccountPage() {
  const { user, isAuthenticated, resendVerificationEmail, verifyEmailOtp } = useAuth();
  const { open: openAccountMenu } = useProfileDrawer();
  const [editOpen, setEditOpen] = useState(false);
  const [savedToastVisible, setSavedToastVisible] = useState(false);
  const [orders, setOrders] = useState([]);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    myOrders
      .list()
      .then((res) => {
        if (!cancelled) setOrders(res.orders);
      })
      .catch(() => {
        // Non-critical — the Total Orders stat just shows 0.
      });
    messages
      .conversations()
      .then(({ conversations }) => {
        if (!cancelled) setChatCount(conversations.length);
      })
      .catch(() => {
        // Non-critical — the Active Chats stat just shows 0.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const TopBar = (
    <>
      {/* Mobile: this page renders bare (no Header — see MainLayout's bare-route list), so it
          carries its own logo + a settings trigger opening the same account menu Header's
          desktop dropdown uses. */}
      <div className="md:hidden flex items-center justify-between gap-3 mb-5">
        <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
          <img src={logoMark} alt="" className="w-9 h-9 object-contain" />
          <span className="font-display text-[21px] font-bold text-green tracking-tight">Falsafah</span>
        </Link>
        <button
          type="button"
          onClick={openAccountMenu}
          aria-label="Account menu"
          aria-haspopup="dialog"
          className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center text-ink-soft bg-surface border border-border hover:bg-surface-muted active:scale-95 transition-all shrink-0"
        >
          <IconSettings width="18" height="18" />
        </button>
      </div>
      <h1 className="hidden md:block font-display text-[28px] font-bold m-0 mb-6 tracking-tight text-ink">
        My Profile
      </h1>
    </>
  );

  if (!isAuthenticated) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-9 pb-20 animate-fade-up">
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
  const isAdmin = user.role === 'admin';

  // Same "give sellers/admins their real portal instead of an upsell" logic as
  // AccountMenuContent's growthItems — kept in sync deliberately rather than importing from
  // there, since this button's copy/icon differ slightly from that drawer's row.
  const growthAction = isAdmin
    ? { label: 'Admin Panel', to: '/admin', icon: IconShield }
    : isSeller
      ? { label: 'Seller Portal', to: '/seller', icon: IconStore }
      : { label: 'Become a Seller', to: '/auth?screen=signup&role=seller', icon: IconGift };

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-9 pb-20 animate-fade-up">
      <div className="max-w-[640px] mx-auto">
        {TopBar}

        {/* Profile card */}
        <div className="bg-surface border border-border rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_36px_-12px_rgba(0,0,0,0.12)] p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <AvatarUploader size={80} showActions={false} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display text-[19px] sm:text-[21px] font-bold text-ink truncate m-0 tracking-tight">
                  {user.companyName}
                </p>
                {isSeller && user.verified && <VerifiedBadge size={16} />}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-green bg-green-tint px-2.5 py-1 rounded-full">
                  {isSeller && <IconShield width="10" height="10" />}
                  {ROLE_LABEL[user.role] || user.role}
                </span>
              </div>
              <div className="mt-1.5">
                <MemberSince date={user.createdAt} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label="Edit profile"
              className="shrink-0 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-green hover:bg-surface-muted transition-colors"
            >
              <IconChevronRight width="18" height="18" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <StatCard icon={IconBox} value={orders.length} label="Total Orders" />
            <StatCard icon={IconMessageCircle} value={chatCount} label="Active Chats" />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-green hover:bg-green-hover active:translate-y-0 text-white font-semibold text-[13.5px] py-2.5 px-4 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] hover:-translate-y-0.5 transition-all"
            >
              <IconEdit width="13" height="13" />
              Edit Profile
            </button>
            <Link
              to={growthAction.to}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-green-tint hover:brightness-95 text-green font-semibold text-[13.5px] py-2.5 px-4 rounded-full border border-green-tint-border no-underline transition-all"
            >
              <growthAction.icon width="13" height="13" />
              {growthAction.label}
            </Link>
          </div>
        </div>

        {/* Account menu */}
        <div className="mt-5 flex flex-col gap-2.5">
          <MenuLinkRow
            icon={IconUser}
            label="Personal Information"
            subtitle="Name, email, phone number"
            onClick={() => setEditOpen(true)}
          />
          <MenuLinkRow icon={IconPin} label="Addresses" subtitle="Manage your shipping addresses" to="/addresses" />
          <MenuLinkRow icon={IconKey} label="Security" subtitle="Password and login settings" to="/account-center" />
          <MenuLinkRow icon={IconHelpCircle} label="Help & Support" subtitle="Get help or contact us" to="/help" />
        </div>

        {/* My Orders */}
        <Link
          to="/orders"
          className="mt-5 flex items-center gap-3.5 bg-surface border border-border rounded-2xl px-4 py-4 no-underline text-inherit hover:border-green/40 hover:bg-surface-muted transition-all"
        >
          <span className="w-10 h-10 rounded-xl bg-green-tint text-green flex items-center justify-center shrink-0">
            <IconReceipt width="17" height="17" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-semibold text-ink">My Orders</span>
            <span className="block text-[12px] text-text-muted mt-0.5">View and track your orders</span>
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 text-[12.5px] font-semibold text-green">
            View All
            <IconChevronRight width="14" height="14" />
          </span>
        </Link>

        {!user.emailVerified && (
          <EmailVerifyNotice email={user.email} resend={resendVerificationEmail} verify={verifyEmailOtp} />
        )}
      </div>

      <EditProfileSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          setSavedToastVisible(true);
        }}
      />

      <Toast message="Profile updated" show={savedToastVisible} onHide={() => setSavedToastVisible(false)} />
    </main>
  );
}
