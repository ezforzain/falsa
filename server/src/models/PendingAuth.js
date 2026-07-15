import mongoose from 'mongoose';

// Short-lived server-side state for the pre-OTP-verification step of signin/signup/password
// reset. `otp` is fixed to a dev-mode code for now (see utils/token.js) — swap for a real
// emailed code later without changing this shape.
const pendingAuthSchema = new mongoose.Schema({
  pendingToken: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  purpose: { type: String, enum: ['signin', 'signup', 'reset'], required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 15 }, // TTL: 15 minutes
});

export const PendingAuth = mongoose.model('PendingAuth', pendingAuthSchema);
