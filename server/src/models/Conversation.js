import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ['buyer', 'seller'], required: true },
    text: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// One thread per (seller, buyer) pair, persisted server-side so a buyer's message actually
// reaches the seller regardless of what device/browser either of them is on — the previous
// localStorage-only implementation could never do that, since localStorage never leaves the
// browser that wrote it. buyerId is a User._id (signed-in buyer) or a guest id (see
// middleware/guest.js) — stored as a plain string either way since guest ids aren't ObjectIds.
const conversationSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    sellerName: { type: String, default: '' },
    buyerId: { type: String, required: true },
    buyerName: { type: String, default: 'Guest buyer' },
    messages: { type: [messageSchema], default: [] },
    buyerUnread: { type: Number, default: 0 },
    sellerUnread: { type: Number, default: 0 },
  },
  { timestamps: true }
);

conversationSchema.index({ sellerId: 1, buyerId: 1 }, { unique: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);
