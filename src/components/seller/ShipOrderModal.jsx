import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seller } from '../../lib/api';
import { IconClose, IconTruck, IconBox, IconCheck, IconAlertCircle, IconFile } from '../icons';

const fieldClass =
  'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

// Ship Now flow: pick Falsafah (books a real TCS Courier shipment server-side — see
// PATCH /api/seller/orders/:id/ship — using this seller's on-file pickup info, gated on bank
// details + a pickup address/city being on file) or Ship Myself (courier name + tracking id,
// visible to the buyer immediately). Once seller.shipOrder() succeeds the order's shippingMethod
// is set server-side and can never be called again (see the 409 guard in seller.routes.js) —
// that's what makes this all one-shot.
export default function ShipOrderModal({ open, order, bankComplete, onClose, onShipped }) {
  const [method, setMethod] = useState(null);
  const [courierName, setCourierName] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippedOrder, setShippedOrder] = useState(null);
  const [labelLoading, setLabelLoading] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMethod(null);
    setCourierName('');
    setTrackingId('');
    setLoading(false);
    setError(null);
    setTracking(null);
    setTrackingError(null);
    // Defensive: if this order was somehow already shipped, show its result instead of the picker.
    setShippedOrder(order?.shippingMethod ? order : null);
  }, [open, order]);

  if (!open || !order) return null;

  const confirmFalsafah = async () => {
    setLoading(true);
    setError(null);
    try {
      const { order: updated } = await seller.shipOrder(order.id, { method: 'falsafah' });
      setShippedOrder(updated);
      onShipped?.(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmSelf = async () => {
    if (!courierName.trim() || !trackingId.trim()) {
      setError('Please enter both the courier name and tracking id.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { order: updated } = await seller.shipOrder(order.id, {
        method: 'self',
        courierName: courierName.trim(),
        trackingId: trackingId.trim(),
      });
      setShippedOrder(updated);
      onShipped?.(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Booking a TCS shipment already succeeded by the time the modal reaches this state — the
  // label PDF is a separate best-effort fetch (see tryAttachTcsLabel in seller.routes.js) that
  // can occasionally still be missing here, so this retries just that step.
  const retryLabel = async () => {
    setLabelLoading(true);
    setError(null);
    try {
      const { order: updated } = await seller.retryTcsLabel(order.id);
      setShippedOrder(updated);
      onShipped?.(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLabelLoading(false);
    }
  };

  const refreshTracking = async () => {
    setTrackingLoading(true);
    setTrackingError(null);
    try {
      const { tracking: data } = await seller.trackOrder(order.id);
      setTracking(data);
    } catch (err) {
      setTrackingError(err.message);
    } finally {
      setTrackingLoading(false);
    }
  };

  const done = Boolean(shippedOrder?.shippingMethod);
  const address = order.shippingAddress;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-[480px] max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">Ship order</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-ink cursor-pointer p-1">
            <IconClose width="18" height="18" />
          </button>
        </div>

        {!done && (
          <div className="bg-surface-muted rounded-lg p-3.5 mb-5 text-[13px]">
            <div className="font-semibold text-ink mb-1">
              {order.productName} <span className="text-text-muted font-medium">× {order.qty}</span>
            </div>
            {address ? (
              <div className="text-text-muted leading-relaxed">
                {address.fullName} · {address.phone}
                <br />
                {address.address}, {address.city}
              </div>
            ) : (
              <div className="text-text-muted">No delivery address on file for this order.</div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

        {!done && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setMethod('falsafah')}
                className={`flex flex-col items-center gap-2 text-center border-2 rounded-xl p-4 cursor-pointer transition-colors ${
                  method === 'falsafah' ? 'border-green bg-green-tint' : 'border-border hover:bg-surface-muted'
                }`}
              >
                <IconTruck width="22" height="22" className="text-green" />
                <span className="text-[13px] font-semibold text-ink">Ship with Falsafah</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('self')}
                className={`flex flex-col items-center gap-2 text-center border-2 rounded-xl p-4 cursor-pointer transition-colors ${
                  method === 'self' ? 'border-green bg-green-tint' : 'border-border hover:bg-surface-muted'
                }`}
              >
                <IconBox width="22" height="22" className="text-green" />
                <span className="text-[13px] font-semibold text-ink">Ship Myself</span>
              </button>
            </div>

            {method === 'falsafah' && !bankComplete && (
              <div className="border border-dashed border-border-strong rounded-lg p-4 text-center">
                <IconAlertCircle width="18" height="18" className="text-orange-text mx-auto mb-2" />
                <p className="text-[13px] text-ink-soft mb-3">Add your bank details before shipping with Falsafah — that's how you'll get paid out.</p>
                <Link
                  to="/seller/settings"
                  onClick={onClose}
                  className="inline-block bg-green hover:bg-green-hover text-white font-semibold text-[13px] px-5 py-2.5 rounded-full transition-colors"
                >
                  Add bank details
                </Link>
              </div>
            )}

            {method === 'falsafah' && bankComplete && (
              <>
                <p className="text-[12px] text-text-muted mb-3 leading-relaxed">
                  This books a real TCS Courier pickup using your saved pickup address, city, and phone from Settings, and generates a
                  downloadable shipping label automatically.
                </p>
                <button
                  type="button"
                  onClick={confirmFalsafah}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
                >
                  {loading && (
                    <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                  )}
                  {loading ? 'Booking with TCS…' : 'Ready'}
                </button>
              </>
            )}

            {method === 'self' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelClass}>Courier name</label>
                  <input type="text" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. TCS, Leopard Courier" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Tracking ID</label>
                  <input type="text" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="e.g. 123456789" className={fieldClass} />
                </div>
                <button
                  type="button"
                  onClick={confirmSelf}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
                >
                  {loading && (
                    <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                  )}
                  {loading ? 'Shipping…' : 'Confirm & Ship'}
                </button>
              </div>
            )}
          </>
        )}

        {done && shippedOrder.shippingMethod === 'self' && (
          <div className="text-center py-4">
            <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
              <IconCheck width="24" height="24" className="text-green" />
            </span>
            <p className="text-[15px] font-bold text-ink mb-1">Order shipped</p>
            <p className="text-[13px] text-text-muted">
              {shippedOrder.courierName} · {shippedOrder.trackingId}
            </p>
          </div>
        )}

        {done && shippedOrder.shippingMethod === 'falsafah' && (
          <div className="flex flex-col items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center">
              <IconCheck width="24" height="24" className="text-green" />
            </span>
            <div className="text-center">
              <p className="text-[15px] font-bold text-ink mb-1">Booked with TCS</p>
              <p className="text-[13px] text-text-muted">
                Consignment No. <strong className="text-ink">{shippedOrder.trackingId}</strong>
              </p>
            </div>

            {shippedOrder.labelUrl ? (
              <a
                href={shippedOrder.labelUrl}
                download={`tcs-label-${shippedOrder.trackingId}.pdf`}
                className="inline-flex items-center gap-1.5 bg-green hover:bg-green-hover text-white font-semibold text-[13px] px-6 py-2.5 rounded-full transition-colors"
              >
                <IconFile width="14" height="14" />
                Download label (PDF)
              </a>
            ) : (
              <div className="text-center">
                <p className="text-[12.5px] text-orange-text mb-2">Label isn't ready yet — TCS may still be generating it.</p>
                <button
                  type="button"
                  onClick={retryLabel}
                  disabled={labelLoading}
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-surface border border-border text-ink-soft font-semibold text-xs px-4 py-2 rounded-full hover:bg-surface-muted transition-colors"
                >
                  {labelLoading ? 'Checking…' : 'Get label'}
                </button>
              </div>
            )}

            <div className="w-full border-t border-border pt-3.5">
              {!tracking && (
                <button
                  type="button"
                  onClick={refreshTracking}
                  disabled={trackingLoading}
                  className="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-surface border border-border text-ink-soft font-semibold text-xs px-4 py-2.5 rounded-full hover:bg-surface-muted transition-colors"
                >
                  {trackingLoading ? 'Checking status…' : 'Track shipment'}
                </button>
              )}
              {trackingError && <p className="text-[11.5px] text-orange-text mt-2 text-center">{trackingError}</p>}
              {tracking && (
                <div className="text-[12.5px] text-ink-soft">
                  <p className="font-semibold text-ink mb-1">{tracking.deliveryinfo?.[0]?.status || 'Status unavailable'}</p>
                  {tracking.deliveryinfo?.[0]?.datetime && <p className="text-text-muted mb-2">{tracking.deliveryinfo[0].datetime}</p>}
                  <button
                    type="button"
                    onClick={refreshTracking}
                    disabled={trackingLoading}
                    className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-green font-semibold hover:underline"
                  >
                    {trackingLoading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
