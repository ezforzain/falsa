import { Seller } from '../models/Seller.js';

// A seller's public "Verified Store" badge lives on the Seller directory (see User.sellerId),
// separate from the account itself — every response that sends a user back to the client needs
// this attached, since the frontend reads `user.verified` directly (e.g. the seller portal
// header badge).
export async function serializeUser(user) {
  const obj = user.toPublicJSON();
  if (obj.role === 'seller' && obj.sellerId) {
    const sellerRecord = await Seller.findById(obj.sellerId);
    obj.verified = sellerRecord ? sellerRecord.verified : false;
  }
  return obj;
}

export async function serializeUsers(users) {
  return Promise.all(users.map(serializeUser));
}
