import mongoose from 'mongoose';

// One document per signed-in device/browser — created at signin/signup, deleted on logout or
// explicit revocation (see routes/auth.routes.js). The JWT only carries this doc's sessionId
// (see utils/token.js); attachUser (middleware/auth.js) requires the doc to still exist before
// trusting the token, which is what makes "sign out this device" actually invalidate it instead
// of just hiding it from a list.
const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
