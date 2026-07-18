import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconClose,
  IconUser,
  IconHome,
  IconReceipt,
  IconHeart,
  IconCart,
  IconMessageCircle,
  IconBell,
  IconGift,
  IconStore,
  IconSettings,
  IconSliders,
  IconHelpCircle,
  IconShield,
  IconFile,
  IconLogout,
  IconKey,
} from './icons';

const TINTS = {
  green: 'bg-green-tint text-green',
  orange: 'bg-orange-tint text-orange',
  rose: 'bg-rose-50 text-rose-500',
  blue: 'bg-blue-50 text-blue-500',
  amber: 'bg-amber-50 text-amber-600',
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
  { label: 'Notifications', to: '/notifications', icon: IconBell, tint: 'amber' },
];

const GROWTH_ITEMS = [
  { label: 'Become a Partner', to: '/auth?screen=signup&role=seller', icon: IconGift, tint: 'orange' },
  { label: 'Create Seller Account', to: '/auth?screen=signup&role=seller', icon: IconStore, tint: 'orange' },
  { label: 'Account Center', to: '/account-center', icon: IconSettings, tint: 'slate' },
  { label: 'Settings', to: '/settings', icon: IconSliders, tint: 'slate' },
];

const SUPPORT_ITEMS = [
  { label: 'Help & Support', to: '/help', icon: IconHelpCircle, tint: 'slate' },
  { label: 'Privacy Policy', to: '/privacy', icon: IconShield, tint: 'slate' },
  { label: 'Terms & Conditions', to: '/terms', icon: IconFile, tint: 'slate' },
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

function DrawerRow({ icon: Icon, label, to, onClick, onNavigate, tint = 'green', danger = false }) {
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

function DrawerSection({ items, onNavigate }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <DrawerRow key={item.label} {...item} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

// Facebook-style left-slide profile drawer — the primary entry point into account-related
// navigation on mobile, opened from BottomNavBar's "My Account" tab and the mobile top bar's
// profile icon (see useProfileDrawer). Always mounted (rather than conditionally rendered) so
// both the open and close transitions animate over 300ms instead of only the open direction.
export default function ProfileDrawer({ open, onClose }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const closeBtnRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Track whether the drawer has ever been opened so its content isn't fetched/rendered
  // (and doesn't briefly flash) before the very first open.
  if (open) wasOpenRef.current = true;
  if (!wasOpenRef.current) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/');
  };

  return (
    <div className="md:hidden fixed inset-0 z-[120]" aria-hidden={!open} style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div
        id="profile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Profile menu"
        className={`absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div
          className="relative px-5 pb-5 bg-green-tint shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}
        >
          <button
            type="button"
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-4 w-9 h-9 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
            style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
          >
            <IconClose width="16" height="16" className="text-ink-soft" />
          </button>

          <span className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
            <IconUser width="34" height="34" className="text-green" />
          </span>
          <p className="text-[17px] font-bold text-ink m-0 truncate pr-10">
            {isAuthenticated ? user.companyName : 'Welcome'}
          </p>
          <p className="text-[13px] text-text-muted mt-0.5 truncate pr-10">
            {isAuthenticated ? user.email || user.phone : 'Sign in to unlock your account'}
          </p>
          <Link
            to={isAuthenticated ? '/account' : '/auth'}
            onClick={onClose}
            className="inline-block mt-3.5 bg-green hover:bg-green-hover text-white text-[13px] font-semibold px-4 py-2 rounded-full no-underline transition-colors"
          >
            {isAuthenticated ? 'View Profile' : 'Sign in'}
          </Link>
        </div>

        {/* Menu */}
        <nav
          className="flex-1 overflow-y-auto px-3 pt-4"
          aria-label="Profile"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        >
          <DrawerSection items={PRIMARY_ITEMS} onNavigate={onClose} />
          <div className="border-t border-border my-4" />
          <DrawerSection items={GROWTH_ITEMS} onNavigate={onClose} />
          <div className="border-t border-border my-4" />
          <DrawerSection items={SUPPORT_ITEMS} onNavigate={onClose} />
          <div className="border-t border-border my-4" />
          {isAuthenticated ? (
            <DrawerRow icon={IconLogout} label="Logout" tint="red" danger onClick={handleLogout} />
          ) : (
            <DrawerRow icon={IconKey} label="Sign in" tint="green" to="/auth" onNavigate={onClose} />
          )}
        </nav>
      </div>
    </div>
  );
}
