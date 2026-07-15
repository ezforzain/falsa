import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconGrid, IconMessageCircle, IconCart, IconUser } from './icons';

const ACTIVE_COLOR = '#FF6A00';

const TABS = [
  { key: 'home', label: 'Home', to: '/', icon: IconHome, match: (path) => path === '/' },
  { key: 'categories', label: 'Categories', to: '/categories', icon: IconGrid, match: (path) => path.startsWith('/categories') },
  { key: 'messenger', label: 'Messenger', to: '/messenger', icon: IconMessageCircle, match: (path) => path.startsWith('/messenger'), badge: 1 },
  { key: 'cart', label: 'Cart', to: '/cart', icon: IconCart, match: (path) => path.startsWith('/cart') },
  { key: 'account', label: 'My Account', to: '/account', icon: IconUser, match: (path) => path.startsWith('/account') },
];

// Fixed mobile tab bar for the buyer storefront — hidden at the md breakpoint, where the
// desktop Header/Footer take over primary navigation instead.
export default function BottomNavBar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 h-[72px]">
        {TABS.map(({ key, label, to, icon: Icon, match, badge }) => {
          const active = match(pathname);
          return (
            <Link
              key={key}
              to={to}
              aria-current={active ? 'page' : undefined}
              className="group flex flex-col items-center justify-center gap-1 mx-1 my-1.5 rounded-2xl outline-none transition-transform duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6A00]"
            >
              <span className="relative flex items-center justify-center">
                <Icon
                  className="transition-all duration-200 ease-out"
                  style={{
                    color: active ? ACTIVE_COLOR : '#4B5563',
                    transform: active ? 'scale(1.12)' : 'scale(1)',
                  }}
                  strokeWidth={active ? 2.25 : 2}
                />
                {badge != null && (
                  <span className="animate-badge-pop absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-[3px] rounded-full bg-red-500 text-white text-[10px] leading-[16px] font-semibold text-center ring-2 ring-white">
                    {badge}
                  </span>
                )}
              </span>
              <span
                className="text-[11px] font-medium leading-none transition-colors duration-200 ease-out"
                style={{ color: active ? ACTIVE_COLOR : '#4B5563' }}
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
