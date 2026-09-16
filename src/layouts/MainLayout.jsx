import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNavBar from '../components/BottomNavBar';
import useIsMobile from '../hooks/useIsMobile';

export default function MainLayout() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  // On mobile, these routes get their own full-screen presentation — Home and Spotlight are
  // meant to read as endless product feeds (no footer/info block breaking up the scroll), and
  // Account/Messenger's list already have BottomNavBar as their only navigation chrome. The
  // desktop-style Header/Footer would just be clutter above the bottom tab bar.
  // Desktop still gets full chrome everywhere since it has no bottom nav to fall back on.
  const BARE_MOBILE_ROUTES = ['/', '/spotlight', '/account', '/messenger'];
  const isMobileBare = isMobile && BARE_MOBILE_ROUTES.includes(pathname);

  // Product detail owns its own chrome on mobile: a compact sticky header (see
  // MobileProductHeader, rendered by ProductPage itself since it needs the product) replaces
  // the generic Header, and the page's existing StickyActionBar replaces BottomNavBar — showing
  // both bottom bars at once would be redundant.
  const isMobileProductDetail = isMobile && pathname.startsWith('/product/');
  // An open conversation (/messenger/:id) is a full-screen chat, not just another bare page: it
  // drops BottomNavBar too (not only Header/Footer), so the on-screen keyboard never has to
  // fight a second fixed-position bar for space — see ConversationPage's own h-[100dvh] flex
  // column, whose last child (the composer) is what actually stays above the keyboard.
  const isMobileConversation = isMobile && pathname.startsWith('/messenger/');
  if (isMobileProductDetail || isMobileConversation) {
    return (
      <div className="font-sans text-ink bg-surface min-h-screen">
        <Outlet />
      </div>
    );
  }

  // Matches BottomNavBar's actual footprint (72px grid + its own `max(inset, 12px)` bottom
  // padding) so page content always clears it, on platforms that report a real safe-area
  // inset (iPhone home indicator) and ones that don't (Android's gesture bar reports 0).
  const bottomNavClearance = 'calc(72px + max(env(safe-area-inset-bottom), 12px))';

  if (isMobileBare) {
    return (
      <div
        className="font-sans text-ink bg-surface min-h-screen"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: bottomNavClearance }}
      >
        <Outlet />
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div
      className="font-sans text-ink bg-cream min-h-screen flex flex-col"
      style={{ paddingBottom: isMobile ? bottomNavClearance : undefined }}
    >
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <BottomNavBar />
    </div>
  );
}
