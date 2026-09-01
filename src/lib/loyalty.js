// Customer loyalty tier shown on the profile page (see LoyaltyBadge.jsx) — derived purely from
// this account's own order history (GET /api/orders), no separate loyalty system on the backend.
// Delivered orders are what count: a cart full of Pending/Cancelled orders isn't loyalty, an
// order the seller actually fulfilled is.
const TIERS = [
  { key: 'new', label: 'New Customer', minOrders: 0, minSpend: 0, className: 'bg-surface-muted text-text-muted border-border' },
  { key: 'bronze', label: 'Bronze Member', minOrders: 2, minSpend: 8000, className: 'bg-[#F4E9DD] text-[#8A5A2B] border-[#E3C8A4]' },
  { key: 'silver', label: 'Silver Member', minOrders: 6, minSpend: 25000, className: 'bg-[#EAEEF2] text-[#546374] border-[#CBD5E0]' },
  { key: 'gold', label: 'Gold Member', minOrders: 12, minSpend: 75000, className: 'bg-[#FBF0D3] text-[#8A6D1A] border-[#EFD48A]' },
  { key: 'platinum', label: 'Platinum Member', minOrders: 25, minSpend: 200000, className: 'bg-gradient-to-r from-[#E8F3EE] to-[#DCEEE6] text-green border-green/30' },
];

export function computeLoyaltyTier(orders = []) {
  const delivered = orders.filter((o) => o.status === 'Delivered');
  const deliveredCount = delivered.length;
  const totalSpend = delivered.reduce((sum, o) => sum + (o.total || 0), 0);

  // Highest tier whose thresholds are both met by either signal (order count OR total spend) —
  // a shopper with a few very large orders shouldn't rank below one with many tiny ones, and
  // vice versa.
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (deliveredCount >= tier.minOrders || totalSpend >= tier.minSpend) current = tier;
  }

  const currentIndex = TIERS.indexOf(current);
  const next = TIERS[currentIndex + 1] || null;
  const ordersToNext = next ? Math.max(next.minOrders - deliveredCount, 0) : 0;
  const spendToNext = next ? Math.max(next.minSpend - totalSpend, 0) : 0;

  return {
    ...current,
    deliveredCount,
    totalSpend,
    next,
    ordersToNext,
    spendToNext,
  };
}
