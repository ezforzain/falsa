import { useEffect, useState } from 'react';
import { formatPKR } from '../../../data/mockData';
import { ORDER_STATUSES } from '../../seller/statusStyles';
import { ORDER_STATUS_TONES } from '../../../components/admin/ui/Badge';
import Card from '../../../components/admin/ui/Card';
import Button from '../../../components/admin/ui/Button';
import SearchInput from '../../../components/admin/ui/SearchInput';
import Select from '../../../components/admin/ui/Select';
import EmptyState from '../../../components/admin/ui/EmptyState';
import StatusMenu from '../../../components/admin/ui/StatusMenu';
import Pagination from '../../../components/admin/ui/Pagination';
import { IconPlus, IconReceipt } from '../../../components/icons';

const PAGE_SIZE = 10;
const toneOf = (status) => ORDER_STATUS_TONES[status] || 'neutral';

function ShippingCell({ order, tracking, trackingLoading, onTrack }) {
  if (order.shippingMethod === 'falsafah') {
    return (
      <div className="text-xs">
        <div className="font-semibold text-[var(--admin-ink)]">{order.courierName}</div>
        <div className="text-[var(--admin-text-muted)]">CN: {order.trackingId}</div>
        {order.labelUrl && (
          <a href={order.labelUrl} download className="text-[var(--admin-primary)] font-semibold hover:underline block mt-0.5">
            Download label
          </a>
        )}
        <button
          type="button"
          onClick={onTrack}
          disabled={trackingLoading}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-[var(--admin-ink-soft)] font-semibold hover:underline mt-1"
        >
          {trackingLoading ? 'Checking…' : 'Track shipment'}
        </button>
        {tracking?.error && <div className="text-[var(--admin-danger)] mt-1">{tracking.error}</div>}
        {tracking?.tracking && (
          <div className="mt-1 text-[var(--admin-text-muted)]">{tracking.tracking.deliveryinfo?.[0]?.status || 'Status unavailable'}</div>
        )}
      </div>
    );
  }
  if (order.shippingMethod) {
    return (
      <div className="text-xs">
        <div className="font-semibold text-[var(--admin-ink)]">{order.courierName}</div>
        <div className="text-[var(--admin-text-muted)]">{order.trackingId}</div>
      </div>
    );
  }
  return <span className="text-xs text-[var(--admin-text-muted)]">Not shipped yet</span>;
}

export default function OrdersTab({
  ordersList,
  ordersLoading,
  ordersError,
  orderSearch,
  setOrderSearch,
  orderStatusFilter,
  setOrderStatusFilter,
  loadOrders,
  orderStatusPendingId,
  orderRowError,
  handleUpdateOrderStatus,
  tcsTrackingById,
  tcsTrackingLoadingId,
  handleTrackTcsOrder,
  setOrderFormOpen,
  setOrderFormError,
}) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [ordersList.length, orderSearch, orderStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(ordersList.length / PAGE_SIZE));
  const pageItems = ordersList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--admin-ink)] tracking-tight">Orders</h1>
          <p className="text-sm text-[var(--admin-text)] mt-1.5">Every order across every seller, in one place.</p>
        </div>
        <Button
          onClick={() => {
            setOrderFormError(null);
            setOrderFormOpen(true);
          }}
        >
          <IconPlus width="15" height="15" />
          Record order
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadOrders();
        }}
        className="flex items-center gap-3 flex-wrap mb-5"
      >
        <SearchInput value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search by buyer, product, or seller…" />
        <Select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Button type="submit">Search</Button>
      </form>

      {ordersLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl" />
          ))}
        </div>
      )}

      {!ordersLoading && ordersError && <Card className="border-dashed text-center text-[var(--admin-danger)] text-sm">{ordersError}</Card>}

      {!ordersLoading && !ordersError && ordersList.length === 0 && (
        <EmptyState icon={IconReceipt} description="No orders match yet. Record one manually, or wait for a seller's first sale." />
      )}

      {!ordersLoading && !ordersError && ordersList.length > 0 && (
        <>
          {/* Mobile: stacked cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {pageItems.map((o) => (
              <Card key={o.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--admin-ink)] truncate">{o.buyerCompany}</div>
                    <div className="text-xs text-[var(--admin-text-muted)]">{o.sellerName}</div>
                  </div>
                  <StatusMenu
                    value={o.status}
                    options={ORDER_STATUSES}
                    toneOf={toneOf}
                    pending={orderStatusPendingId === o.id}
                    onSelect={(status) => handleUpdateOrderStatus(o, status)}
                  />
                </div>
                {orderRowError?.id === o.id && <div className="text-[11px] text-[var(--admin-danger)] mt-1.5">{orderRowError.message}</div>}

                <div className="mt-3 pt-3 border-t border-[var(--admin-border)] text-xs text-[var(--admin-text-muted)]">
                  {o.productName} · Qty {o.qty.toLocaleString('en-US')} · <span className="font-semibold text-[var(--admin-ink)]">{formatPKR(o.total)}</span>
                  <div className="mt-0.5">{new Date(o.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--admin-border)]">
                  <ShippingCell
                    order={o}
                    tracking={tcsTrackingById[o.id]}
                    trackingLoading={tcsTrackingLoadingId === o.id}
                    onTrack={() => handleTrackTcsOrder(o)}
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card padded={false} className="hidden sm:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[880px]">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] text-left text-xs text-[var(--admin-text-muted)] uppercase tracking-wide">
                    <th className="px-5 py-3 font-semibold">Seller</th>
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
                  {pageItems.map((o) => (
                    <tr key={o.id} className="border-b border-[var(--admin-border)] last:border-0 align-top hover:bg-[var(--admin-surface-hover)] transition-colors">
                      <td className="px-5 py-4 text-[var(--admin-ink-soft)] max-w-[160px]">{o.sellerName}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[var(--admin-ink)]">{o.buyerCompany}</div>
                        <div className="text-xs text-[var(--admin-text-muted)]">{o.buyerCountry}</div>
                      </td>
                      <td className="px-5 py-4 text-[var(--admin-text)] max-w-[160px]">{o.productName}</td>
                      <td className="px-5 py-4 text-[var(--admin-ink-soft)] whitespace-nowrap">{o.qty.toLocaleString('en-US')}</td>
                      <td className="px-5 py-4 font-semibold text-[var(--admin-ink)] whitespace-nowrap">{formatPKR(o.total)}</td>
                      <td className="px-5 py-4 text-[var(--admin-text-muted)] whitespace-nowrap">
                        {new Date(o.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <StatusMenu
                          value={o.status}
                          options={ORDER_STATUSES}
                          toneOf={toneOf}
                          pending={orderStatusPendingId === o.id}
                          onSelect={(status) => handleUpdateOrderStatus(o, status)}
                        />
                        {orderRowError?.id === o.id && <div className="text-[11px] text-[var(--admin-danger)] mt-1.5 max-w-[140px]">{orderRowError.message}</div>}
                      </td>
                      <td className="px-5 py-4 min-w-[180px]">
                        <ShippingCell
                          order={o}
                          tracking={tcsTrackingById[o.id]}
                          trackingLoading={tcsTrackingLoadingId === o.id}
                          onTrack={() => handleTrackTcsOrder(o)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} total={ordersList.length} pageSize={PAGE_SIZE} />
          </Card>
        </>
      )}
    </>
  );
}
