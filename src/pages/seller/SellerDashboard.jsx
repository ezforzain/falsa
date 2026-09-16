import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import { IconArrowRight, IconBox, IconReceipt } from '../../components/icons';
import SellerCard from '../../components/seller/SellerCard';
import StatCard from '../../components/seller/StatCard';
import StatusChipMenu from '../../components/seller/StatusChipMenu';
import { ORDER_CHIP } from './statusChipPalette';

const RING_COLORS = { Total: '#5B8DEF', Pending: '#E0B64B', Shipped: '#4FD1C5' };

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([seller.stats(), seller.orders(), seller.payouts()])
      .then(([statsRes, ordersRes, payoutsRes]) => {
        if (cancelled) return;
        setStats(statsRes.stats);
        setOrders(ordersRes.orders);
        setPayouts(payoutsRes);
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

  const recentOrders = orders.slice(0, 5);
  const shippedCount = orders.filter((o) => o.status === 'Shipped').length;

  return (
    <div className="animate-fade-up flex flex-col gap-[18px]">
      {error && <div className="bg-surface border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>}

      {!error && (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse bg-surface border border-border rounded-[20px] h-[132px]" />)
            ) : (
              <>
                <StatCard label="Total revenue" value={formatPKR(stats.totalRevenue)} note="Lifetime gross sales" />
                <SellerCard eyebrow="Orders">
                  <div className="flex gap-4">
                    {[
                      { label: 'Total', value: stats.totalOrders },
                      { label: 'Pending', value: stats.pendingOrders },
                      { label: 'Shipped', value: shippedCount },
                    ].map((ring) => (
                      <div key={ring.label} className="flex flex-col items-center gap-1.5">
                        <span
                          className="w-[54px] h-[54px] rounded-full border-[3px] flex items-center justify-center font-extrabold text-[17px] text-ink"
                          style={{ borderColor: RING_COLORS[ring.label] }}
                        >
                          {ring.value}
                        </span>
                        <span className="text-[11px] text-text">{ring.label}</span>
                      </div>
                    ))}
                  </div>
                </SellerCard>
                <SellerCard eyebrow="Active listings">
                  <div className="text-[28px] font-extrabold tracking-[-0.8px] text-ink">
                    {stats.activeListings} <span className="text-text-muted text-xl">/ {stats.totalListings}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden mt-3">
                    <div
                      className="h-full bg-green"
                      style={{ width: `${stats.totalListings ? (stats.activeListings / stats.totalListings) * 100 : 0}%` }}
                    />
                  </div>
                </SellerCard>
              </>
            )}
          </div>

          {!loading && payouts && (
            <SellerCard
              eyebrow="Your payout balance"
              action={
                <Link to="/seller/payouts" className="text-[12.5px] font-bold text-green hover:underline no-underline">
                  Previous transactions
                </Link>
              }
            >
              <Link to="/seller/payouts" className="text-sm text-text no-underline hover:underline">
                TOTAL: <span className="text-2xl font-extrabold tracking-[-0.6px] text-ink">{formatPKR(Math.max(payouts.pendingBalance, 0))}</span>{' '}
                <span className="text-[12.5px] font-bold text-green">View balance →</span>
              </Link>
            </SellerCard>
          )}

          <SellerCard
            eyebrow="Recent orders"
            action={
              <Link to="/seller/orders" className="text-[12.5px] font-bold text-green flex items-center gap-1 no-underline hover:gap-1.5 transition-all">
                Check all
                <IconArrowRight width="12" height="12" strokeWidth="2.2" />
              </Link>
            }
          >
            {loading ? (
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-14 bg-surface-muted rounded-2xl" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-6 text-center text-sm text-text flex flex-col items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-green-tint inline-flex items-center justify-center">
                  <IconReceipt width="20" height="20" className="text-green" />
                </span>
                No orders yet — they'll show up here once buyers order your listings.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="grid items-center gap-3 px-3.5 py-3 rounded-2xl bg-surface-muted border border-border"
                    style={{ gridTemplateColumns: 'minmax(0,2fr) 1fr 1fr 110px' }}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-lg overflow-hidden bg-surface border border-border flex items-center justify-center shrink-0">
                        {o.productImg ? <img src={o.productImg} alt="" className="w-full h-full object-cover" /> : <IconBox width="15" height="15" className="text-text-muted" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-bold text-ink truncate">{o.buyerCompany}</span>
                        <span className="block text-[11.5px] text-text-muted truncate">{o.productName}</span>
                      </span>
                    </span>
                    <span className="text-[12.5px] text-text hidden sm:block">
                      {new Date(o.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-[13.5px] font-bold text-ink">{formatPKR(o.total)}</span>
                    <span className="justify-self-start">
                      <StatusChipMenu status={o.status} palette={ORDER_CHIP} readOnly />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SellerCard>
        </>
      )}
    </div>
  );
}
