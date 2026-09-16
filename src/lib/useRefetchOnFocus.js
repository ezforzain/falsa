import { useEffect, useRef } from 'react';

// Re-runs `refetch` when this tab regains focus or becomes visible again — used by order lists
// (seller/admin/buyer) so switching back from another tab or window (e.g. after shipping an
// order from a different role's session, or the buyer checking their own order after the seller
// shipped it) shows current data without a manual page reload. A ref keeps the effect from
// re-subscribing every render even though `refetch` is a fresh closure each time.
export function useRefetchOnFocus(refetch) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') refetchRef.current();
    };
    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, []);
}
