import mongoose from 'mongoose';

// Two flavors of the same taxonomy, matching the mock data shape exactly:
// `kind: 'category'` powers /api/categories, `kind: 'mobile'` powers /api/categories/mobile.
const categorySchema = new mongoose.Schema({
  kind: { type: String, enum: ['category', 'mobile'], required: true },
  order: { type: Number, required: true },
  key: { type: String, required: true },
  name: { type: String, required: true },
  fullName: String, // mobile only
  icon: String, // category only
  img: String,
});

export const Category = mongoose.model('Category', categorySchema);

const mobileTabSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  key: { type: String, required: true },
  label: { type: String, required: true },
  banner: { type: String, default: null },
});

export const MobileTab = mongoose.model('MobileTab', mobileTabSchema);
