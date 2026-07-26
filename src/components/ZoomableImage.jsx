import { useEffect, useRef, useState } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 24;
const SWIPE_DISTANCE = 60;
const SWIPE_MAX_VERTICAL = 60;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Full-screen image preview with real pinch-to-zoom (two-finger), pan-while-zoomed (drag), and
 * double-tap/double-click to toggle zoom — built on the Pointer Events API so touch, mouse, and
 * pen all go through the same code path. When not zoomed in, a left/right swipe instead requests
 * the previous/next image via `onSwipeLeft`/`onSwipeRight` (both optional), matching a native
 * photo-viewer feel. Resets to 1x whenever `resetKey` changes (e.g. the active image index).
 */
export default function ZoomableImage({ src, alt, resetKey, onSwipeLeft, onSwipeRight, className = '' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [dragging, setDragging] = useState(false);

  const pointers = useRef(new Map());
  const pinchStart = useRef(null); // { distance, scale }
  const panStart = useRef(null); // { x, y, translateX, translateY }
  const lastTap = useRef(null); // { time, x, y }
  const swipeStart = useRef(null); // { x, y } — only set for a single-pointer gesture at scale 1

  // Reset zoom/pan whenever the image being shown changes.
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setOrigin({ x: 50, y: 50 });
  }, [resetKey]);

  const clampScale = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const toggleZoomAt = (clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const originX = ((clientX - rect.left) / rect.width) * 100;
    const originY = ((clientY - rect.top) / rect.height) * 100;
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setOrigin({ x: originX, y: originY });
      setScale(DOUBLE_TAP_SCALE);
      setTranslate({ x: 0, y: 0 });
    }
  };

  const onPointerDown = (e) => {
    containerRef.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { distance: distance(a, b), scale };
      const mid = midpoint(a, b);
      const rect = containerRef.current.getBoundingClientRect();
      setOrigin({ x: ((mid.x - rect.left) / rect.width) * 100, y: ((mid.y - rect.top) / rect.height) * 100 });
      swipeStart.current = null;
      panStart.current = null;
    } else if (pointers.current.size === 1) {
      const now = Date.now();
      if (lastTap.current && now - lastTap.current.time < DOUBLE_TAP_MS && distance(lastTap.current, { x: e.clientX, y: e.clientY }) < DOUBLE_TAP_SLOP) {
        toggleZoomAt(e.clientX, e.clientY);
        lastTap.current = null;
        swipeStart.current = null;
        return;
      }
      lastTap.current = { time: now, x: e.clientX, y: e.clientY };

      if (scale > 1) {
        panStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
        setDragging(true);
      } else {
        swipeStart.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const newDistance = distance(a, b);
      const nextScale = clampScale(pinchStart.current.scale * (newDistance / pinchStart.current.distance));
      setScale(nextScale);
      return;
    }

    if (pointers.current.size === 1 && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTranslate({ x: panStart.current.tx + dx, y: panStart.current.ty + dy });
    }
  };

  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);

    if (pointers.current.size < 2) pinchStart.current = null;

    if (pointers.current.size === 0) {
      if (swipeStart.current && scale === 1) {
        const dx = e.clientX - swipeStart.current.x;
        const dy = e.clientY - swipeStart.current.y;
        if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dy) < SWIPE_MAX_VERTICAL) {
          if (dx < 0) onSwipeLeft?.();
          else onSwipeRight?.();
        }
      }
      swipeStart.current = null;
      panStart.current = null;
      setDragging(false);
      // Snap back to 1x if a pinch left the image very close to its resting scale, so tiny
      // gesture noise doesn't leave it stuck at e.g. 1.02x with panning half-enabled.
      if (scale < 1.05) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden touch-none select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={(e) => toggleZoomAt(e.clientX, e.clientY)}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="w-full h-full object-contain pointer-events-none"
        style={{
          transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
        }}
      />
    </div>
  );
}
