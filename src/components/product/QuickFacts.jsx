import { IconBox, IconStore, IconTruck, IconClock } from '../icons';

// MOQ / stock / shipping / delivery-time at-a-glance strip — the numbers a B2B buyer scans for
// first, pulled out of the price-tier table into their own compact grid so they read instantly.
export default function QuickFacts({ product, outOfStock }) {
  const facts = [
    { icon: IconBox, label: 'MOQ', value: product.moq || '—' },
    {
      icon: IconStore,
      label: 'Stock',
      value: outOfStock ? 'Out of stock' : typeof product.stock === 'number' ? `${product.stock.toLocaleString()} ${product.unit || ''}` : 'In stock',
    },
    { icon: IconTruck, label: 'Shipping', value: 'Free on first order' },
    { icon: IconClock, label: 'Delivery time', value: '10–14 days' },
  ];

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
