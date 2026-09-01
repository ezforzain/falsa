import mongoose from 'mongoose';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const sellerOrderSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerCompany: { type: String, required: true },
    buyerCountry: { type: String, required: true },
    productName: { type: String, required: true },
    qty: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
    placedAt: { type: Date, default: Date.now },
    // Real buyer account + product, set when checkout creates this order — null for legacy/
    // admin-seeded orders that predate real checkout wiring.
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    productId: { type: String, ref: 'Product', default: null },
    productImg: { type: String, default: null },
    // Snapshot of the buyer's delivery address at order time — deliberately a copy, not a live
    // reference to User.savedAddress, so it (and the shipping label built from it) never changes
    // even if the buyer edits their saved address later.
    shippingAddress: {
      type: {
        fullName: String,
        phone: String,
        city: String,
        address: String,
        label: String,
      },
      _id: false,
      default: null,
    },
    // Set once via PATCH /api/seller/orders/:id/ship and never again — see the 409 guard there.
    // That immutability is what makes the generated label/tracking info tamper-proof.
    shippingMethod: { type: String, enum: ['falsafah', 'self', null], default: null },
    courierName: { type: String, default: null },
    trackingId: { type: String, default: null },
    labelUrl: { type: String, default: null },
    shippedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export { ORDER_STATUSES };
export const SellerOrder = mongoose.model('SellerOrder', sellerOrderSchema);
