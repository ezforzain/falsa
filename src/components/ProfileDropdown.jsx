import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AccountMenuContent from './AccountMenuContent';
import { IconMenu, IconClose } from './icons';

// Desktop presentation of the account menu — a dropdown anchored under a hamburger button in
// Header's top-right corner, instead of the full-height slide-in drawer mobile gets (see
// ProfileDrawer). Both share AccountMenuContent so the two never drift out of sync.
export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const triggerRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const toggle = () => {
    setAnchorRect(triggerRef.current?.getBoundingClientRect() ?? null);
    setOpen((v) => !v);
  };

  // Same "mount once, then just toggle transition classes" trick as ProfileDrawer — needed so
  // the CLOSE transition actually animates too, instead of the panel just vanishing.
  if (open) wasOpenRef.current = true;

  return (
    <div className="relative">
      <button
        type="button"
        ref={triggerRef}
        onClick={toggle}
        aria-label="Account menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="cursor-pointer w-10 h-10 ml-1 rounded-lg flex items-center justify-center text-text hover:bg-surface-muted transition-colors"
      >
        <IconMenu />
      </button>

      {wasOpenRef.current &&
        anchorRect &&
        createPortal(
          <>
            {/* Transparent full-screen catcher — closes the dropdown on any outside click (and
                swallows that click, rather than letting it also activate whatever's
                underneath) without dimming the page the way the mobile drawer's overlay does.
                Header has `backdrop-blur-md`, which (like any `filter`/`transform`) makes it
                the containing block for `position: fixed` descendants instead of the viewport
                — a `fixed inset-0` nested inside Header would only cover Header's own small
                box. Portaling to `document.body` sidesteps that entirely. */}
            <div
              className={`fixed inset-0 z-[110] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
              style={{ pointerEvents: open ? 'auto' : 'none' }}
              aria-hidden="true"
              onClick={() => setOpen(false)}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Account menu"
              className={`fixed w-[360px] max-h-[calc(100vh-96px)] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col z-[120] origin-top-right transition-all duration-200 ease-out ${
                open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
              }`}
              style={{ top: anchorRect.bottom + 8, left: anchorRect.right - 360 }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-4 top-4 w-9 h-9 rounded-full bg-surface/70 hover:bg-surface flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green z-10"
              >
                <IconClose width="16" height="16" className="text-ink-soft" />
              </button>

              <AccountMenuContent onNavigate={() => setOpen(false)} />
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
