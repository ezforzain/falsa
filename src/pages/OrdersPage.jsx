import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { myOrders } from '../lib/api';
import { formatPKR } from '../data/mockData';
import { IconUser, IconReceipt, IconTruck } from '../components/icons';
import { statusBadgeClass } from './seller/statusStyles';

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    myOrders
      .list()
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
        <div className="max-w-[640px] mx-auto text-center py-14 sm:py-[60px] px-6 bg-surface border border-border rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-8px_rgba(0,0,0,0.08)]">
          <span className="w-16 h-16 rounded-full bg-green-tint inline-flex items-center justify-center mb-5">
            <IconUser width="24" height="24" className="text-green" />
          </span>
          <p className="text-[17px] font-bold text-ink mb-1.5 font-display tracking-tight">You're not signed in</p>
          <p className="text-sm text-text-muted mb-7 max-w-[280px] mx-auto leading-relaxed">Sign in to see your orders and delivery status.</p>
          <Link
            to="/auth"
            className="cursor-pointer inline-flex items-center gap-2 bg-green hover:bg-green-hover text-white font-semibold text-sm px-7 py-3.5 rounded-full no-underline shadow-[0_8px_20px_rgba(14,90,70,0.25)] transition-all"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">My Orders</h1>
        <p className="text-sm text-text mt-1">Everything you've bought, with live shipping and tracking status.</p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-24 bg-surface border border-border rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-surface border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="bg-surface border border-dashed border-border-strong rounded-2xl p-10 text-center">
          <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
            <IconReceipt width="24" height="24" className="text-green" />
          </span>
          <p className="text-sm text-text">No orders yet — they'll show up here once you check out.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
              {o.productImg && (
                <img src={o.productImg} alt={o.productName} className="w-full sm:w-20 h-32 sm:h-20 rounded-xl object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{o.productName}</p>
                    <p className="text-[12.5px] text-text-muted mt-0.5">
                      Qty {o.qty} · {formatPKR(o.total)} · {new Date(o.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusBadgeClass(o.status)}`}>{o.status}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-border/70">
                  {o.shippingMethod ? (
                    <div className="flex items-center gap-2 flex-wrap text-[12.5px]">
                      <IconTruck width="14" height="14" className="text-green shrink-0" />
                      <span className="text-ink-soft">
                        Shipped via <strong className="text-ink">{o.courierName}</strong> · Tracking:{' '}
                        <strong className="text-ink">{o.trackingId}</strong>
                      </span>
                      {o.labelUrl && (
                        <a href={o.labelUrl} download className="text-green font-semibold hover:underline">
                          Download label
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12.5px] text-text-muted">Not shipped yet — the seller is still processing this order.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
