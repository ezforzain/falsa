import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadConversations, totalUnread } from '../../lib/sellerMessagesStore';
import VerifiedBadge from '../../components/VerifiedBadge';
import OfficialBadge from '../../components/OfficialBadge';
import Avatar from '../../components/Avatar';
import {
  IconAlertCircle,
  IconBox,
  IconGrid,
  IconLogout,
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
  const [unreadMessages, setUnreadMessages] = useState(0);

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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <span className="w-8 h-8 border-[3px] border-border rounded-full inline-block" style={{ borderTopColor: '#0E5A46', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="max-w-[420px] text-center bg-white border border-border rounded-2xl shadow-xl p-8">
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

  return (
    <div className="min-h-screen bg-cream font-sans text-ink flex flex-col">
      <header className="bg-green-deep text-white sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">
          <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
            <img src={logoMark} alt="" className="w-9 h-9 object-contain" />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold text-white tracking-tight">
                  Falsafah
                </span>
                <OfficialBadge size={14} tooltipPosition="bottom" />
              </span>
              <span className="font-mono text-[9px] text-teal-soft tracking-[0.2em] uppercase mt-0.5">Seller Portal</span>
            </span>
          </Link>

          <div className="flex-1" />

          <span className="hidden md:flex items-center gap-2 text-sm text-teal-mist truncate max-w-[260px]">
            <Avatar src={user.avatarUrl} size={26} iconSize={13} bgClassName="bg-white/15" iconClassName="text-white" />
            {user.companyName}
            {user.verified && <VerifiedBadge size={16} tooltipPosition="bottom" />}
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-white bg-white/15 px-1.5 py-0.5 rounded">Seller</span>
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <IconLogout width="17" height="17" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        <nav className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  isActive ? 'border-orange text-white' : 'border-transparent text-teal-mist hover:text-white'
                }`
              }
            >
              <tab.icon width="15" height="15" />
              {tab.label}
              {tab.badgeKey === 'messages' && unreadMessages > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
