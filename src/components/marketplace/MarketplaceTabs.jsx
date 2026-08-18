import { IconBox, IconGlobe, IconSparkle, IconTruck } from '../icons';

// Fixed order per spec: B2B → Spotlight → Worldwide → Free Shipping. Keys match the existing
// MobileTab seed data (server/src/seed/data.js) so this bar and the mobile tab row stay in sync.
export const MARKETPLACE_TABS = [
  { key: 'aimode', label: 'B2B', Icon: IconBox },
  { key: 'spotlight', label: 'Spotlight', Icon: IconSparkle },
  { key: 'worldwide', label: 'Worldwide', Icon: IconGlobe },
  { key: 'freeshipping', label: 'Free Shipping', Icon: IconTruck },
];

// Shared tab bar for Desktop Home, Search, and (implicitly, via the same keys) Mobile Home.
// `activeTab` may be null — no marketplace section selected, i.e. today's default browsing view.
// Clicking the already-active tab clears it back to that default (toggle, not one-way).
export default function MarketplaceTabs({ activeTab, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      aria-label="Marketplace sections"
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar ${className}`}
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
            className={`relative flex items-center gap-1.5 shrink-0 whitespace-nowrap px-4 py-2.5 text-[13.5px] font-semibold cursor-pointer transition-colors border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green ${
              isActive ? 'border-green text-green' : 'border-transparent text-ink-soft hover:text-ink hover:border-border-strong'
            }`}
          >
            <Icon width="15" height="15" strokeWidth={isActive ? 2.4 : 2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
