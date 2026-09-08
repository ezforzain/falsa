import { useEffect, useState } from 'react';
import { IconAward } from './icons';

const SHAKE_INTERVAL_MS = 10000;

// Customer loyalty badge on the profile page — its tier comes from computeLoyaltyTier (see
// lib/loyalty.js), which reads this account's real order history, so it actually reflects
// buying behavior instead of being a static decoration. Gives itself a small attention-getting
// wiggle every 10s by swapping the wrapper's `key`, which restarts the CSS animation (a looping
// keyframe would never sit still between wiggles — see .animate-badge-shake in index.css).
export default function LoyaltyBadge({ tier }) {
  const [shakeTick, setShakeTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setShakeTick((n) => n + 1), SHAKE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  if (!tier) return null;

  const progressLabel = tier.next
    ? tier.ordersToNext === 0 && tier.spendToNext === 0
      ? `1 more delivered order unlocks ${tier.next.label}`
      : `${tier.ordersToNext} order${tier.ordersToNext === 1 ? '' : 's'} to ${tier.next.label}`
    : "You've reached the top tier";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        key={shakeTick}
        title={progressLabel}
        className={`animate-badge-shake inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border ${tier.className}`}
      >
        <IconAward width="13" height="13" />
        {tier.label}
      </span>
      <span className="text-[11px] text-text-muted">{progressLabel}</span>
    </div>
  );
}
