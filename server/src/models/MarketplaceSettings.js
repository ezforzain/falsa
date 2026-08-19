import mongoose from 'mongoose';

// Singleton — the marketplace has exactly one settings document. admin.routes.js always
// finds-or-creates the first one rather than looking up by id.
const marketplaceSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'Falsafah' },
    supportEmail: { type: String, default: '' },
    commissionRatePercent: { type: Number, default: 5 },
    currency: { type: String, default: 'PKR' },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MarketplaceSettings = mongoose.model('MarketplaceSettings', marketplaceSettingsSchema);
