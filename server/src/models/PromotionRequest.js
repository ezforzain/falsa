import mongoose from 'mongoose';

// A seller asking to have one of their own listings boosted — admin-reviewed. Approval flips
// the same `spotlight`/`spotlightType` fields on the public Product that the admin Products tab
// already toggles directly (see admin.routes.js handleSetSpotlight equivalent).
const promotionRequestSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProduct', required: true },
    productName: { type: String, required: true },
    spotlightType: { type: String, enum: ['featured', 'sponsored'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // How much the seller says they want to spend boosting this listing — a stated estimate the
    // admin sees when reviewing, same trust level as `note`. Not tied to any real billing/ad
    // spend (the app has no payment gateway); optional, defaults unset.
    budgetPkr: { type: Number, default: null },
    note: { type: String, default: '' },
    rejectionReason: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PromotionRequest = mongoose.model('PromotionRequest', promotionRequestSchema);
