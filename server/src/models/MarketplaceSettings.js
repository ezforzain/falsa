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

    // TCS Courier booking defaults — set once here so every seller's "Ship with Falsafah" click
    // (see PATCH /api/seller/orders/:id/ship) can build a valid Booking-Create request with zero
    // extra input from the seller. tcsCostCenterCode is picked from a live list fetched via TCS's
    // Cost Center Inquiry API (see GET /api/admin/tcs/cost-centers) rather than typed blind.
    tcsCostCenterCode: { type: String, default: '' },
    tcsServiceCode: { type: String, default: '' },
    // This app doesn't track a per-product weight yet, so every TCS booking uses this one
    // platform-wide estimate (TCS's own documented minimum, 0.5kg, until real weights exist).
    tcsDefaultWeightKg: { type: Number, default: 0.5 },
  },
  { timestamps: true }
);

export const MarketplaceSettings = mongoose.model('MarketplaceSettings', marketplaceSettingsSchema);
