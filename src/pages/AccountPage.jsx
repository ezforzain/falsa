import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfileDrawer } from '../context/ProfileDrawerContext';
import { myOrders } from '../lib/api';
import { computeLoyaltyTier } from '../lib/loyalty';
import {
  IconUser,
  IconMenu,
  IconMail,
  IconPhone,
  IconPin,
  IconClock,
  IconShield,
  IconEdit,
} from '../components/icons';
import VerifiedBadge from '../components/VerifiedBadge';
import Avatar from '../components/Avatar';
import EditProfileSheet from '../components/EditProfileSheet';
import LoyaltyBadge from '../components/LoyaltyBadge';
import OrderStatusQuickLinks from '../components/OrderStatusQuickLinks';
import ProfileViewHistoryRail from '../components/ProfileViewHistoryRail';
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
            Email sent — check your inbox.
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

// "My Profile" — a TikTok-style hero (banner, centered avatar, name, @handle, a loyalty badge
// driven by real order history) plus a Daraz-style order-status shortcut row and a YouTube-style
// "Recently Viewed" history rail. Orders, seller tools, settings, support, and sign-out all live
// in the Facebook-style account menu — see AccountMenuContent. The trigger for it only ever
// appears here: Header's hamburger only renders while viewing this page (desktop), and this page
// renders bare on mobile (no Header at all — see MainLayout's bare-route list), so it needs its
// own trigger too, rather than relying on the bottom nav.
export default function AccountPage() {
  const { user, isAuthenticated, resendVerificationEmail } = useAuth();
  const { open: openAccountMenu } = useProfileDrawer();
  const [editOpen, setEditOpen] = useState(false);
  const [savedToastVisible, setSavedToastVisible] = useState(false);
  const [orders, setOrders] = useState([]);

  // Powers both the loyalty badge (delivered-order count/spend, see lib/loyalty.js) and the
  // order-status quick links below it — one fetch for both.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    myOrders
      .list()
      .then((res) => {
        if (!cancelled) setOrders(res.orders);
      })
      .catch(() => {
        // Non-critical — the loyalty badge and quick links just show as empty/new.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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
  const tier = computeLoyaltyTier(orders);

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <div className="max-w-[640px] mx-auto">
        {TopBar}
        <p className="text-sm text-text-muted mb-6 flex items-center gap-1.5 flex-wrap">
          Settings, support, and sign-out live in the account menu
          <IconMenu width="14" height="14" className="text-text-muted" />
          — tap it above.
        </p>

        <div className="bg-surface border border-border rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_36px_-12px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Brand banner — the avatar overlaps its bottom edge, TikTok-style, instead of sitting
              flush in a flat box. Shows the account's own uploaded banner once set (see
              BannerUploader inside EditProfileSheet), otherwise the same green gradient as before. */}
          <div className="relative h-28 sm:h-36 bg-gradient-to-br from-green-deep via-green to-green-hover overflow-hidden">
            {user.bannerUrl ? (
              <img src={user.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-16 left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              </>
            )}
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8 flex flex-col items-center text-center -mt-11 sm:-mt-12">
            <Avatar src={user.avatarUrl} size={92} iconSize={40} className="ring-[5px] ring-surface" />

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <p className="font-display text-[20px] sm:text-[22px] font-bold text-ink truncate m-0 tracking-tight max-w-full">
                {user.companyName}
              </p>
              {isSeller && user.verified && <VerifiedBadge size={17} />}
            </div>
            {user.handle && <p className="text-[13px] text-text-muted mt-0.5">@{user.handle}</p>}

            <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-green bg-green-tint px-2.5 py-1 rounded-full">
                {isSeller && <IconShield width="11" height="11" />}
                {ROLE_LABEL[user.role] || user.role}
              </span>
              <MemberSince date={user.createdAt} />
            </div>

            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="mt-4 cursor-pointer inline-flex items-center gap-1.5 bg-surface-muted hover:bg-border/60 active:scale-[0.97] text-ink font-semibold text-[13px] px-5 py-2.5 rounded-full border border-border transition-all"
            >
              <IconEdit width="13" height="13" />
              Edit Profile
            </button>

            <div className="mt-4">
              <LoyaltyBadge tier={tier} />
            </div>
          </div>

          <div className="h-px bg-border mx-5 sm:mx-8" />

          <div className="px-5 sm:px-8 py-6">
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
          </div>
        </div>

        <div className="mt-4">
          <OrderStatusQuickLinks orders={orders} />
        </div>

        <ProfileViewHistoryRail />

        {!user.emailVerified && <EmailVerifyNotice email={user.email} resend={resendVerificationEmail} />}
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
