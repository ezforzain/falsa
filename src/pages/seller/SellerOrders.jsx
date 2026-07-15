import { useEffect, useState } from 'react';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import { IconReceipt } from '../../components/icons';
import { ORDER_STATUSES, statusBadgeClass } from './statusStyles';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [rowError, setRowError] = useState(null);

  useEffect(() => {
    seller
      .orders()
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (order, status) => {
    if (status === order.status) return;
    setUpdatingId(order.id);
    setRowError(null);
    try {
      const { order: updated } = await seller.updateOrderStatus(order.id, status);
      setOrders((current) => current.map((o) => (o.id === order.id ? updated : o)));
    } catch (err) {
      setRowError({ id: order.id, message: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Orders</h1>
        <p className="text-sm text-text mt-1">Orders placed for your listings, most recent first.</p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-white border border-border rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
          <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
            <IconReceipt width="24" height="24" className="text-green" />
          </span>
          <p className="text-sm text-text">No orders yet — they'll show up here once buyers order your listings.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                  <th className="px-5 py-3 font-semibold">Buyer</th>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Qty</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-ink">{o.buyerCompany}</div>
                      <div className="text-xs text-text-muted">{o.buyerCountry}</div>
                    </td>
                    <td className="px-5 py-4 text-text-muted max-w-[180px]">{o.productName}</td>
                    <td className="px-5 py-4 text-ink-soft whitespace-nowrap">{o.qty.toLocaleString('en-US')}</td>
                    <td className="px-5 py-4 font-semibold text-ink whitespace-nowrap">{formatPKR(o.total)}</td>
                    <td className="px-5 py-4 text-text-muted whitespace-nowrap">
                      {new Date(o.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={o.status}
                        disabled={updatingId === o.id}
                        onChange={(e) => handleStatusChange(o, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border-none outline-none cursor-pointer disabled:cursor-wait disabled:opacity-60 ${statusBadgeClass(o.status)}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {rowError?.id === o.id && <div className="text-[11px] text-orange-text mt-1.5 max-w-[140px]">{rowError.message}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
