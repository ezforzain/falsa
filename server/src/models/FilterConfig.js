import mongoose from 'mongoose';

// Fixed library of filter types an admin can turn on/off per marketplace section — every one is
// backed by a real Product/Seller field (see marketplaceQuery.js), never an invented attribute
// with nothing behind it. Admins configure WHICH of these appear where and (for list types)
// which option values are offered; they can't create a brand-new type tied to data that doesn't
// exist.
export const FILTER_TYPES = [
  'category',
  'country',
  'priceRange',
  'moq',
  'verified',
  'officialStore',
  'freeShipping',
  'rating',
  'discount',
  'sortBy',
];

export const FILTER_SECTIONS = ['b2b', 'spotlight', 'worldwide', 'freeshipping'];

const filterConfigSchema = new mongoose.Schema(
  {
    section: { type: String, enum: FILTER_SECTIONS, required: true },
    type: { type: String, enum: FILTER_TYPES, required: true },
    // Admin-editable display label — starts as a sensible default (see DEFAULT_FILTERS in
    // marketplace.routes.js) but isn't tied to it after creation.
    label: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    // Display order within the section — admin reorders via the Filters admin tab (swap with a
    // neighbor), same shape as Product.reachBoost's +/- stepper.
    order: { type: Number, default: 0 },
    // List-type filters only (category/country). Empty = derive live from product data (today's
    // behavior); non-empty = admin-curated list, used verbatim instead.
    options: { type: [String], default: [] },
  },
  { timestamps: true }
);

filterConfigSchema.index({ section: 1, type: 1 }, { unique: true });

export const FilterConfig = mongoose.model('FilterConfig', filterConfigSchema);
