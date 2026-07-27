import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position on navigation by default, so switching pages (e.g.
// Cart -> Messenger) kept whatever scroll offset the previous page was at, landing the new page
// half-scrolled with its heading cut off under the fixed header. Mounted once near the root,
// above <Routes>, so every route change scrolls back to the top automatically.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
