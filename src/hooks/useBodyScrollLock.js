import { useEffect } from 'react';

// Locks the page behind a modal/bottom-sheet from scrolling while it's open. Every `fixed
// inset-0` overlay in the app (QuantityModal, VariantBottomSheet, the admin/seller form modals,
// EditProfileSheet, InformationDrawer…) wants this same behavior — centralized here instead of
// each one reimplementing document.body.style.overflow toggling (or, as most of them did, simply
// not doing it at all, which let the page behind the overlay keep scrolling on mobile touch-drag).
//
// Captures the previous inline value and restores exactly that (not a hardcoded '') on cleanup,
// so this stays correct even if two overlays are ever open at once — the outer one's lock isn't
// clobbered by the inner one unlocking first.
export default function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
