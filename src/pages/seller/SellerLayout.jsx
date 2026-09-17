import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadConversations, totalUnread } from '../../lib/sellerMessagesStore';
import { getSellerReadiness } from '../../lib/sellerReadiness';
import VerifiedBadge from '../../components/VerifiedBadge';
import OfficialBadge from '../../components/OfficialBadge';
import Avatar from '../../components/Avatar';
import NavList from '../../components/seller/NavList';
import {
  IconAlertCircle,
  IconBell,
  IconBox,
  IconClose,
  IconGrid,
  IconLogout,
  IconMenu,
  IconMessageCircle,
  IconReceipt,
  IconSettings,
  IconSparkle,
  IconStore,
  IconTrendingUp,
  IconUser,
  IconWallet,
} from '../../components/icons';
import logoMark from '../../assets/logo-mark.png';

const TABS = [
  { to: '/seller', label: 'Dashboard', icon: IconGrid, end: true },
  { to: '/seller/products', label: 'Products', icon: IconBox, end: false },
  { to: '/seller/orders', label: 'Orders', icon: IconReceipt, end: false },
  { to: '/seller/customers', label: 'Customers', icon: IconUser, end: false },
  { to: '/seller/messages', label: 'Messages', icon: IconMessageCircle, end: false, badgeKey: 'messages' },
  { to: '/seller/store-profile', label: 'Store Profile', icon: IconStore, end: false },
  { to: '/seller/analytics', label: 'Analytics', icon: IconTrendingUp, end: false },
  { to: '/seller/promotions', label: 'Promotions', icon: IconSparkle, end: false },
  { to: '/seller/payouts', label: 'Payouts', icon: IconWallet, end: false },
  { to: '/seller/settings', label: 'Settings', icon: IconSettings, end: false },
];

