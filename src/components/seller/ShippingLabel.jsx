import { forwardRef } from 'react';

// Printable Falsafah Express shipping label — captured to PNG via html2canvas (see
// ShipOrderModal.jsx), so this renders with fixed pixel dimensions and explicit colors rather
// than relying on the viewport or CSS variables, to guarantee the captured image looks the same
// regardless of screen size/theme.
const ShippingLabel = forwardRef(function ShippingLabel({ order, sellerName }, ref) {
  const address = order.shippingAddress || {};
  const generatedAt = new Date(order.shippedAt || Date.now()).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      ref={ref}
      style={{
        width: 420,
        fontFamily: 'Arial, Helvetica, sans-serif',
        background: '#ffffff',
        color: '#1a1a1a',
        border: '2px solid #111111',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ background: '#0E5A46', color: '#ffffff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.3 }}>Falsafah Express</span>
        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>Shipping Label</span>
      </div>

      <div style={{ padding: '16px 18px 6px', borderBottom: '1px dashed #cccccc' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#666666', letterSpacing: 0.6, marginBottom: 4 }}>TRACKING ID</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1.5, marginBottom: 10 }}>{order.trackingId}</div>
        <div
          style={{
            height: 34,
            background:
              'repeating-linear-gradient(90deg, #111 0px, #111 2px, transparent 2px, transparent 4px, #111 4px, #111 5px, transparent 5px, transparent 8px)',
            marginBottom: 6,
          }}
        />
        <div style={{ fontSize: 10, textAlign: 'center', letterSpacing: 3, color: '#444444', marginBottom: 10 }}>{order.trackingId}</div>
      </div>

      <div style={{ padding: '12px 18px', borderBottom: '1px dashed #cccccc' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#666666', letterSpacing: 0.6, marginBottom: 4 }}>FROM</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>{sellerName}</div>

        <div style={{ fontSize: 10, fontWeight: 700, color: '#666666', letterSpacing: 0.6, marginBottom: 4 }}>TO</div>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{address.fullName}</div>
        <div style={{ fontSize: 12.5, color: '#333333', marginTop: 2 }}>{address.phone}</div>
        <div style={{ fontSize: 12.5, color: '#333333', marginTop: 2, lineHeight: 1.4 }}>
          {address.address}, {address.city}
        </div>
      </div>

      <div style={{ padding: '12px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#666666', letterSpacing: 0.6, marginBottom: 4 }}>PRODUCT</div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          {order.productName} <span style={{ color: '#666666', fontWeight: 500 }}>× {order.qty}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#666666', marginTop: 10 }}>
          <span>Order #{order.id}</span>
          <span>{generatedAt}</span>
        </div>
      </div>
    </div>
  );
});

export default ShippingLabel;
