import { useEffect, useRef } from 'react';
import AccountMenuContent from './AccountMenuContent';
import { IconClose } from './icons';

// Facebook-style left-slide profile drawer — the mobile presentation of the account menu
// (see ProfileDropdown for the desktop dropdown version; both share AccountMenuContent).
// Opened from BottomNavBar's "My Account" tab, the mobile top bar's profile icon, and the
// hamburger button in Header (see useProfileDrawer). Always mounted (rather than conditionally
// rendered) so both the open and close transitions animate over 300ms instead of only the open
// direction.
export default function ProfileDrawer({ open, onClose }) {
  const closeBtnRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Track whether the drawer has ever been opened so its content isn't fetched/rendered
  // (and doesn't briefly flash) before the very first open.
  if (open) wasOpenRef.current = true;
  if (!wasOpenRef.current) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[120]" aria-hidden={!open} style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div
        id="profile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        className={`absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          type="button"
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green z-10"
          style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
        >
          <IconClose width="16" height="16" className="text-ink-soft" />
        </button>

        <AccountMenuContent onNavigate={onClose} />
      </div>
    </div>
  );
}
