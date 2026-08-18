import mongoose from 'mongoose';

// A seller's own manageable inventory — deliberately separate from the read-only public
// `Product` catalog, so the seller portal has full CRUD without touching storefront data.
const sellerProductSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    moq: { type: String, required: true },
    stock: { type: Number, required: true },
    status: { type: String, default: 'active' },
    images: { type: [String], default: [] },
    img: { type: String, default: null },
    // Explicit opt-in for the B2B marketplace tab.
    b2bEnabled: { type: Boolean, default: false },
    // Defaults true to preserve the storefront's existing always-on "Free shipping" badge look
    // for sellers who've never touched this control (see Product.freeShipping).
    freeShipping: { type: Boolean, default: true },
    // Qualifies freeShipping: false = free shipping within the seller's own country only.
    worldwideFreeShipping: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SellerProduct = mongoose.model('SellerProduct', sellerProductSchema);
