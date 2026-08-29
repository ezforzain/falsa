import { Seller } from '../models/Seller.js';

// A seller's public "Verified Store" badge lives on the Seller directory (see User.sellerId),
// separate from the account itself — every response that sends a user back to the client needs
// this attached, since the frontend reads `user.verified` directly (e.g. the seller portal
// header badge).
//
// `sellerVerifiedById` is an optional pre-fetched Map<string sellerId, boolean verified> used by
// serializeUsers to avoid an N+1 Seller.findById per user. When omitted (single-user callers)
// this does its own lookup.
export async function serializeUser(user, sellerVerifiedById) {
  const obj = user.toPublicJSON();
  // The account-level "blue tick" (User.verified) can be set on any role. For sellers it is also
  // mirrored by the linked Seller directory record's badge — treat either one being true as
  // verified so the two can never visibly disagree.
  obj.verified = Boolean(obj.verified);
  if (obj.role === 'seller' && obj.sellerId) {
    try {
      const key = String(obj.sellerId);
      const fromMap = sellerVerifiedById?.get(key);
      const sellerVerified =
        fromMap !== undefined ? fromMap : (await Seller.findById(obj.sellerId))?.verified;
      if (sellerVerified) obj.verified = true;
    } catch {
      // A missing/unreadable Seller directory record must never turn a valid user response
      // (or a whole admin list — see serializeUsers) into a 500. Fall back to the account flag.
    }
  }
  return obj;
}

// Batch version — one Seller query for the whole set instead of one per user, and resilient to
// a single bad record so the admin KYC / Users lists can't fail wholesale.
export async function serializeUsers(users) {
  const sellerIds = [
    ...new Set(
      users
        .filter((u) => u.role === 'seller' && u.sellerId)
        .map((u) => String(u.sellerId))
    ),
  ];

  const sellerVerifiedById = new Map();
  if (sellerIds.length > 0) {
    try {
      const sellers = await Seller.find({ _id: { $in: sellerIds } }).select('verified');
      for (const s of sellers) sellerVerifiedById.set(String(s._id), Boolean(s.verified));
    } catch {
      // Leave the map empty — serializeUser then falls back to each account's own flag.
    }
  }

  return Promise.all(users.map((u) => serializeUser(u, sellerVerifiedById)));
}
