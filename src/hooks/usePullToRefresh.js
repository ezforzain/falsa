import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 70; // px of downward pull needed to trigger a refresh
const MAX_PULL = 100; // caps how far the visual indicator travels

// Touch-only pull-to-refresh: arms when the page is already scrolled to the very top (so it
// never fights a normal scroll-down gesture), tracks the live pull distance in a ref (state only
// updates for the visual indicator, not on every touchmove) to avoid re-registering listeners on
// every pixel of movement. `onRefresh` should be a stable (useCallback'd) reference.
export default function usePullToRefresh(onRefresh) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshingRef.current) {
        startYRef.current = null;
        return;
      }
      startYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (startYRef.current == null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      const next = dy > 0 ? Math.min(dy, MAX_PULL) : 0;
      distanceRef.current = next;
      setPullDistance(next);
    };

    const onTouchEnd = async () => {
      if (startYRef.current == null) return;
      startYRef.current = null;
      const shouldRefresh = distanceRef.current >= THRESHOLD;
      distanceRef.current = 0;
      setPullDistance(0);
      if (!shouldRefresh) return;

      refreshingRef.current = true;
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh]);

  return { pullDistance, refreshing, threshold: THRESHOLD };
}
