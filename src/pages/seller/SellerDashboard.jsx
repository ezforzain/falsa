import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import { IconArrowRight, IconBox, IconReceipt, IconTrendingUp, IconWallet } from '../../components/icons';
import { statusBadgeClass } from './statusStyles';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([seller.stats(), seller.orders()])
      .then(([statsRes, ordersRes]) => {
        if (cancelled) return;
        setStats(statsRes.stats);
        setRecentOrders(ordersRes.orders.slice(0, 5));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = stats
    ? [
        { label: 'Total revenue', value: formatPKR(stats.totalRevenue), icon: IconWallet, tint: 'bg-green-tint text-green' },
        { label: 'Total orders', value: stats.totalOrders, icon: IconReceipt, tint: 'bg-orange-tint text-orange-text' },
        { label: 'Active listings', value: `${stats.activeListings} / ${stats.totalListings}`, icon: IconBox, tint: 'bg-green-tint text-green' },
        { label: 'Pending orders', value: stats.pendingOrders, icon: IconTrendingUp, tint: 'bg-orange-tint text-orange-text' },
      ]
    : [];

  return (
    <div className="animate-fade-up">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Welcome back, {user.companyName}</h1>
          <p className="text-sm text-text mt-1">Here's how your storefront is performing.</p>
        </div>
        <Link
          to="/seller/products"
          className="cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-sm px-5 py-2.5 rounded-full no-underline transition-colors"
        >
          Manage listings
        </Link>
      </div>

      {error && <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>}

      {!error && (
        <>
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white border border-border rounded-2xl p-5 h-[104px]" />
                ))
              : cards.map((card) => (
                  <div key={card.label} className="bg-white border border-border rounded-2xl p-5">
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.tint}`}>
                      <card.icon width="17" height="17" />
                    </span>
                    <div className="font-display text-xl font-bold text-ink">{card.value}</div>
                    <div className="text-xs text-text-muted mt-0.5">{card.label}</div>
                  </div>
                ))}
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-base font-bold text-ink">Recent orders</h2>
              <Link to="/seller/orders" className="text-sm font-semibold text-green flex items-center gap-1 no-underline hover:gap-1.5 transition-all">
                View all
                <IconArrowRight width="13" height="13" strokeWidth="2.2" />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-10 bg-surface-muted rounded-lg" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-text">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-ink">{o.buyerCompany}</div>
                          <div className="text-xs text-text-muted">{o.productName}</div>
                        </td>
                        <td className="px-5 py-3.5 text-text-muted whitespace-nowrap hidden sm:table-cell">
                          {new Date(o.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-ink whitespace-nowrap">{formatPKR(o.total)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadgeClass(o.status)}`}>{o.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