export default function SellerLayout() {
  const { user, status, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const wasMobileNavOpenRef = useRef(false);

  useEffect(() => {
    // Conversations are keyed by the public Seller/store id (same one buyers see on the product
    // page), not this account's own User id — those are two different records server-side.
    if (!user?.sellerId) return;
    let cancelled = false;
    const refresh = () => {
      loadConversations()
        .then((conversations) => {
          if (!cancelled) setUnreadMessages(totalUnread(conversations));
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.sellerId]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && setMobileNavOpen(false);
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  if (mobileNavOpen) wasMobileNavOpenRef.current = true;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <span className="w-8 h-8 border-[3px] border-border rounded-full inline-block" style={{ borderTopColor: 'var(--color-green)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="max-w-[420px] text-center bg-surface border border-border rounded-2xl shadow-xl p-8">
          <span className="w-14 h-14 rounded-full bg-orange-tint inline-flex items-center justify-center mb-5">
            <IconAlertCircle width="26" height="26" className="text-orange-text" />
          </span>
          <h1 className="font-display text-xl font-bold text-ink mb-2">Seller accounts only</h1>
          <p className="text-sm text-text mb-6 leading-relaxed">
            The seller portal is only available to seller accounts. You're signed in as a buyer.
          </p>
          <Link to="/" className="inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-6 py-3 rounded-full no-underline transition-colors">
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const activeTab = TABS.find((t) => (t.end ? location.pathname === t.to : location.pathname.startsWith(t.to))) || TABS[0];
  const headline = activeTab.label === 'Dashboard' ? "Here's how your storefront is performing" : activeTab.label;
  const { bankComplete, pickupComplete, percent } = getSellerReadiness(user);
  const readinessNote = bankComplete && pickupComplete ? 'All set — ready to ship with Falsafah.' : !bankComplete && !pickupComplete ? 'Add bank details and a pickup address to ship with Falsafah.' : !bankComplete ? 'Add bank details to ship with Falsafah.' : 'Add a pickup address to ship with Falsafah.';

  const SidebarNav = (
    <>
      <div className="flex items-center gap-3 border border-border rounded-2xl px-4 py-3.5 bg-surface">
        <img src={logoMark} alt="" className="w-9 h-9 rounded-full object-contain shrink-0" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="flex items-center gap-1.5 text-[17px] font-extrabold tracking-[-0.3px] text-ink">
            Falsafah <OfficialBadge size={13} tooltipPosition="bottom" />
          </span>
          <span className="text-[9.5px] tracking-[2.4px] font-semibold text-text uppercase">Seller Portal</span>
        </div>
      </div>

      <NavList tabs={TABS} unreadMessages={unreadMessages} onNavigate={() => setMobileNavOpen(false)} />

      <div className="mt-auto border border-border rounded-2xl p-4 bg-surface flex flex-col gap-2">
        <div className="text-[12.5px] font-bold text-ink">Store readiness</div>
        <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green to-ink-soft transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-[11.5px] text-text leading-snug">
          {readinessNote}
          {(!bankComplete || !pickupComplete) && (
            <>
              {' '}
              <Link to="/seller/settings" className="text-green font-semibold hover:underline" onClick={() => setMobileNavOpen(false)}>
                Go to Settings →
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="seller-portal min-h-screen bg-cream text-ink p-4 sm:p-[26px]" style={{ fontFamily: 'var(--font-sans)' }}>
      <div
        className="max-w-[1400px] mx-auto grid gap-[18px] lg:gap-[22px] border border-border rounded-[26px] p-3.5 sm:p-5 items-start"
        style={{ background: 'var(--color-cream-dark)', gridTemplateColumns: '1fr' }}
      >
        <div className="hidden lg:grid gap-[22px]" style={{ gridTemplateColumns: '262px minmax(0,1fr)' }}>
          <aside className="flex flex-col gap-6">{SidebarNav}</aside>

          <main className="flex flex-col gap-[18px] min-w-0">
            <PortalHeader user={user} headline={headline} unreadMessages={unreadMessages} navigate={navigate} handleLogout={handleLogout} />
            <Outlet />
          </main>
        </div>

        <div className="lg:hidden flex flex-col gap-[18px] min-w-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="w-10 h-10 rounded-xl border border-border bg-surface text-ink-soft flex items-center justify-center cursor-pointer shrink-0"
            >
              <IconMenu width="18" height="18" />
            </button>
            <img src={logoMark} alt="" className="w-8 h-8 rounded-full object-contain shrink-0" />
            <span className="text-[15px] font-extrabold text-ink truncate">Falsafah Seller Portal</span>
          </div>

          <PortalHeader user={user} headline={headline} unreadMessages={unreadMessages} navigate={navigate} handleLogout={handleLogout} compact />
          <Outlet />
        </div>
      </div>

      {wasMobileNavOpenRef.current && (
        <div className="lg:hidden fixed inset-0 z-[120]" aria-hidden={!mobileNavOpen} style={{ pointerEvents: mobileNavOpen ? 'auto' : 'none' }}>
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${mobileNavOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Seller Portal menu"
            className={`absolute inset-y-0 left-0 w-[85%] max-w-[300px] bg-cream-dark border-r border-border p-4 flex flex-col gap-6 transition-transform duration-300 ease-out ${
              mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
              className="self-end w-8 h-8 rounded-lg bg-surface border border-border text-text-muted hover:text-ink flex items-center justify-center cursor-pointer"
            >
              <IconClose width="14" height="14" />
            </button>
            {SidebarNav}
          </div>
        </div>
      )}
    </div>
  );
}

function PortalHeader({ user, headline, unreadMessages, navigate, handleLogout, compact = false }) {
  return (
    <header className="flex items-start justify-between gap-4 flex-wrap p-0.5">
      <div className="flex-1 min-w-[220px]">
        <div className="text-[11px] tracking-[1.8px] font-bold text-text uppercase">Welcome back, {user.companyName}</div>
        {!compact && <div className="text-[22px] leading-[1.3] font-extrabold tracking-[-0.4px] mt-1.5 text-ink">{headline}</div>}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => navigate('/seller/messages')}
          title="Notifications"
          className="relative border border-border bg-surface text-ink-soft w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:border-border-strong transition-colors"
        >
          <IconBell width="17" height="17" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-orange text-white text-[10px] font-extrabold flex items-center justify-center px-1 border-2 border-surface">
              {unreadMessages}
            </span>
          )}
        </button>
        <Link
          to="/seller/products"
          className="no-underline bg-green hover:bg-green-hover text-white font-extrabold text-[13.5px] px-4.5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
        >
          Manage listings
        </Link>
        <div className="hidden sm:flex items-center gap-2.5 border border-border bg-surface rounded-2xl py-1.5 pl-1.5 pr-3.5">
          <Avatar src={user.avatarUrl} name={user.companyName} size={34} iconSize={15} />
          <div className="flex flex-col leading-tight">
            <span className="flex items-center gap-1 text-[13px] font-bold text-ink">
              {user.companyName}
              {user.verified && <VerifiedBadge size={14} tooltipPosition="bottom" />}
            </span>
            <span className="text-[10.5px] text-text tracking-wide">SELLER</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className="cursor-pointer flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-ink px-3 py-2.5 rounded-xl hover:bg-surface transition-colors"
        >
          <IconLogout width="17" height="17" />
        </button>
      </div>
    </header>
  );
}
