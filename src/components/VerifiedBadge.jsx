// "Verified Store" badge — a blue scalloped circle with a white checkmark, matching the
// familiar verified-account badge shape used across major platforms. The outline is a
// pre-computed 12-lobe path (radius = 46 + 4*cos(12*theta) around a 100x100 viewBox) so it
// scales cleanly at any size instead of relying on a hand-drawn/approximate SVG.
const BADGE_OUTLINE =
  'M100.00,50.00 L99.17,52.58 L96.98,54.94 L94.21,57.00 L91.83,58.89 L90.57,60.87 L90.67,63.21 L91.79,66.04 L93.15,69.21 L93.87,72.35 L93.30,75.00 L91.29,76.82 L88.21,77.76 L84.79,78.17 L81.78,78.61 L79.70,79.70 L78.61,81.78 L78.17,84.79 L77.76,88.21 L76.82,91.29 L75.00,93.30 L72.35,93.87 L69.21,93.15 L66.04,91.79 L63.21,90.67 L60.87,90.57 L58.89,91.83 L57.00,94.21 L54.94,96.98 L52.58,99.17 L50.00,100.00 L47.42,99.17 L45.06,96.98 L43.00,94.21 L41.11,91.83 L39.13,90.57 L36.79,90.67 L33.96,91.79 L30.79,93.15 L27.65,93.87 L25.00,93.30 L23.18,91.29 L22.24,88.21 L21.83,84.79 L21.39,81.78 L20.30,79.70 L18.22,78.61 L15.21,78.17 L11.79,77.76 L8.71,76.82 L6.70,75.00 L6.13,72.35 L6.85,69.21 L8.21,66.04 L9.33,63.21 L9.43,60.87 L8.17,58.89 L5.79,57.00 L3.02,54.94 L0.83,52.58 L0.00,50.00 L0.83,47.42 L3.02,45.06 L5.79,43.00 L8.17,41.11 L9.43,39.13 L9.33,36.79 L8.21,33.96 L6.85,30.79 L6.13,27.65 L6.70,25.00 L8.71,23.18 L11.79,22.24 L15.21,21.83 L18.22,21.39 L20.30,20.30 L21.39,18.22 L21.83,15.21 L22.24,11.79 L23.18,8.71 L25.00,6.70 L27.65,6.13 L30.79,6.85 L33.96,8.21 L36.79,9.33 L39.13,9.43 L41.11,8.17 L43.00,5.79 L45.06,3.02 L47.42,0.83 L50.00,0.00 L52.58,0.83 L54.94,3.02 L57.00,5.79 L58.89,8.17 L60.87,9.43 L63.21,9.33 L66.04,8.21 L69.21,6.85 L72.35,6.13 L75.00,6.70 L76.82,8.71 L77.76,11.79 L78.17,15.21 L78.61,18.22 L79.70,20.30 L81.78,21.39 L84.79,21.83 L88.21,22.24 L91.29,23.18 L93.30,25.00 L93.87,27.65 L93.15,30.79 L91.79,33.96 L90.67,36.79 L90.57,39.13 L91.83,41.11 L94.21,43.00 L96.98,45.06 L99.17,47.42 Z';

const DEFAULT_TOOLTIP = 'Verified Store – This seller has been verified by our platform.';

// Generic badge: defaults to the per-seller "Verified Store" meaning, but any brand-level use
// (e.g. the site logo's "Official Website" mark) can override `label`/`tooltip`. The SVG uses
// `fill="currentColor"` so color — including its dark-mode shade — is driven entirely by the
// wrapping element's text-color classes, no per-usage SVG edits needed.
export default function VerifiedBadge({
  size = 18,
  className = '',
  tooltipPosition = 'top',
  label = 'Verified Store',
  tooltip = DEFAULT_TOOLTIP,
}) {
  const tooltipPosClass = tooltipPosition === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5';

  return (
    <span
      className={`group/verified relative inline-flex shrink-0 align-middle outline-none ${className}`}
      style={{ width: size, height: size }}
      tabIndex={0}
      role="img"
      aria-label={label}
      title={tooltip}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="block text-[#3B82F6] dark:text-[#60A5FA]">
        <path d={BADGE_OUTLINE} fill="currentColor" />
        <path d="M31 51 L44 64 L71 35" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${tooltipPosClass} z-50 whitespace-nowrap rounded-md bg-ink dark:bg-white px-2.5 py-1.5 text-[11px] font-medium text-white dark:text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover/verified:opacity-100 group-focus/verified:opacity-100`}
      >
        {tooltip}
      </span>
    </span>
  );
}
