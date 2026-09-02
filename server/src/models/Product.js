import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  { id: String, name: String, img: String, sku: String, price: Number, stock: Number },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    weightKg: Number,
    lengthCm: Number,
    widthCm: Number,
    heightCm: Number,
    dispatchTime: String,
    shipsFrom: String,
    shippingFee: Number,
  },
  { _id: false }
);

const specSchema = new mongoose.Schema({ label: String, value: String }, { _id: false });

// B2B-only bulk/volume pricing the seller entered — maxQty null means "and above". Entirely
// optional, only meaningful when b2bEnabled is true.
const priceTierSchema = new mongoose.Schema(
  { minQty: Number, maxQty: { type: Number, default: null }, price: Number },
  { _id: false }
);

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
    // Bumped once per public product-page load (see GET /products/:id in catalog.routes.js) —
    // mirrored back to the seller portal's listing views (see seller.routes.js) so a seller can
    // see how many times each of their listings has been viewed.
    views: { type: Number, default: 0 },
    freeShipping: { type: Boolean, default: true },
    // Qualifies freeShipping: false means the free shipping is local (seller's own country) only,
    // true means it's honored for buyers in any country. Meaningless when freeShipping is false.
    worldwideFreeShipping: { type: Boolean, default: false },
    // Admin-curated placement in the Home "Spotlight" tab — independent of the near/trending
    // SpotlightEntry rails, which are seeded/ranked rather than hand-picked per product. Now also
    // consumed as a ranking boost by the country-aware Spotlight marketplace tab (see
    // marketplace.routes.js) rather than being the section's only source of products.
    spotlight: { type: Boolean, default: false },
    spotlightType: { type: String, enum: ['featured', 'sponsored'], default: 'featured' },
    // Admin-controlled reach multiplier (1x–10x, see the Products tab in the admin panel). Feeds
    // straight into the marketplace ranking score and the homepage / category ordering, so an
    // admin can push any product up or down the feed without touching the Spotlight system.
    reachBoost: { type: Number, default: 1, min: 1, max: 10 },
    // Explicit seller opt-in for the B2B marketplace tab — never inferred.
    b2bEnabled: { type: Boolean, default: false },
    // Denormalized from the linked Seller/User at sync time (see publicCatalogSync.js) so the
    // marketplace tabs can filter/rank with plain Mongo queries instead of populate+postfilter.
    sellerCountry: { type: String, default: null },
    sellerVerified: { type: Boolean, default: false },
    sellerOfficialStore: { type: Boolean, default: false },
    // Numeric twins of `price` ("Rs 670") and `moq` ("500m") for range filtering/sorting —
    // the display strings are unchanged and still the source of truth for rendering.
    priceValue: { type: Number, default: null },
    moqValue: { type: Number, default: null },
    // #hashtags from the seller's description, surfaced for search/discovery.
    tags: { type: [String], default: [] },
    shipping: { type: shippingSchema, default: () => ({}) },
    priceTiers: { type: [priceTierSchema], default: [] },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
