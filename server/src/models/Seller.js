import mongoose from 'mongoose';

// Storefront directory — the "is_verified" source of truth behind the public "Verified Store"
// badge. Kept separate from User because most catalog sellers don't have a login account.
// `toJSON: { virtuals: true }` is what puts an `id` string (not just `_id`) on every response —
// the frontend (StoreCard, FollowButton, AdminPage) reads `seller.id` throughout.
const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    verified: { type: Boolean, default: false },
    followerCount: { type: Number, default: 0 },
    responseRate: { type: Number, default: 90 },
    responseTime: { type: String, default: 'Within a day' },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

export const Seller = mongoose.model('Seller', sellerSchema);
