import { IconBox, IconGlobe, IconSparkle, IconTruck } from '../icons';

// Fixed order per spec: B2B → Spotlight → Worldwide → Free Shipping. Keys match the existing
// MobileTab seed data (server/src/seed/data.js) so this bar and the mobile tab row stay in sync.
export const MARKETPLACE_TABS = [
  { key: 'aimode', label: 'B2B', Icon: IconBox },
  { key: 'spotlight', label: 'Spotlight', Icon: IconSparkle },
  { key: 'worldwide', label: 'Worldwide', Icon: IconGlobe },
  { key: 'freeshipping', label: 'Free Shipping', Icon: IconTruck },
];

// Home-only accent (see MobileHome/DesktopHome) — kept local rather than a global token since
// no other page uses it, and it's deliberately distinct from the admin panel's own violet.
const ACCENT = '#6C63FF';

// Shared tab bar for Desktop Home, Search, and (implicitly, via the same keys) Mobile Home.
// `activeTab` may be null — no marketplace section selected, i.e. today's default browsing view.
// Clicking the already-active tab clears it back to that default (toggle, not one-way). Rendered
// as a segmented pill control (one solid active pill) rather than underlined tabs.
export default function MarketplaceTabs({ activeTab, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      aria-label="Marketplace sections"
      className={`flex items-center gap-1 rounded-full bg-surface-muted p-1 overflow-x-auto no-scrollbar ${className}`}
    >
      {MARKETPLACE_TABS.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(isActive ? null : key)}
            className={`relative flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[13.5px] font-semibold cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isActive ? 'text-white shadow-sm' : 'text-ink-soft hover:text-ink'
            }`}
            style={isActive ? { background: ACCENT, outlineColor: ACCENT } : undefined}
          >
            <Icon width="15" height="15" strokeWidth={isActive ? 2.4 : 2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
