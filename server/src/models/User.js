import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['buyer', 'seller', 'admin'], required: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    // Admin ban controls (see PATCH /api/admin/users/:id/ban). `status: 'suspended'` is the ban
    // flag; `bannedUntil` set = temporary ban that auto-lifts once the date passes, `bannedUntil`
    // null while suspended = permanent ban. `banReason` is shown to the admin, not the user.
    bannedUntil: { type: Date, default: null },
    banReason: { type: String, default: null },
    // Admin-granted "blue tick" — can be set on ANY account (buyer, seller, admin) from the
    // Users tab. For sellers it is kept in lockstep with the linked Seller.verified badge.
    verified: { type: Boolean, default: false },

    companyName: { type: String, required: true },
    country: { type: String, default: null },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    category: { type: String, default: null },
    address: { type: String, default: null },
    // Seller's pickup city — free text, no code lookup needed (TCS Booking-Create only requires
    // a city *name*, not a city code, for shipperinfo). Gated before "Ship with Falsafah" works,
    // same pattern as the bank-details gate below, since TCS bookings need a real pickup city.
    city: { type: String, default: null },
    // Set via PATCH /api/auth/avatar (server/src/routes/auth.routes.js) — always either null or a
    // path under /uploads/avatars/ returned by POST /api/uploads/avatars, never an arbitrary URL.
    avatarUrl: { type: String, default: null },
    // Set via PATCH /api/auth/banner — same deal as avatarUrl but under /uploads/store-banners/,
    // shown behind the avatar on the profile page (see AccountPage).
    bannerUrl: { type: String, default: null },
    // TikTok-style "@handle" shown under the display name on the profile page. Auto-assigned at
    // signup (slug of companyName + a short random suffix so collisions are effectively
    // impossible without a retry loop) and editable afterwards via PATCH /api/auth/profile.
    // Sparse so legacy/seed accounts created before this field existed don't all collide on null.
    handle: { type: String, default: null, unique: true, sparse: true },

    // Email verification — the account is only ever flipped to true by a successful
    // /api/auth/verify-email call; nothing else sets it.
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    // Cooldown for the resend button — see /api/auth/verify-email/resend.
    emailVerificationSentAt: { type: Date, default: null },

    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
    sellerType: { type: String, enum: ['individual', 'corporate', null], default: null },

    // Corporate seller path.
    location: { type: String, default: null },
    businessAddress: { type: String, default: null },
    businessDocument: { type: String, default: null },
    legalCompanyName: { type: String, default: null },
    registrationNumber: { type: String, default: null },
    ntn: { type: String, default: null },
    companyEmail: { type: String, default: null },
    companyPhone: { type: String, default: null },
    bankName: { type: String, default: null },
    accountTitle: { type: String, default: null },
    accountNumber: { type: String, default: null },
    iban: { type: String, default: null },

    // Delivery address for checkout (see POST /api/checkout) — auto-saved from whatever the
    // buyer submits at checkout (new or edited) so it's pre-filled next time, one address per
    // account rather than a full address book.
    savedAddress: {
      type: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        city: { type: String, required: true },
        address: { type: String, required: true },
        label: { type: String, enum: ['Home', 'Office'], default: 'Home' },
      },
      _id: false,
      default: null,
    },

    // App preferences (Settings page) — theme/reduce-motion stay device-local (localStorage),
    // but language and notification preferences follow the account across devices.
    language: { type: String, enum: ['en', 'ur'], default: 'en' },
    notificationPreferences: {
      type: {
        master: { type: Boolean, default: true },
        orders: { type: Boolean, default: true },
        wishlist: { type: Boolean, default: true },
        account: { type: Boolean, default: true },
      },
      _id: false,
      default: () => ({ master: true, orders: true, wishlist: true, account: true }),
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Never send the password hash or the raw corporate business document back to the client.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  delete obj.businessDocument;
  delete obj.emailVerificationTokenHash;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);
