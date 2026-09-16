// Shared card chrome for the Seller Portal — every stat tile, table section, and form section
// across all seller pages is built on this one wrapper so the border/radius/background/padding
// recipe can't drift page to page.
export default function SellerCard({ eyebrow, action, children, className = '', bodyClassName = '' }) {
  return (
    <div className={`border border-border rounded-[20px] bg-surface p-5 ${className}`}>
      {(eyebrow || action) && (
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3.5">
          {eyebrow && <div className="text-[11px] tracking-[1.6px] uppercase font-bold text-text">{eyebrow}</div>}
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
