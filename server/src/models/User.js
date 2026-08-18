import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['buyer', 'seller', 'admin'], required: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    companyName: { type: String, required: true },
    country: { type: String, default: null },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    category: { type: String, default: null },
    address: { type: String, default: null },

    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
    sellerType: { type: String, enum: ['individual', 'corporate', null], default: null },

    // Individual seller path — CNIC.
    cnicNumber: { type: String, default: null },
    cnicFront: { type: String, default: null },
    cnicBack: { type: String, default: null },

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

    // Shared KYC review trail.
    cnicStatus: { type: String, enum: ['pending', 'approved', 'rejected', null], default: null },
    cnicRejectionReason: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Never send the password hash or raw KYC document data back to the client — only the admin
// KYC-detail endpoint reaches past this via a separate projection.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  delete obj.cnicFront;
  delete obj.cnicBack;
  delete obj.businessDocument;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);
