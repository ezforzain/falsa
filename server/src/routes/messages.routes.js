import { Router } from 'express';
import { Conversation } from '../models/Conversation.js';
import { Seller } from '../models/Seller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureGuestId } from '../middleware/guest.js';

// Buyer side of the buyer<->seller messenger (see server/src/models/Conversation.js). Mounted at
// /api/messages; the seller side lives in seller.routes.js alongside the rest of the seller
// portal, reading the same Conversation documents.
const router = Router();
router.use(ensureGuestId);

// A signed-in buyer is identified by their User id; a guest by the id middleware/guest.js
// assigns (the same identity the guest cart uses), so a conversation started before signing in
// isn't orphaned.
function buyerIdFor(req) {
  return req.user ? String(req.user._id) : req.guestId;
}

function serialize(conv) {
  return {
    id: conv._id,
    sellerId: conv.sellerId,
    sellerName: conv.sellerName,
    messages: conv.messages,
    unread: conv.buyerUnread || 0,
  };
}

router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ buyerId: buyerIdFor(req) }).sort({ updatedAt: -1 });
    res.json({ conversations: conversations.map(serialize) });
  })
);

// Used when a buyer arrives via "Chat" on a product/seller page — gets or creates the thread
// with that seller so it's ready to type into immediately, without hunting for it in a list.
router.post(
  '/conversations',
  asyncHandler(async (req, res) => {
    const { sellerId, sellerName, buyerName } = req.body || {};
    if (!sellerId) return res.status(400).json({ message: 'sellerId is required.' });
    const sellerDoc = await Seller.findById(sellerId).catch(() => null);
    if (!sellerDoc) return res.status(404).json({ message: 'Seller not found.' });

    const buyerId = buyerIdFor(req);
    const conv = await Conversation.findOneAndUpdate(
      { sellerId, buyerId },
      {
        $setOnInsert: { sellerId, buyerId, messages: [] },
        $set: { sellerName: sellerName || sellerDoc.name, buyerName: buyerName || 'Guest buyer' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ conversation: serialize(conv) });
  })
);

router.post(
  '/conversations/:id/messages',
  asyncHandler(async (req, res) => {
    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Message text is required.' });

    const conv = await Conversation.findOne({ _id: req.params.id, buyerId: buyerIdFor(req) });
    if (!conv) return res.status(404).json({ message: 'Conversation not found.' });

    conv.messages.push({ from: 'buyer', text, at: new Date() });
    conv.sellerUnread = (conv.sellerUnread || 0) + 1;
    await conv.save();
    res.json({ conversation: serialize(conv) });
  })
);

router.patch(
  '/conversations/:id/read',
  asyncHandler(async (req, res) => {
    const conv = await Conversation.findOne({ _id: req.params.id, buyerId: buyerIdFor(req) });
    if (!conv) return res.status(404).json({ message: 'Conversation not found.' });
    if (conv.buyerUnread) {
      conv.buyerUnread = 0;
      await conv.save();
    }
    res.json({ conversation: serialize(conv) });
  })
);

export default router;
