import { useState } from 'react';
import { IconMenu } from './icons';
import InformationDrawer from './InformationDrawer';
import logoMark from '../assets/logo-mark.png';

// Lightweight top bar for the "bare" mobile screens (Home, Spotlight) that skip the desktop
// Header/Footer chrome — just the wordmark and a hamburger into the Information sheet. The
// account menu lives only on the bottom nav's "My Account" tab and the My Profile page itself,
// not here — real navigation otherwise lives in the bottom tab bar.
export default function MobileTopBar() {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 px-4 pt-4 pb-1">
        <img src={logoMark} alt="" className="w-8 h-8 object-contain shrink-0" />
        <span className="font-display text-lg font-bold text-green tracking-tight flex-1">
          Falsafah<span className="text-orange">Tot</span>
        </span>
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          aria-label="Information"
          className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-surface-muted active:scale-95 transition-all shrink-0"
        >
          <IconMenu width="20" height="20" />
        </button>
      </div>

      <InformationDrawer open={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}
