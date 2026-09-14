// Turns TCS Courier's raw API responses into plain-language display data. Every screen that
// shows shipment tracking (buyer OrdersPage, seller SellerOrders/ShipOrderModal, admin
// AdminPage) used to reach into TCS's own response shape independently
// (tracking.deliveryinfo?.[0]?.status, .checkpoints, .datetime) and show TCS's raw error text —
// this centralizes both so the four screens read the same way and don't drift.

// `tracking` is whatever GET .../tracking returned (see tcsService.trackShipment) — TCS's
// documented "Invalid CN" failure shape is `{ shipmentinfo: null, ... }` with no deliveryinfo,
// and a shipment can also come back as `{}` in the first few minutes after booking, before TCS
// has indexed it yet — both are treated as "no update yet" rather than an error.
export function getTrackingSummary(tracking) {
  const latest = tracking?.deliveryinfo?.[0];
  const status = latest?.status || null;
  return {
    statusLabel: status || 'No update yet — check back soon',
    statusDate: latest?.datetime || null,
    isDelivered: status === 'Delivered',
    hasUpdate: Boolean(status),
    checkpoints: Array.isArray(tracking?.checkpoints)
      ? tracking.checkpoints.map((c) => ({ status: c.status, date: c.datetime }))
      : [],
  };
}

// Mirrors server/src/services/tcsService.js's normalizePkMobile — used client-side to gate the
// Falsafah shipping flow (and validate the Settings phone field) before a booking attempt ever
// reaches the server, instead of only surfacing this as a failure after the seller clicks Ready.
export function isValidPkMobile(raw) {
  let normalized = String(raw || '').replace(/\D/g, '');
  // "0092..." is the intl-dialing prefix for "92..." — collapse it first so the next check
  // only has to handle one country-code form, not two.
  if (normalized.startsWith('0092')) normalized = normalized.slice(2);
  // Country code can be followed by either the 10-digit local number ("923001234567") or, just
  // as commonly typed/pasted, the local number with its leading 0 kept ("9203001234567") — both
  // need the "92" stripped; a leftover leading 0 (from the second form) is left in place and a
  // missing one is added below, so either form ends up as a plain 11-digit local number.
  if (normalized.startsWith('92') && normalized.length >= 12) normalized = normalized.slice(2);
  if (!normalized.startsWith('0')) normalized = `0${normalized}`;
  return /^03\d{9}$/.test(normalized);
}

// Translates a raw error message — often TCS's own API error text, or a generic network
// failure — into something a non-technical seller/admin/buyer can act on. Falls back to the
// original message when nothing more specific matches, so real detail is never fully hidden.
export function friendlyShippingError(message) {
  const raw = String(message || '').trim();
  if (/bearer token|mismatch configuration|unauthorized|invalid access token/i.test(raw)) {
    return "Shipping isn't set up correctly yet. Please contact support.";
  }
  if (/cost center/i.test(raw)) {
    return "TCS shipping isn't fully set up yet — ask an admin to finish setup in Admin Settings.";
  }
  if (/declared value|insert valid decimal/i.test(raw)) {
    return "This order couldn't be booked with TCS due to a courier configuration issue. Please contact support.";
  }
  if (/must be between \d+ and \d+ character/i.test(raw)) {
    return `Couldn't book with TCS — the buyer's saved name or address is too short for the courier's requirements (${raw.replace(/^\*\s*/, '')}).`;
  }
  if (/unable to reach|network|timeout|econnrefused/i.test(raw)) {
    return "Couldn't reach the courier service — please try again in a moment.";
  }
  if (/no data found|invalid cn|no record|not found/i.test(raw)) {
    return 'No tracking information yet — check back shortly.';
  }
  return raw || 'Something went wrong. Please try again.';
}
