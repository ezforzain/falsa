import mongoose from 'mongoose';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const sellerOrderSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerCompany: { type: String, required: true },
    buyerCountry: { type: String, required: true },
    productName: { type: String, required: true },
    qty: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export { ORDER_STATUSES };
export const SellerOrder = mongoose.model('SellerOrder', sellerOrderSchema);
