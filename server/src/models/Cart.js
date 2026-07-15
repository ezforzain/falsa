import mongoose from 'mongoose';

// A guest-scoped cart (mirrors the frontend's current behavior: no sign-in required to add to
// cart). `guestId` is a random id issued via an httpOnly cookie by the guest-id middleware.
const cartSchema = new mongoose.Schema({
  guestId: { type: String, required: true, unique: true },
  items: [
    {
      _id: false,
      productId: { type: String, ref: 'Product', required: true },
      qty: { type: Number, required: true, min: 1 },
    },
  ],
});

export const Cart = mongoose.model('Cart', cartSchema);
