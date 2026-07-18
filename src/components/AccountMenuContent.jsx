import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconUser,
  IconHome,
  IconReceipt,
  IconHeart,
  IconCart,
  IconMessageCircle,
  IconGift,
  IconStore,
  IconSettings,
  IconSliders,
  IconHelpCircle,
  IconShield,
  IconLogout,
  IconKey,
} from './icons';

const TINTS = {
  green: 'bg-green-tint text-green',
  orange: 'bg-orange-tint text-orange',
  rose: 'bg-rose-50 text-rose-500',
  blue: 'bg-blue-50 text-blue-500',
  slate: 'bg-surface-muted text-ink-soft',
  red: 'bg-red-50 text-red-500',
};

const PRIMARY_ITEMS = [
  { label: 'Home', to: '/', icon: IconHome, tint: 'green' },
  { label: 'My Profile', to: '/account', icon: IconUser, tint: 'green' },
  { label: 'My Orders', to: '/cart', icon: IconReceipt, tint: 'green' },
  { label: 'Wishlist', to: '/wishlist', icon: IconHeart, tint: 'rose' },
  { label: 'Cart', to: '/cart', icon: IconCart, tint: 'green' },
  { label: 'Messages', to: '/messenger', icon: IconMessageCircle, tint: 'blue' },
];

// Seller/admin accounts already have a store or panel of their own — showing them a "become a
// seller" upsell would be nonsensical, so this swaps to their actual portal link instead. Both
// still sit in this same "Growth" slot, at the same position in the menu.
function growthItems(role) {
  if (role === 'seller') {
    return [{ label: 'Seller Portal', to: '/seller', icon: IconStore, tint: 'orange' }];
  }
  if (role === 'admin') {
    return [{ label: 'Admin Panel', to: '/admin', icon: IconShield, tint: 'orange' }];
  }
  return [
    { label: 'Become a Partner', to: '/auth?screen=signup&role=seller', icon: IconGift, tint: 'orange' },
    { label: 'Create Seller Account', to: '/auth?screen=signup&role=seller', icon: IconStore, tint: 'orange' },
  ];
}

const SETTINGS_ITEMS = [
  { label: 'Account Center', to: '/account-center', icon: IconSettings, tint: 'slate' },
  { label: 'Settings', to: '/settings', icon: IconSliders, tint: 'slate' },
];

const SUPPORT_ITEMS = [
  { label: 'Help & Support', to: '/help', icon: IconHelpCircle, tint: 'slate' },
  { label: 'Privacy Policy', to: '/privacy', icon: IconShield, tint: 'slate' },
];

// Lightweight, dependency-free Material/Facebook-style ripple: spawns a fading circle at the
// pointer position on the row that was pressed, removing itself once its animation ends.
function spawnRipple(e) {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.6;
  const span = document.createElement('span');
  span.className = 'absolute rounded-full bg-green/20 pointer-events-none animate-ripple';
  span.style.width = `${size}px`;
  span.style.height = `${size}px`;
  span.style.left = `${e.clientX - rect.left - size / 2}px`;
  span.style.top = `${e.clientY - rect.top - size / 2}px`;
  target.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

function MenuRow({ icon: Icon, label, to, onClick, onNavigate, tint = 'green', danger = false }) {
  const className = `relative overflow-hidden flex items-center gap-3.5 px-3 py-2.5 rounded-xl no-underline cursor-pointer transition-colors duration-150 hover:bg-surface-muted active:bg-cream-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green ${danger ? 'text-red-600' : 'text-ink'}`;

  const content = (
    <>
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TINTS[tint] || TINTS.green}`}>
        <Icon width="18" height="18" />
      </span>
      <span className="text-[14.5px] font-semibold">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} onPointerDown={spawnRipple} onClick={onNavigate} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onPointerDown={spawnRipple} onClick={onClick} className={`${className} w-full text-left`}>
      {content}
    </button>
  );
}

function MenuSection({ items, onNavigate }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <MenuRow key={item.label} {...item} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

// The actual Facebook-style menu — profile header + grouped rows — shared by both the mobile
// slide-in drawer (ProfileDrawer) and the desktop dropdown (ProfileDropdown) so the two
// presentations can never drift out of sync with each other.
export default function AccountMenuContent({ onNavigate }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Profile header */}
      <div className="relative px-5 pb-5 pt-6 bg-green-tint shrink-0">
        <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
          <IconUser width="28" height="28" className="text-green" />
        </span>
        <p className="text-[16px] font-bold text-ink m-0 truncate pr-10">
          {isAuthenticated ? user.companyName : 'Welcome'}
        </p>
        <p className="text-[13px] text-text-muted mt-0.5 truncate pr-10">
          {isAuthenticated ? user.email || user.phone : 'Sign in to unlock your account'}
        </p>
        <Link
          to={isAuthenticated ? '/account' : '/auth'}
          onClick={onNavigate}
          className="inline-block mt-3.5 bg-green hover:bg-green-hover text-white text-[13px] font-semibold px-4 py-2 rounded-full no-underline transition-colors"
        >
          {isAuthenticated ? 'View Profile' : 'Sign in'}
        </Link>
      </div>

      {/* Menu */}
      <nav
        className="flex-1 overflow-y-auto px-3 pt-4"
        aria-label="Account"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <MenuSection items={PRIMARY_ITEMS} onNavigate={onNavigate} />
        <div className="border-t border-border my-3" />
        <MenuSection items={growthItems(user?.role)} onNavigate={onNavigate} />
        <MenuSection items={SETTINGS_ITEMS} onNavigate={onNavigate} />
        <div className="border-t border-border my-3" />
        <MenuSection items={SUPPORT_ITEMS} onNavigate={onNavigate} />
        <div className="border-t border-border my-3" />
        {isAuthenticated ? (
          <MenuRow icon={IconLogout} label="Logout" tint="red" danger onClick={handleLogout} />
        ) : (
          <MenuRow icon={IconKey} label="Sign in" tint="green" to="/auth" onNavigate={onNavigate} />
        )}
      </nav>
    </>
  );
}
