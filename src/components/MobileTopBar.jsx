import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconMenu, IconBell, IconHeart } from './icons';
import InformationDrawer from './InformationDrawer';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useWishlist } from '../context/WishlistContext';

// Same violet accent as the Home hero/tabs (see MobileHome.jsx) — this bar shares that look
// since it's the chrome sitting directly above it.
const ACCENT = '#6C63FF';

// Lightweight top bar for the "bare" mobile screens (Home, Spotlight) that skip the desktop
// Header/Footer chrome — hamburger into the Information sheet on the left, centered wordmark,
// notifications + wishlist shortcuts on the right (reference layout). The account menu lives
// only on the bottom nav's "My Account" tab and the My Profile page itself, not here — real
// navigation otherwise lives in the bottom tab bar.
export default function MobileTopBar() {
  const [infoOpen, setInfoOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const { count: wishlistCount } = useWishlist();

  return (
    <>
      <div className="flex items-center px-4 pt-4 pb-1">
        <div className="flex-1 flex items-center justify-start">
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            aria-label="Information"
            className="cursor-pointer w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-ink-soft hover:bg-surface-muted active:scale-95 transition-all shrink-0"
          >
            <IconMenu width="21" height="21" />
          </button>
        </div>

        <span className="font-display text-[22px] font-extrabold tracking-tight shrink-0" style={{ color: ACCENT }}>
          Falsafah
        </span>

        <div className="flex-1 flex items-center justify-end gap-0.5">
          {isAuthenticated && (
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-surface-muted active:scale-95 transition-all shrink-0"
            >
              <IconBell width="20" height="20" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 bg-orange text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative cursor-pointer w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-ink-soft hover:bg-surface-muted active:scale-95 transition-all shrink-0"
          >
            <IconHeart width="20" height="20" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1.5 bg-orange text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <InformationDrawer open={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}
