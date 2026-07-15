import VerifiedBadge from './VerifiedBadge';

// The brand-level counterpart to VerifiedBadge's per-seller "Verified Store" mark — sits next
// to the falsafahtot logo/wordmark itself (header, footer, login, seller/admin portals) to
// signal this is the official site, not a per-seller trust signal. Same badge shape/component,
// just a different label/tooltip, so there's one visual source of truth for "verified" anywhere
// in the product.
export default function OfficialBadge({ size = 16, className = '', tooltipPosition = 'top' }) {
  return (
    <VerifiedBadge
      size={size}
      className={className}
      tooltipPosition={tooltipPosition}
      label="Official Website"
      tooltip="Official Website"
    />
  );
}
