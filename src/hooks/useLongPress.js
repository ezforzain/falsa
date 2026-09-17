import { useRef } from 'react';

const DURATION_MS = 480;
const MOVE_CANCEL_PX = 12; // finger drifting this far reads as a scroll attempt, not a long-press

// Touch-only long-press (WhatsApp-style message actions) — a timer armed on touchstart, fired if
// still pressed after DURATION_MS, cancelled by any real movement (scrolling) or an early
// lift-off. `onLongPress(event)` should be stable (useCallback'd) since it's read from a ref, not
// a dependency, so callers don't need to worry about re-arming the handlers every render.
export function useLongPress(onLongPress) {
  const timerRef = useRef(null);
  const startRef = useRef({ x: 0, y: 0 });
  const callbackRef = useRef(onLongPress);
  callbackRef.current = onLongPress;

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const onTouchStart = (e) => {
    const touch = e.touches?.[0];
    startRef.current = { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
    clear();
    timerRef.current = setTimeout(() => callbackRef.current(e), DURATION_MS);
  };

  const onTouchMove = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clear();
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: clear,
    onTouchCancel: clear,
  };
}
