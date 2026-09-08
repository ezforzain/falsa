import { Link } from 'react-router-dom';
import { IconClock, IconBox, IconTruck, IconCheck, IconRotateCcw } from './icons';

// Daraz-style "My Orders" quick-access row on the profile page — one tile per real order status
// (see ORDER_STATUSES in pages/seller/statusStyles.js), each linking straight into OrdersPage
// pre-filtered to it (?status=...). Counts come from the same orders list AccountPage already
// fetches for the loyalty badge, so this stays in sync with real data rather than being static.
const TILES = [
  { status: 'Pending', label: 'To Ship', icon: IconClock },
  { status: 'Processing', label: 'Processing', icon: IconBox },
  { status: 'Shipped', label: 'To Receive', icon: IconTruck },
  { status: 'Delivered', label: 'Completed', icon: IconCheck },
  { status: 'Cancelled', label: 'Cancelled', icon: IconRotateCcw },
];

export default function OrderStatusQuickLinks({ orders = [] }) {
  const countByStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-surface border border-border rounded-2xl px-2 py-4 sm:px-4">
      <div className="flex items-center justify-between px-2.5 mb-3.5">
        <h3 className="text-[13.5px] font-bold text-ink">My Orders</h3>
        <Link to="/orders" className="text-[12px] font-semibold text-green hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {TILES.map(({ status, label, icon: Icon }) => {
          const count = countByStatus[status] || 0;
          return (
            <Link
              key={status}
              to={`/orders?status=${encodeURIComponent(status)}`}
              className="relative flex flex-col items-center gap-1.5 py-1.5 rounded-xl no-underline text-inherit hover:bg-surface-muted transition-colors"
            >
              <span className="relative w-9 h-9 rounded-full bg-green-tint flex items-center justify-center text-green">
                <Icon width="16" height="16" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-orange text-white text-[9.5px] font-bold flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
              <span className="text-[10.5px] font-medium text-ink-soft text-center leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
