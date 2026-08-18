import mongoose from 'mongoose';

// Storefront directory — the "is_verified" source of truth behind the public "Verified Store"
// badge. Kept separate from User because most catalog sellers don't have a login account.
// `toJSON: { virtuals: true }` is what puts an `id` string (not just `_id`) on every response —
// the frontend (StoreCard, FollowButton, AdminPage) reads `seller.id` throughout.
const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    verified: { type: Boolean, default: false },
    // Independent of `verified` — a seller can be a verified individual without being an
    // official/mall storefront, and vice versa. Admin-toggleable, same pattern as `verified`.
    officialStore: { type: Boolean, default: false },
    // Backfilled from the owning User's signup country the first time a listing syncs (see
    // publicCatalogSync.js) — not collected directly on this directory record.
    country: { type: String, default: null },
    followerCount: { type: Number, default: 0 },
    responseRate: { type: Number, default: 90 },
    responseTime: { type: String, default: 'Within a day' },
    description: { type: String, default: '' },
    bannerUrl: { type: String, default: null },
    hours: { type: String, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

export const Seller = mongoose.model('Seller', sellerSchema);
