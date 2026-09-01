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
    // #hashtags parsed live from the description in the seller form.
    tags: { type: [String], default: [] },
    // Category-driven attribute fields (Brand, Material, Warranty, …), same shape as Product.specifications.
    specifications: { type: [{ label: String, value: String }], default: [] },
    // Raw variant axis definitions the seller entered, e.g. { name: 'Color', values: ['Red', 'Blue'] }.
    variantAxes: { type: [{ name: String, values: [String] }], default: [] },
    // Generated combination matrix (e.g. "Red / S"), each row editable by the seller.
    variants: {
      type: [{ name: String, sku: String, price: Number, stock: Number }],
      default: [],
    },
    shipping: {
      weightKg: { type: Number, default: null },
      lengthCm: { type: Number, default: null },
      widthCm: { type: Number, default: null },
      heightCm: { type: Number, default: null },
      dispatchTime: { type: String, default: '' },
      shipsFrom: { type: String, default: '' },
      // Only meaningful when freeShipping is false.
      shippingFee: { type: Number, default: null },
    },
    // B2B-only bulk/volume pricing — entirely optional, shown in the seller form's B2B section
    // (see ProductFormModal.jsx) when b2bEnabled is set. maxQty null means "and above".
    priceTiers: {
      type: [{ minQty: Number, maxQty: { type: Number, default: null }, price: Number }],
      default: [],
    },
  },
  { timestamps: true }
);

export const SellerProduct = mongoose.model('SellerProduct', sellerProductSchema);
