import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MENU_WIDTH = 200;
const MARGIN = 8; // keeps the menu off the viewport edge on small screens

// Small anchored popup for a chat bubble's action menu (long-press on mobile, the 3-dot button
// on desktop — see ConversationPage/SellerMessages) — same portal + outside-click-catcher
// technique as ProfileDropdown, just compact and anchored to an arbitrary point/rect instead of
// always a fixed corner, since a message bubble can be anywhere on screen (and left- or
// right-aligned depending on who sent it).
//
// `anchorRect` — a DOMRect-like `{ top, bottom, left, right }` to open below-and-aligned-to (the
// 3-dot button, or a synthetic 1x1 rect at the long-press point). `items` — array of
// `{ key, label, danger, keepOpen, onSelect }`; clicking one calls onSelect, then closes the menu
// unless `keepOpen` is set (used by the root "Delete" item, which swaps the same menu's contents
// to the delete-scope choices rather than dismissing it). `themeClass` — pass 'seller-portal' (or
// 'admin-shell') when opening this from inside one of those scoped-theme subtrees: portaling to
// document.body moves the menu outside that subtree in the DOM, so it'd otherwise fall back to
// the site's default light theme instead of matching the surrounding navy/violet screen.
export default function MessageActionMenu({ open, anchorRect, items, onClose, themeClass }) {
  const wasOpenRef = useRef(false);
  const [placement, setPlacement] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !anchorRect) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuHeight = items.length * 40 + 8;
    // Prefer opening below-right of the anchor, like a native context menu; flip to whichever
    // side keeps it fully on screen instead of clipping.
    const left = Math.min(Math.max(anchorRect.left, MARGIN), vw - MENU_WIDTH - MARGIN);
    const top =
      anchorRect.bottom + menuHeight + MARGIN <= vh
        ? anchorRect.bottom + 6
        : Math.max(anchorRect.top - menuHeight - 6, MARGIN);
    setPlacement({ top, left });
  }, [open, anchorRect, items.length]);

  if (open) wasOpenRef.current = true;
  if (!wasOpenRef.current) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[110] transition-opacity duration-150 ${open ? 'opacity-100' : 'opacity-0'}`}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        aria-hidden="true"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      {placement && (
        <div
          role="menu"
          className={`fixed z-[120] bg-surface rounded-xl shadow-2xl border border-border overflow-hidden py-1 transition-all duration-150 ease-out ${themeClass || ''} ${
            open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}
          style={{ top: placement.top, left: placement.left, width: MENU_WIDTH }}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onSelect();
                if (!item.keepOpen) onClose();
              }}
              className={`cursor-pointer w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-surface-muted transition-colors ${
                item.danger ? 'text-orange-text' : 'text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>,
    document.body
  );
}
