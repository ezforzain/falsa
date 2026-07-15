import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconUser,
  IconLogout,
  IconChevronRight,
  IconGift,
  IconStore,
  IconSettings,
  IconKey,
  IconReceipt,
  IconShield,
} from '../components/icons';

// Icon + title (+ optional subtitle) row shared by every list on this page — accent switches
// between the brand green (account/profile actions) and orange (seller upsell/promo actions)
// so the two kinds of rows read differently at a glance, matching how orange is used as the
// "action" accent elsewhere in the app (buttons, badges).
function AccountRow({ to, icon: Icon, label, subtitle, accent = 'green' }) {
  const tint = accent === 'orange' ? 'bg-orange-tint text-orange' : 'bg-green-tint text-green';
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 sm:gap-4 px-5 sm:px-6 py-4 no-underline border-b border-border last:border-b-0 transition-colors duration-150 hover:bg-surface-muted active:bg-cream-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green"
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
        <Icon width="18" height="18" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink truncate">{label}</span>
        {subtitle && <span className="block text-[12.5px] text-text-muted mt-0.5 leading-snug">{subtitle}</span>}
      </span>
      <IconChevronRight
        width="16"
        height="16"
        className="text-text-muted shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

// Seller/partner upsell rows — relevant to guests and to signed-in buyers who aren't sellers
// yet. Both route into the seller sign-up flow (see the query-param handling in AuthPage).
const PARTNER_ROWS = [
  {
    to: '/auth?screen=signup&role=seller',
    icon: IconGift,
    label: 'Became a Partner',
    subtitle: 'Join our partner network and grow your business',
    accent: 'orange',
  },
  {
    to: '/auth?screen=signup&role=seller',
    icon: IconStore,
    label: 'Create A Seller Account',
    subtitle: 'Start selling to verified B2B buyers',
    accent: 'orange',
  },
];

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
        <div className="max-w-[640px] mx-auto">
          <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">My Account</h1>
          <div className="text-center py-[60px] px-5 bg-white border border-dashed border-border-strong rounded-2xl mb-5">
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

          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            {PARTNER_ROWS.map((row) => (
              <AccountRow key={row.label} {...row} />
            ))}
            <AccountRow
              to="/auth"
              icon={IconSettings}
              label="Account Center"
              subtitle="Manage your profile, security, and preferences"
            />
            <AccountRow
              to="/auth"
              icon={IconKey}
              label="Sign Up/Login"
              subtitle="Access your orders, cart, and saved stores"
            />
          </div>
        </div>
      </main>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const rows = [
    { to: '/cart', icon: IconReceipt, label: 'My orders' },
    ...(user.role === 'seller' ? [{ to: '/seller', icon: IconStore, label: 'Seller portal' }] : []),
    ...(user.role === 'admin' ? [{ to: '/admin', icon: IconShield, label: 'Admin panel' }] : []),
  ];

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <div className="max-w-[640px] mx-auto">
        <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">My Account</h1>
        <p className="text-sm text-text-muted mb-7">Manage your profile and orders.</p>

        <div className="bg-white border border-border rounded-2xl p-6 mb-5 flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center shrink-0">
            <IconUser width="22" height="22" className="text-green" />
          </span>
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-ink truncate">{user.companyName}</p>
            <p className="text-sm text-text-muted truncate">{user.email}</p>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
            {rows.map((row) => (
              <AccountRow key={row.to} {...row} />
            ))}
          </div>
        )}

        {user.role === 'buyer' && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
            {PARTNER_ROWS.map((row) => (
              <AccountRow key={row.label} {...row} />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="cursor-pointer flex items-center gap-2.5 bg-white border border-border rounded-2xl px-6 py-4 text-[15px] font-semibold text-orange-text w-full hover:border-border-strong transition-colors"
        >
          <IconLogout width="18" height="18" />
          Sign out
        </button>
      </div>
    </main>
  );
}
