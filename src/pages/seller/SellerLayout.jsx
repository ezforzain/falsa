import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VerifiedBadge from '../../components/VerifiedBadge';
import OfficialBadge from '../../components/OfficialBadge';
import {
  IconAlertCircle,
  IconBox,
  IconGrid,
  IconLogout,
  IconReceipt,
  IconSettings,
  IconSparkle,
  IconStore,
  IconTrendingUp,
  IconWallet,
} from '../../components/icons';
import logoMark from '../../assets/logo-mark.png';

const TABS = [
  { to: '/seller', label: 'Dashboard', icon: IconGrid, end: true, requiresApproval: true },
  { to: '/seller/products', label: 'Products', icon: IconBox, end: false, requiresApproval: true },
  { to: '/seller/orders', label: 'Orders', icon: IconReceipt, end: false, requiresApproval: true },
  { to: '/seller/store-profile', label: 'Store Profile', icon: IconStore, end: false, requiresApproval: true },
  { to: '/seller/analytics', label: 'Analytics', icon: IconTrendingUp, end: false, requiresApproval: true },
  { to: '/seller/promotions', label: 'Promotions', icon: IconSparkle, end: false, requiresApproval: true },
  { to: '/seller/payouts', label: 'Payouts', icon: IconWallet, end: false, requiresApproval: true },
  { to: '/seller/settings', label: 'Settings', icon: IconSettings, end: false, requiresApproval: false },
];

export default function SellerLayout() {
  const { user, status, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Seller features (Dashboard/Products/Orders) are locked until CNIC is approved — only
  // Settings (where the status lives, and where a rejected seller can resubmit) stays open.
  const kycApproved = user.cnicStatus === 'approved';
  if (!kycApproved && location.pathname !== '/seller/settings') {
    return <Navigate to="/seller/settings" replace />;
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

          <span className="hidden md:flex items-center gap-1.5 text-sm text-teal-mist truncate max-w-[220px]">
            {user.companyName}
            {user.verified && <VerifiedBadge size={16} tooltipPosition="bottom" />}
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
          {TABS.map((tab) =>
            tab.requiresApproval && !kycApproved ? (
              <span
                key={tab.to}
                title="Available once your CNIC is approved"
                className="flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-teal-mist/40 cursor-not-allowed"
              >
                <tab.icon width="15" height="15" />
                {tab.label}
              </span>
            ) : (
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
              </NavLink>
            )
          )}
        </nav>
      </header>

      {user.cnicStatus === 'pending' && (
        <div className="bg-orange-tint border-b border-[#E9C9A0]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-[13px] text-orange-text-dark">
            <IconAlertCircle width="15" height="15" className="shrink-0" />
            Your {user.sellerType === 'corporate' ? 'business verification' : 'CNIC identity verification'} is pending —
            usually completed within 2 working days. Listings you add now will go live once verified.
          </div>
        </div>
      )}

      {user.cnicStatus === 'rejected' && (
        <div className="bg-orange-tint border-b border-[#E9C9A0]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-[13px] text-orange-text-dark">
            <IconAlertCircle width="15" height="15" className="shrink-0" />
            Your verification was rejected{user.cnicRejectionReason ? `: ${user.cnicRejectionReason}` : '.'} Upload new
            documents below to resubmit for review.
          </div>
        </div>
      )}

      {!user.cnicStatus && user.role === 'seller' && (
        <div className="bg-orange-tint border-b border-[#E9C9A0]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-[13px] text-orange-text-dark">
            <IconAlertCircle width="15" height="15" className="shrink-0" />
            Your seller account is pending verification — usually completed within 2 working days. Listings you add now will go live once verified.
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
