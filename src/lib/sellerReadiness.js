import { isValidPkMobile } from './shipping';

const BANK_FIELDS = ['bankName', 'accountTitle', 'accountNumber', 'iban'];

// The same two completeness checks ShipOrderModal gates "Ship with Falsafah" on (see
// SellerOrders.jsx, which previously computed these inline) — pulled out so SellerLayout's
// sidebar readiness card and SellerOrders can both read one definition instead of drifting.
export function getSellerReadiness(user) {
  const bankComplete = BANK_FIELDS.every((key) => Boolean(user?.[key]));
  const pickupComplete = Boolean(user?.address && user?.city && isValidPkMobile(user?.phone));
  const doneCount = (bankComplete ? 1 : 0) + (pickupComplete ? 1 : 0);
  return { bankComplete, pickupComplete, percent: (doneCount / 2) * 100 };
}
