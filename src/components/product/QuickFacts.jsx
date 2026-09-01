import { useState } from 'react';
import { formatPKR } from '../../data/mockData';
import { IconBox, IconStore, IconTruck, IconClock, IconShield, IconChevronRight } from '../icons';

// MOQ / stock / shipping / delivery-time at-a-glance strip — the numbers a B2B buyer scans for
// first, pulled out of the price-tier table into their own compact grid so they read instantly.
function b2bFacts(product, outOfStock) {
  return [
    { icon: IconBox, label: 'MOQ', value: product.moq || '—' },
    {
      icon: IconStore,
      label: 'Stock',
      value: outOfStock ? 'Out of stock' : typeof product.stock === 'number' ? `${product.stock.toLocaleString()} ${product.unit || ''}` : 'In stock',
    },
    { icon: IconTruck, label: 'Shipping', value: 'Free on first order' },
    { icon: IconClock, label: 'Delivery time', value: '10–14 days' },
  ];
}

// Consumer (non-B2B) facts strip — no MOQ (not a meaningful concept for a single-unit buy), and
// unlike the B2B grid above, Shipping/Ships-in are only shown when backed by a real field on the
// product (freeShipping / shipping.shippingFee / shipping.dispatchTime) rather than a fixed
// claim shown on every listing regardless of what the seller actually set.
function b2cFacts(product, outOfStock) {
  const facts = [
    {
      icon: IconStore,
      label: 'Stock',
      value: outOfStock ? 'Out of stock' : typeof product.stock === 'number' ? `${product.stock.toLocaleString()} ${product.unit || ''}` : 'In stock',
    },
  ];

  if (product.freeShipping) {
    facts.push({
      icon: IconTruck,
      label: 'Shipping',
      value: product.worldwideFreeShipping ? 'Free shipping worldwide' : 'Free shipping',
    });
  } else if (typeof product.shipping?.shippingFee === 'number') {
    facts.push({ icon: IconTruck, label: 'Shipping', value: formatPKR(product.shipping.shippingFee) });
  }

  if (product.shipping?.dispatchTime) {
    facts.push({ icon: IconClock, label: 'Ships in', value: product.shipping.dispatchTime });
  }

  return facts;
}

// B2C rows read as a stacked list card (Daraz's "14 days easy return · Warranty" / delivery-info
// pattern) rather than the B2B boxed grid below — a leading, expandable Return & Warranty row
// (the one thing every consumer listing offers, not just ones with real per-product data) plus
// whichever of stock/shipping/ships-in b2cFacts actually has data for.
function ConsumerFacts({ product, outOfStock }) {
  const [returnOpen, setReturnOpen] = useState(false);
  const facts = b2cFacts(product, outOfStock);

  return (
    <div className="border border-border rounded-2xl overflow-hidden mb-6 bg-white">
      <button
        type="button"
        onClick={() => setReturnOpen((open) => !open)}
        aria-expanded={returnOpen}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-surface-muted transition-colors"
      >
        <IconShield className="text-green shrink-0" width="17" height="17" strokeWidth="2.2" />
        <span className="flex-1 text-[13px] font-semibold text-ink-soft">14-day easy return · Seller warranty</span>
        <IconChevronRight
          className={`text-text-muted shrink-0 transition-transform duration-200 ${returnOpen ? 'rotate-90' : ''}`}
          width="15"
          height="15"
        />
      </button>
      {returnOpen && (
        <p className="px-4 pb-3.5 -mt-0.5 text-[12.5px] text-text-muted leading-relaxed border-t border-border pt-3">
          Change your mind within 14 days of delivery for a full refund, plus standard seller warranty coverage
          against manufacturing defects.
        </p>
      )}

      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3 px-4 py-3.5 border-t border-border">
          <Icon className="text-green shrink-0" width="17" height="17" />
          <span className="flex-1 min-w-0 text-[13px] font-medium text-text-muted truncate">{label}</span>
          <span className="text-[13px] font-semibold text-ink text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

function SupplierFacts({ product, outOfStock }) {
  const facts = b2bFacts(product, outOfStock);

  return (
    <div className="grid grid-cols-2 gap-2.5 mb-6">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="min-w-0 flex items-start gap-2.5 bg-surface-muted rounded-xl px-3.5 py-3">
          <span className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center shrink-0 text-green">
            <Icon width="15" height="15" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] text-text-muted font-medium">{label}</div>
            <div className="text-[13px] font-semibold text-ink truncate">{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function QuickFacts({ product, outOfStock, b2bEnabled }) {
  return b2bEnabled ? (
    <SupplierFacts product={product} outOfStock={outOfStock} />
  ) : (
    <ConsumerFacts product={product} outOfStock={outOfStock} />
  );
}
