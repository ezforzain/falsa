import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  { id: String, name: String, img: String },
  { _id: false }
);

const specSchema = new mongoose.Schema({ label: String, value: String }, { _id: false });

const reviewSchema = new mongoose.Schema(
  {
    author: String,
    rating: Number,
    comment: String,
    date: Date,
    images: { type: [String], default: [] },
    verifiedPurchase: { type: Boolean, default: true },
  },
  { _id: false }
);

// Public read-only catalog, seeded from the design mock data. `_id` is the human-readable slug
// (e.g. "cotton-twill-fabric") so product routes can look products up directly by :id.
const productSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    seller: { type: String, required: true }, // denormalized seller name, mirrors seed data
    location: String,
    category: { type: String, required: true },
    rating: String,
    price: { type: String, required: true }, // e.g. "Rs 670"
    moq: String,
    unit: String,
    badge: String,
    stock: { type: Number, default: null },
    img: String,
    // Detail-page gallery — always built from this product's own photo plus real photos of
    // other products in the same category (see seed/data.js), never from an unrelated category,
    // so the gallery can never show e.g. clothing photos on a sports-goods listing.
    images: { type: [String], default: [] },
    discountPercent: Number,
    variants: [variantSchema],
    trendingOrder: { type: Number, default: null }, // set for products in the "trending" rail
    description: String,
    specifications: [specSchema],
    reviews: [reviewSchema],
    sold: { type: Number, default: 0 }, // units sold, drives the "Best Seller · TOP N" rank badge
    freeShipping: { type: Boolean, default: true },
    // Admin-curated placement in the Home "Spotlight" tab — independent of the near/trending
    // SpotlightEntry rails, which are seeded/ranked rather than hand-picked per product.
    spotlight: { type: Boolean, default: false },
    spotlightType: { type: String, enum: ['featured', 'sponsored'], default: 'featured' },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
