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
    // Set via PATCH /api/auth/avatar (server/src/routes/auth.routes.js) — always either null or a
    // path under /uploads/avatars/ returned by POST /api/uploads/avatars, never an arbitrary URL.
    avatarUrl: { type: String, default: null },

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
