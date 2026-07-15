import mongoose from 'mongoose';

// Backs both /api/spotlight/near and /api/spotlight/trending — `kind` distinguishes the two
// rails, and only the fields relevant to that kind are populated.
const spotlightEntrySchema = new mongoose.Schema({
  kind: { type: String, enum: ['near', 'trending'], required: true },
  order: { type: Number, required: true },
  rank: Number, // near
  distance: String, // near
  shipping: String, // near
  growth: String, // trending
  productId: { type: String, ref: 'Product', required: true },
});

export const SpotlightEntry = mongoose.model('SpotlightEntry', spotlightEntrySchema);
