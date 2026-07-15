import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementStrip from '../components/AnnouncementStrip';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNavBar from '../components/BottomNavBar';
import useIsMobile from '../hooks/useIsMobile';

export default function MainLayout() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const isMobileHome = isMobile && pathname === '/';

  if (isMobileHome) {
    return (
      <div className="font-sans text-ink bg-white min-h-screen pb-[76px]">
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
