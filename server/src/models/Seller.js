import mongoose from 'mongoose';

// Storefront directory — the "is_verified" source of truth behind the public "Verified Store"
// badge. Kept separate from User because most catalog sellers don't have a login account.
const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    verified: { type: Boolean, default: false },
    followerCount: { type: Number, default: 0 },
    responseRate: { type: Number, default: 90 },
  },
  { timestamps: true }
);

export const Seller = mongoose.model('Seller', sellerSchema);
