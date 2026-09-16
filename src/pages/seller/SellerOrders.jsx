import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seller } from '../../lib/api';
import { friendlyShippingError } from '../../lib/shipping';
import { useRefetchOnFocus } from '../../lib/useRefetchOnFocus';
import { getSellerReadiness } from '../../lib/sellerReadiness';
import { formatPKR } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { IconBox, IconReceipt } from '../../components/icons';
import TrackingWidget from '../../components/TrackingWidget';
import ShipOrderModal from '../../components/seller/ShipOrderModal';
import StatCard from '../../components/seller/StatCard';
import StatusChipMenu from '../../components/seller/StatusChipMenu';
import { ORDER_STATUSES } from './statusStyles';
import { ORDER_CHIP } from './statusChipPalette';

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [rowError, setRowError] = useState(null);
  const [shippingOrder, setShippingOrder] = useState(null);
  // Live TCS tracking, fetched per row on demand (see GET /api/seller/orders/:id/tcs/track).
  const [trackingById, setTrackingById] = useState({});
  const [trackingLoadingId, setTrackingLoadingId] = useState(null);

  const { bankComplete, pickupComplete } = getSellerReadiness(user);

  const loadOrders = () => {
    seller
      .orders()
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadOrders, []);
  useRefetchOnFocus(loadOrders);

  const handleShipped = (updated) => {
    setOrders((current) => current.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleTrack = async (order) => {
    setTrackingLoadingId(order.id);
    try {
      const { tracking } = await seller.trackOrder(order.id);
      setTrackingById((current) => ({ ...current, [order.id]: { tracking, error: null } }));
    } catch (err) {
      setTrackingById((current) => ({ ...current, [order.id]: { tracking: null, error: friendlyShippingError(err.message) } }));
    } finally {
      setTrackingLoadingId(null);
    }
  };

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

  // Shared between the desktop table cell and the mobile card below — same shipping state,
  // same actions, just different surrounding markup — so the two layouts can't drift apart.
  const ShippingInfo = ({ o }) => (
    <>
      {o.shippingMethod ? (
        <div className="text-xs">
          <div className="font-semibold text-ink">{o.courierName}</div>
          <div className="text-text-muted">{o.trackingId}</div>
          {o.labelUrl && (
            <a href={o.labelUrl} download className="text-green font-semibold hover:underline block mt-0.5">
              Download label
            </a>
          )}
          {o.shippingMethod === 'falsafah' && (
            <div className="mt-1">
              <TrackingWidget
                tracking={trackingById[o.id]?.tracking}
                loading={trackingLoadingId === o.id}
                error={trackingById[o.id]?.error}
                onRefresh={() => handleTrack(o)}
                size="compact"
              />
            </div>
          )}
        </div>
      ) : o.status === 'Cancelled' ? (
        <span className="text-xs text-text-muted">Cancelled</span>
      ) : (
        <button
          type="button"
          onClick={() => setShippingOrder(o)}
          className="cursor-pointer bg-green hover:bg-green-hover text-white text-xs font-semibold px-3.5 py-2 rounded-full transition-colors"
        >
          Ship Now
        </button>
      )}
    </>
  );

  const StatusSelect = ({ o }) => (
    <>
      <StatusChipMenu
        status={o.status}
        cycleOptions={ORDER_STATUSES}
        palette={ORDER_CHIP}
        disabled={updatingId === o.id}
        onChange={(status) => handleStatusChange(o, status)}
      />
      {rowError?.id === o.id && <div className="text-[11px] text-orange-text mt-1.5 max-w-[180px]">{rowError.message}</div>}
    </>
  );

  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const shippedCount = orders.filter((o) => o.status === 'Shipped').length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      <div className="text-[11px] tracking-[1.6px] uppercase font-bold text-text">Orders placed for your listings, most recent first.</div>

      {loading ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-surface border border-border rounded-[20px] h-[110px]" />
          ))}
        </div>
      ) : (
        !error &&
        orders.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatCard label="Total orders" value={totalCount} note="Lifetime" />
            <StatCard label="Pending" value={pendingCount} note="Needs action" />
            <StatCard label="Shipped" value={shippedCount} note="In transit" />
            <StatCard label="Delivered" value={deliveredCount} note="Completed" />
          </div>
        )
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-surface border border-border rounded-2xl" />
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
          <p className="text-sm text-text">No orders yet — they'll show up here once buyers order your listings.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="flex flex-col gap-3 sm:hidden">
          {orders.map((o) => (
            <div key={o.id} className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="w-12 h-12 rounded-lg overflow-hidden bg-surface-muted border border-border flex items-center justify-center shrink-0">
                  {o.productImg ? (
                    <img src={o.productImg} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <IconBox width="18" height="18" className="text-text-muted" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink-soft truncate">{o.productName}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    Qty {o.qty.toLocaleString('en-US')} · {formatPKR(o.total)}
                  </div>
                </div>
                <StatusSelect o={o} />
              </div>

              <div className="mt-3 pt-3 border-t border-border/70 text-xs">
                <div className="font-semibold text-ink">{o.buyerCompany}</div>
                {o.shippingAddress ? (
                  <div className="text-text-muted leading-relaxed mt-0.5">
                    {o.shippingAddress.phone}
                    <br />
                    {o.shippingAddress.address}, {o.shippingAddress.city}
                  </div>
                ) : (
                  <div className="text-text-muted">{o.buyerCountry}</div>
                )}
                <div className="text-text-muted mt-0.5">
                  {new Date(o.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/70">
                <ShippingInfo o={o} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="hidden sm:block bg-surface border border-border rounded-2xl overflow-hidden">
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
                  <th className="px-5 py-3 font-semibold">Shipping</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-5 py-4 max-w-[200px]">
                      <div className="font-semibold text-ink">{o.buyerCompany}</div>
                      {o.shippingAddress ? (
                        <div className="text-xs text-text-muted leading-relaxed mt-0.5">
                          {o.shippingAddress.phone}
                          <br />
                          {o.shippingAddress.address}, {o.shippingAddress.city}
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted">{o.buyerCountry}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-[220px]">
                      <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-lg overflow-hidden bg-surface-muted border border-border flex items-center justify-center shrink-0">
                          {o.productImg ? (
                            <img src={o.productImg} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <IconBox width="18" height="18" className="text-text-muted" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="text-text-muted truncate">{o.productName}</div>
                          {o.productId ? (
                            <Link
                              to={`/seller/products/${o.productId}`}
                              className="text-[12px] font-semibold text-green no-underline hover:underline"
                            >
                              Details
                            </Link>
                          ) : (
                            <span className="text-[12px] text-text-muted">No details available</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-soft whitespace-nowrap">{o.qty.toLocaleString('en-US')}</td>
                    <td className="px-5 py-4 font-semibold text-ink whitespace-nowrap">{formatPKR(o.total)}</td>
                    <td className="px-5 py-4 text-text-muted whitespace-nowrap">
                      {new Date(o.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <StatusSelect o={o} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <ShippingInfo o={o} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ShipOrderModal
        open={Boolean(shippingOrder)}
        order={shippingOrder}
        bankComplete={bankComplete}
        pickupComplete={pickupComplete}
        onClose={() => setShippingOrder(null)}
        onShipped={handleShipped}
      />
    </div>
  );
}
