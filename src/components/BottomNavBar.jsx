import { Link, useLocation } from 'react-router-dom';
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount';
import { useLanguage } from '../context/LanguageContext';
import { IconHome, IconGrid, IconMessageCircle, IconCart, IconUser } from './icons';

const ACTIVE_COLOR = '#FF6A00';

// "account" just navigates to /account like every other tab — the account menu itself only
// opens from that page (see the trigger inside AccountPage), matching desktop exactly, where
// the equivalent hamburger only appears in Header while viewing /account.
function buildTabs(t) {
  return [
    { key: 'home', label: t('nav.home'), to: '/', icon: IconHome, match: (path) => path === '/' },
    { key: 'categories', label: t('nav.categories'), to: '/categories', icon: IconGrid, match: (path) => path.startsWith('/categories') },
    { key: 'messenger', label: t('nav.messenger'), to: '/messenger', icon: IconMessageCircle, match: (path) => path.startsWith('/messenger') },
    { key: 'cart', label: t('nav.cart'), to: '/cart', icon: IconCart, match: (path) => path.startsWith('/cart') },
    { key: 'account', label: t('nav.account'), to: '/account', icon: IconUser, match: (path) => path.startsWith('/account') },
  ];
}

// Fixed mobile tab bar for the buyer storefront — hidden at the md breakpoint, where the
// desktop Header/Footer take over primary navigation instead.
export default function BottomNavBar() {
  const { pathname } = useLocation();
  const unreadMessageCount = useUnreadMessageCount();
  const { t } = useLanguage();
  const TABS = buildTabs(t);

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-surface border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      // `env(safe-area-inset-bottom)` alone isn't enough — Android Chrome commonly reports 0
      // for it even with 3-button/gesture navigation showing (unlike iOS Safari), which was
      // clipping the label text under the system nav bar. `max()` guarantees real clearance
      // on every platform regardless of what the inset resolves to.
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <div className="grid grid-cols-5 h-[72px]">
        {TABS.map(({ key, label, to, icon: Icon, match }) => {
          const active = match(pathname);
          const badge = key === 'messenger' && unreadMessageCount > 0 ? unreadMessageCount : null;
          return (
            <Link
              key={key}
              to={to}
              aria-current={active ? 'page' : undefined}
              className="group flex flex-col items-center justify-center gap-1 min-w-0 mx-0.5 my-1.5 rounded-2xl outline-none transition-transform duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6A00]"
            >
              <span className="relative flex items-center justify-center">
                <Icon
                  className="transition-all duration-200 ease-out"
                  style={{
                    color: active ? ACTIVE_COLOR : 'var(--color-text-muted)',
                    transform: active ? 'scale(1.12)' : 'scale(1)',
                  }}
                  strokeWidth={active ? 2.25 : 2}
                />
                {badge != null && (
                  <span className="animate-badge-pop absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-[3px] rounded-full bg-red-500 text-white text-[10px] leading-[16px] font-semibold text-center ring-2 ring-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              <span
                className="text-[11px] font-medium leading-none whitespace-nowrap transition-colors duration-200 ease-out"
                style={{ color: active ? ACTIVE_COLOR : 'var(--color-text-muted)' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
