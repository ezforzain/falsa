import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { normalizeQuery, searchHints } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useRotatingHints from '../hooks/useRotatingHints';
import SearchHintOverlay from './SearchHintOverlay';
import ProfileDropdown from './ProfileDropdown';
import { IconSearch, IconCart, IconUser, IconLogout, IconSparkle, IconBox, IconShield } from './icons';
import logoMark from '../assets/logo-mark.png';

export default function Header() {
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { count: cartCount } = useCart();
  const { user, status, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const accountLabel = user?.companyName || user?.email || 'Account';

  // Paused the moment the user focuses the search field or has typed anything, and only
  // resumes — with a fresh full dwell time — once it's empty and unfocused again.
  const hintsPaused = searchFocused || searchValue.trim().length > 0;
  const currentHint = useRotatingHints(searchHints, 4000, hintsPaused);

  const submitSearch = () => {
    const q = normalizeQuery(searchValue);
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const isHome = location.pathname === '/';
  const isSpotlight = location.pathname === '/spotlight';
  const isMyProfile = location.pathname === '/account';

  const navLinkClass = (active) =>
    `cursor-pointer px-3.5 py-2 rounded-lg text-sm transition-colors hover:bg-surface-muted ${
      active ? 'font-bold text-green' : 'font-medium text-text'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 px-4 sm:px-6 lg:px-10 py-2.5">
        <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <img src={logoMark} alt="" className="w-[42px] h-[42px] object-contain" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[25px] font-bold text-green tracking-tight">
              Falsafah
            </span>
          </span>
        </Link>

        {/* Search — desktop */}
        <div className="hidden md:flex flex-1 max-w-[540px] min-w-[220px] items-center gap-2.5 bg-surface-muted border border-border rounded-full py-2 pl-[18px] pr-2 focus-within:border-green focus-within:bg-white transition-colors">
          <IconSearch className="text-text-muted shrink-0" />
          <span className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
              className="relative z-10 w-full border-none bg-transparent outline-none text-ink text-sm font-sans"
            />
            <SearchHintOverlay hint={currentHint} visible={!searchFocused && !searchValue} />
          </span>
          <span
            onClick={submitSearch}
            className="bg-green hover:bg-green-hover text-white text-xs font-semibold px-[18px] py-2 rounded-full cursor-pointer whitespace-nowrap transition-colors"
          >
            Search
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-0.5 ml-auto">
          <Link to="/" className={navLinkClass(isHome)}>
            Home
          </Link>
          <Link to="/spotlight" className={`${navLinkClass(isSpotlight)} flex items-center gap-1.5`}>
            <IconSparkle />
            Spotlight
          </Link>
          <Link
            to="/cart"
            className="cursor-pointer px-3 py-2 rounded-lg text-text hover:bg-surface-muted relative flex items-center transition-colors"
          >
            <IconCart />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          {isAuthenticated && user?.role === 'seller' && (
            <Link
              to="/seller"
              className="cursor-pointer px-3 py-2 rounded-lg text-text hover:bg-surface-muted flex items-center gap-1.5 no-underline text-sm font-semibold"
            >
              <IconBox width="18" height="18" />
              <span className="hidden lg:inline">Seller Portal</span>
            </Link>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              to="/admin"
              className="cursor-pointer px-3 py-2 rounded-lg text-text hover:bg-surface-muted flex items-center gap-1.5 no-underline text-sm font-semibold"
            >
              <IconShield width="18" height="18" />
              <span className="hidden lg:inline">Admin Panel</span>
            </Link>
          )}
          {status === 'loading' ? (
            <span className="w-[92px] h-9 rounded-lg bg-surface-muted animate-pulse ml-1" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Link
                to="/account"
                className="px-3 py-2 text-sm font-semibold text-ink-soft max-w-[140px] truncate hidden lg:inline no-underline hover:text-green transition-colors"
              >
                {accountLabel}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="cursor-pointer px-3 py-2 rounded-lg text-text hover:bg-surface-muted flex items-center gap-1.5 text-sm font-semibold transition-colors"
              >
                <IconLogout />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="cursor-pointer px-3 py-2 rounded-lg text-text hover:bg-surface-muted flex items-center gap-1.5 no-underline text-sm font-semibold"
            >
              <IconUser />
              Sign in
            </Link>
          )}

          {/* Facebook-style account menu — the hamburger only appears here on the My Profile
              page itself (see ProfileDropdown), not on every page. Mobile's equivalent trigger
              is the bottom nav's "My Account" tab, which works from anywhere. */}
          {isMyProfile && <ProfileDropdown />}
        </nav>

        {/* Mobile: plain search shortcut, top-right. Everything the old hamburger panel used
            to duplicate is already reachable elsewhere on mobile: Home/Cart/Account via
            BottomNavBar, Spotlight as Home's own default tab, and sign-in/out/Seller
            Portal/Admin Panel via the account menu on the "My Account" tab (see AccountPage) —
            so nothing here needs a second copy of that navigation. */}
        <Link
          to="/search"
          aria-label="Search"
          className="md:hidden ml-auto text-ink p-2 rounded-lg hover:bg-surface-muted transition-colors"
        >
          <IconSearch width="20" height="20" />
        </Link>
      </div>
    </header>
  );
}
