// Seller Portal status-chip colors — used by StatusChipMenu across Orders/Products/Promotions/
// Payouts. Kept separate from statusStyles.js (which still owns ORDER_STATUSES and the plain
// badge classes used outside the portal, e.g. the buyer-facing OrdersPage).
export const BLUE = { bg: '#152A4F', fg: '#9CC0FF', border: '#2B4784' };
export const AMBER = { bg: '#332A12', fg: '#E7C46B', border: '#5C4A1D' };
export const TEAL = { bg: '#10332C', fg: '#6FDFCE', border: '#1C5A4E' };
// Cancelled/rejected — the source design has no example for a terminal-negative state; chosen to
// read as clearly distinct from the other three.
export const NEGATIVE = { bg: '#241A1A', fg: '#C97B7B', border: '#4A2C2C' };

// server/src/models/SellerOrder.js
export const ORDER_CHIP = {
  Pending: AMBER,
  Processing: AMBER,
  Shipped: BLUE,
  Delivered: TEAL,
  Cancelled: NEGATIVE,
};

// server/src/models/SellerProduct.js `status` is a free string; only 'active'/'draft' are ever
// set (see ProductFormModal's own status select) — no third real status exists. "Out of stock"
// is NOT a status, it's derived from stock === 0 and rendered as a separate badge, never a
// selectable option here.
export const PRODUCT_CHIP = { active: TEAL, draft: AMBER };
export const PRODUCT_LABEL = { active: 'Live', draft: 'Draft' };
export const PRODUCT_OUT_OF_STOCK_BADGE = BLUE;

// server/src/models/PromotionRequest.js — admin-set only, never seller-editable.
export const PROMOTION_CHIP = { pending: AMBER, approved: TEAL, rejected: NEGATIVE };

// Payout has no status field server-side at all — every row is a fixed, non-interactive label.
export const PAYOUT_CHIP = TEAL;
