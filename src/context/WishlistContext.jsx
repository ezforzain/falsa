import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNotifications } from './NotificationsContext';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'falsafahtot_wishlist';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeStored(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage unavailable (private browsing etc.) — wishlist just won't persist this session.
  }
}

// No backend concept of a saved-items list exists (unlike cart, which is server-backed for
// checkout) — plain localStorage, wrapped in a Context (rather than the plain-function
// approach in lib/recentlyViewed.js) because the heart icon needs to re-render live across
// every card/detail page showing the same product, not just read once per page load.
export function WishlistProvider({ children }) {
  const { notify } = useNotifications();
  const [ids, setIds] = useState(() => readStored());

  useEffect(() => {
    writeStored(ids);
  }, [ids]);

  // Reads `ids` directly (rather than deciding add-vs-remove inside the setIds updater) so the
  // notify() call — which updates NotificationsContext's state — never fires from inside a
  // different context's state-updater function; React flags that as an unsafe cross-component
  // setState during render.
  const toggle = useCallback(
    (productId, productName) => {
      const isRemoving = ids.has(productId);
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
      if (!isRemoving) {
        notify(
          'wishlist',
          'Saved to wishlist',
          productName ? `${productName} was added to your wishlist.` : 'Item added to your wishlist.'
        );
      }
    },
    [ids, notify]
  );

  const has = useCallback((productId) => ids.has(productId), [ids]);

  const value = { ids: [...ids], has, toggle, count: ids.size };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
