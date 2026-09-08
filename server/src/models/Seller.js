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
    // Store logo/avatar — shown wherever a buyer sees this seller's identity (StoreCard,
    // SellerInfoSection, the store profile page). Independent of bannerUrl: a wide cover photo
    // and a square/circular logo are cropped and displayed completely differently.
    logoUrl: { type: String, default: null },
    hours: { type: String, default: null },
    // Extra promotional banners/GIFs a seller can add on top of the single cover `bannerUrl` —
    // shown as a carousel at the top of their public store page, seller-ordered (array order).
    promoBanners: { type: [{ url: { type: String, required: true } }], default: [] },
    // Seller-defined product groupings ("New Arrivals", "Eid Collection", …) shown as their own
    // sections on the seller's public store page — scoped to this store only, distinct from the
    // platform-wide Product.category taxonomy. productIds reference Product._id (a slug string,
    // not an ObjectId — see the Product model), seller-ordered within each section.
    sections: {
      type: [{ name: { type: String, required: true }, productIds: { type: [String], default: [] } }],
      default: [],
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

export const Seller = mongoose.model('Seller', sellerSchema);
