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
  },
  { timestamps: true }
);

export const SellerProduct = mongoose.model('SellerProduct', sellerProductSchema);
