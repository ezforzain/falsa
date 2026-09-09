import { useEffect } from 'react';

// Module-scope (not per-hook-instance) lock state, reference-counted so nested overlays — one
// opened from within another, e.g. a confirm dialog on top of this same sheet — don't clobber
// each other: only the outermost lock/unlock actually touches the DOM.
let lockCount = 0;
let savedScrollY = 0;
let savedBodyStyle = null;

function lockScroll() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    const { style } = document.body;
    savedBodyStyle = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
      overflow: style.overflow,
    };
    // `overflow: hidden` alone is what most implementations reach for, and it's enough on
    // desktop — but it does NOT reliably stop touch-drag scrolling on iOS Safari or a lot of
    // Android browsers/WebViews, which keep panning the page behind a "locked" overlay. Pinning
    // the body with `position: fixed` at its negative current scroll offset removes it from the
    // document flow entirely, so there's nothing left for a touch-drag to scroll — the standard,
    // actually-robust technique (same one libraries like body-scroll-lock use).
    style.position = 'fixed';
    style.top = `-${savedScrollY}px`;
    style.left = '0';
    style.right = '0';
    style.width = '100%';
    style.overflow = 'hidden';
  }
  lockCount += 1;
}

function unlockScroll() {
  lockCount = Math.max(lockCount - 1, 0);
  if (lockCount === 0 && savedBodyStyle) {
    const { style } = document.body;
    style.position = savedBodyStyle.position;
    style.top = savedBodyStyle.top;
    style.left = savedBodyStyle.left;
    style.right = savedBodyStyle.right;
    style.width = savedBodyStyle.width;
    style.overflow = savedBodyStyle.overflow;
    savedBodyStyle = null;
    // Pinning via position:fixed didn't actually move the page, but un-pinning does need this —
    // without it the browser drops back to scrollTop 0 the instant `position: fixed` is removed.
    window.scrollTo(0, savedScrollY);
  }
}

// Locks the page behind a modal/bottom-sheet from scrolling while it's open. Every `fixed
// inset-0` overlay in the app (QuantityModal, VariantBottomSheet, the admin/seller form modals,
// EditProfileSheet, InformationDrawer…) wants this same behavior — centralized here instead of
// each one reimplementing its own body-scroll toggling (or, as most of them did, simply not doing
// it at all, which let the page behind the overlay keep scrolling/getting tapped on mobile
// touch-drag).
export default function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    lockScroll();
    return unlockScroll;
  }, [active]);
}
