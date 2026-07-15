import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementStrip from '../components/AnnouncementStrip';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNavBar from '../components/BottomNavBar';
import useIsMobile from '../hooks/useIsMobile';

export default function MainLayout() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  // On mobile, these routes get their own full-screen presentation — Home and Spotlight are
  // meant to read as endless product feeds (no footer/info block breaking up the scroll), and
  // Account already has BottomNavBar as its only navigation chrome. The marketing announcement
  // strip and desktop-style Header/Footer would just be clutter above the bottom tab bar.
  // Desktop still gets full chrome everywhere since it has no bottom nav to fall back on.
  const BARE_MOBILE_ROUTES = ['/', '/spotlight', '/account'];
  const isMobileBare = isMobile && BARE_MOBILE_ROUTES.includes(pathname);

  if (isMobileBare) {
    return (
      <div className="font-sans text-ink bg-white min-h-screen pb-[76px]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <Outlet />
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="font-sans text-ink bg-cream min-h-screen flex flex-col pb-[76px] md:pb-0">
      <AnnouncementStrip />
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <BottomNavBar />
    </div>
  );
}
