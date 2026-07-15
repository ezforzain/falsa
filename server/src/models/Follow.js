import mongoose from 'mongoose';

// Guest-scoped store follows, same rationale as Cart — following a store doesn't require
// signing in anywhere else in this app.
const followSchema = new mongoose.Schema({
  guestId: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
});
followSchema.index({ guestId: 1, sellerId: 1 }, { unique: true });

export const Follow = mongoose.model('Follow', followSchema);
