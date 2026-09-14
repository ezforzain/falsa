import mongoose from 'mongoose';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const sellerOrderSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Shared across every SellerOrder line item created from the same checkout call (one per
    // seller in the cart) — see checkout.routes.js. This is the one order id a buyer, a seller,
    // and admin are all looking at when they refer to "the same order" (e.g. "Order #FLS-10025"),
    // since a single checkout can fan out into several SellerOrder documents (one per seller).
    // Null on legacy/admin-seeded orders that predate this field.
    orderRef: { type: String, default: null, index: true },
    buyerCompany: { type: String, required: true },
    buyerCountry: { type: String, required: true },
    productName: { type: String, required: true },
    qty: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
    // No real payment gateway is wired up (checkout is cash-on-delivery style) — this exists so
    // buyer/seller/admin all have a real field to read instead of inventing one client-side.
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Refunded'], default: 'Unpaid' },
    placedAt: { type: Date, default: Date.now },
    // Real buyer account + product, set when checkout creates this order — null for legacy/
    // admin-seeded orders that predate real checkout wiring.
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    productId: { type: String, ref: 'Product', default: null },
    productImg: { type: String, default: null },
    // Snapshot of the buyer's delivery address at order time — deliberately a copy, not a live
    // reference to User.savedAddress, so it (and the shipping label built from it) never changes
    // even if the buyer edits their saved address later.
    shippingAddress: {
      type: {
        fullName: String,
        phone: String,
        city: String,
        address: String,
        label: String,
      },
      _id: false,
      default: null,
    },
    // Set once via PATCH /api/seller/orders/:id/ship and never again — see the 409 guard there.
    // That immutability is what makes the generated label/tracking info tamper-proof.
    // 'falsafah' is now a real TCS Courier booking under the hood (branded "Falsafah Express" to
    // the buyer) — see tcsService.js and the /ship handler in seller.routes.js.
    shippingMethod: { type: String, enum: ['falsafah', 'self', null], default: null },
    courierName: { type: String, default: null },
    trackingId: { type: String, default: null },
    labelUrl: { type: String, default: null },
    shippedAt: { type: Date, default: null },
    // Last-known TCS delivery status, cached from the Tracking API whenever an admin or the buyer
    // refreshes it (see GET /api/admin/orders/:id/tcs/track and GET /api/orders/:id/tracking) —
    // avoids hitting TCS on every page load just to render the badge. Only meaningful when
    // shippingMethod is 'falsafah' (the only TCS-backed method).
    tcsDeliveryStatus: { type: String, default: null },
    tcsDeliveryStatusAt: { type: Date, default: null },
    // Set once the "new order" SMS covering this order has been sent to the seller (see
    // smsService.notifySellerNewOrder, called from checkout.routes.js) — never re-sent once set,
    // so a retried/duplicate checkout request can't double-text the seller for the same order.
    sellerNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export { ORDER_STATUSES };
export const SellerOrder = mongoose.model('SellerOrder', sellerOrderSchema);
