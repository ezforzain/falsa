import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconClose, IconChevronDown } from './icons';

// Static/informational links only — real navigation (categories, spotlight, cart, account)
// already lives in the bottom tab bar, so this stays a focused "About/Help" box rather than a
// full second nav menu. Destinations are placeholders (same as the desktop footer's) since
// these pages don't exist yet in the app.
const INFO_SECTIONS = [
  {
    title: 'For buyers',
    links: [
      { label: 'How it works', to: '/' },
      { label: 'Trade assurance', to: '/' },
      { label: 'Shipping & logistics', to: '/' },
    ],
  },
  {
    title: 'For sellers',
    links: [
      { label: 'Start selling', to: '/' },
      { label: 'Seller verification', to: '/' },
      { label: 'Success stories', to: '/' },
    ],
  },
];

function InfoSection({ title, links, defaultOpen = false, onNavigate }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer bg-white hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green"
      >
        <span className="text-[15px] font-semibold text-ink">{title}</span>
        <IconChevronDown
          width="16"
          height="16"
          className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col border-t border-border">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={onNavigate}
                className="px-5 py-3 text-[14px] text-text-muted no-underline hover:bg-surface-muted hover:text-ink transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Slide-up "Information" sheet — same overlay/animation convention as the app's other bottom
// sheets (see VariantBottomSheet), opened from the hamburger button in MobileTopBar.
export default function InformationDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-up" onClick={onClose} />

      <div className="relative w-full max-h-[80vh] bg-white rounded-t-[24px] shadow-2xl flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <h2 className="font-display text-lg font-bold text-ink m-0">Information</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer w-9 h-9 rounded-full bg-surface-muted hover:bg-cream-dark flex items-center justify-center transition-colors"
          >
            <IconClose width="16" height="16" className="text-ink-soft" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 flex flex-col gap-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
          <p className="text-[13.5px] text-text leading-relaxed mb-1">
            The trusted B2B marketplace — worldwide free shipping, verified sellers, secure trade.
          </p>
          {INFO_SECTIONS.map((section, i) => (
            <InfoSection key={section.title} {...section} defaultOpen={i === 0} onNavigate={onClose} />
          ))}
        </div>
      </div>
    </div>
  );
}
