import mongoose from 'mongoose';

const PAYOUT_METHODS = ['bank_transfer', 'cash', 'other'];

// Admin-recorded ledger entry — there's no real payment gateway wired up, so payouts are entered
// manually by an admin against a seller's account (see admin.routes.js POST /users/:id/payouts).
const payoutSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: PAYOUT_METHODS, default: 'bank_transfer' },
    reference: { type: String, default: '' },
    note: { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export { PAYOUT_METHODS };
export const Payout = mongoose.model('Payout', payoutSchema);
