import useIsMobile from '../hooks/useIsMobile';
import DesktopHome from './DesktopHome';
import MobileHome from './MobileHome';

export default function HomePage() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileHome /> : <DesktopHome />;
}
