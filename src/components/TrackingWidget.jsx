import { getTrackingSummary } from '../lib/shipping';
import { IconTruck, IconCheck, IconClock, IconRotateCcw } from './icons';

const Spinner = ({ className = '' }) => (
  <span
    className={`w-3 h-3 border-2 border-current/30 rounded-full inline-block shrink-0 ${className}`}
    style={{ borderTopColor: 'currentColor', animation: 'spin 0.8s linear infinite' }}
  />
);

// One tracking status pill, shared by every screen that shows TCS delivery status (buyer
// OrdersPage, seller SellerOrders/ShipOrderModal, admin AdminPage) — three visual states matching
// getTrackingSummary()'s data: delivered (solid green), in transit / has a real status (soft
// blue), or nothing indexed yet (neutral, with copy that explains why instead of just "no update").
function StatusPill({ summary }) {
  if (summary.isDelivered) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-green text-white text-[11.5px] font-semibold px-2.5 py-1 rounded-full">
        <IconCheck width="11" height="11" />
        Delivered
      </span>
    );
  }
  if (summary.hasUpdate) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#E8F0FB] text-[#2D6FC9] text-[11.5px] font-semibold px-2.5 py-1 rounded-full">
        <IconTruck width="11" height="11" />
        {summary.statusLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-surface-muted text-text-muted text-[11.5px] font-semibold px-2.5 py-1 rounded-full">
      <IconClock width="11" height="11" />
      Not scanned in yet
    </span>
  );
}

// `tracking` — raw response from GET .../tracking, or null if never fetched. `size`: 'compact'
// for a table cell (pill + icon-only refresh), 'full' for the ship modal / buyer order card
// (pill + refresh button + checkpoint timeline).
export default function TrackingWidget({ tracking, loading, error, onRefresh, size = 'compact' }) {
  if (!tracking && !error) {
    return (
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-ink-soft font-semibold hover:text-green transition-colors ${
          size === 'full' ? 'text-[13px]' : 'text-[11.5px]'
        }`}
      >
        {loading ? <Spinner /> : <IconTruck width="12" height="12" />}
        {loading ? 'Checking…' : 'Track shipment'}
      </button>
    );
  }

  if (error) {
    return (
      <div className={size === 'full' ? 'text-[12.5px]' : 'text-[11px]'}>
        <p className="text-orange-text">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1 mt-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-ink-soft font-semibold hover:text-green transition-colors"
        >
          {loading ? <Spinner /> : <IconRotateCcw width="11" height="11" />}
          Retry
        </button>
      </div>
    );
  }

  const summary = getTrackingSummary(tracking);

  return (
    <div className={size === 'full' ? 'flex flex-col gap-2' : 'flex flex-col gap-1'}>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusPill summary={summary} />
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh tracking"
          title="Refresh tracking"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full cursor-pointer disabled:cursor-not-allowed text-text-muted hover:text-green hover:bg-surface-muted transition-colors"
        >
          {loading ? <Spinner /> : <IconRotateCcw width="11" height="11" />}
        </button>
      </div>

      {!summary.hasUpdate && (
        <p className={`text-text-muted ${size === 'full' ? 'text-[12px]' : 'text-[10.5px]'}`}>
          TCS usually scans a new shipment in within a few hours of pickup — this isn't stuck, just early.
        </p>
      )}

      {size === 'full' && summary.statusDate && <p className="text-[12px] text-text-muted">{summary.statusDate}</p>}

      {size === 'full' && summary.checkpoints.length > 0 && (
        <ul className="mt-1 flex flex-col gap-2 border-l-2 border-border pl-3">
          {summary.checkpoints.slice(0, 4).map((cp, i) => (
            <li key={i} className="relative text-[12px]">
              <span
                className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full ${i === 0 ? 'bg-green' : 'bg-border-strong'}`}
              />
              <div className="flex items-center justify-between gap-2">
                <span className={i === 0 ? 'font-semibold text-ink' : 'text-ink-soft'}>{cp.status}</span>
                <span className="text-text-muted whitespace-nowrap">{cp.date}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
