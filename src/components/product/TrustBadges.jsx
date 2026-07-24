import { IconShield, IconWallet, IconGlobe, IconReceipt } from '../icons';

const BADGES = [
  { icon: IconShield, label: 'Verified Seller' },
  { icon: IconWallet, label: 'Secure Payment' },
  { icon: IconGlobe, label: 'Worldwide Shipping' },
  { icon: IconReceipt, label: 'Trade Assurance' },
];

// Four-up trust-signal strip shown under the price block on the Product Detail page — the
// quick "why buy from us" reassurance that B2B marketplaces (Alibaba, Made-in-China) lead with.
export default function TrustBadges({ className = '' }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${className}`}>
      {BADGES.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="min-w-0 flex items-center gap-2 bg-green-tint border border-green-tint-border rounded-xl px-3 py-2.5"
        >
          <Icon className="text-green shrink-0" width="16" height="16" />
          <span className="text-[11.5px] sm:text-xs font-semibold text-ink-soft leading-tight truncate">{label}</span>
        </div>
      ))}
    </div>
  );
}
