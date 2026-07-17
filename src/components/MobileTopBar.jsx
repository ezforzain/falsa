import { useState } from 'react';
import { useProfileDrawer } from '../context/ProfileDrawerContext';
import { IconLogo, IconMenu, IconUser } from './icons';
import InformationDrawer from './InformationDrawer';

// Lightweight top bar for the "bare" mobile screens (Home, Spotlight) that skip the desktop
// Header/Footer chrome — wordmark, a profile icon into the left-slide profile drawer, and a
// hamburger into the Information sheet. Real navigation on these screens otherwise lives in the
// bottom tab bar.
export default function MobileTopBar() {
  const [infoOpen, setInfoOpen] = useState(false);
  const { open: openProfileDrawer } = useProfileDrawer();

  return (
    <>
      <div className="flex items-center gap-2 px-4 pt-4 pb-1">
        <span className="w-8 h-8 rounded-lg bg-green flex items-center justify-center shrink-0">
          <IconLogo width="16" height="16" />
        </span>
        <span className="font-display text-lg font-bold text-green tracking-tight flex-1">
          Falsafah<span className="text-orange">Tot</span>
        </span>
        <button
          type="button"
          onClick={openProfileDrawer}
          aria-label="Open profile menu"
          aria-haspopup="dialog"
          className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center bg-green-tint text-green hover:bg-green/15 active:scale-95 transition-all shrink-0"
        >
          <IconUser width="18" height="18" />
        </button>
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
