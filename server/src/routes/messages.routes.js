import { Router } from 'express';
import { Conversation } from '../models/Conversation.js';
import { Seller } from '../models/Seller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureGuestId } from '../middleware/guest.js';
import { applyMessageDelete, serializeMessages } from '../utils/conversationMessages.js';

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

// sellerLogoUrl lets the chat list/header show the seller's real store logo (via the shared
// <Avatar> component, same as everywhere else a seller's identity is shown) instead of always
// falling back to an initial letter.
function serialize(conv, sellerLogoUrl = null) {
  return {
    id: conv._id,
    sellerId: conv.sellerId,
    sellerName: conv.sellerName,
    sellerLogoUrl,
    messages: serializeMessages(conv.messages, 'buyer'),
    unread: conv.buyerUnread || 0,
  };
}

// One Seller query for the whole list instead of one per conversation.
async function serializeList(conversations) {
  const sellerIds = [...new Set(conversations.map((c) => String(c.sellerId)))];
  const sellers = sellerIds.length ? await Seller.find({ _id: { $in: sellerIds } }).select('logoUrl') : [];
  const logoById = new Map(sellers.map((s) => [String(s._id), s.logoUrl]));
  return conversations.map((c) => serialize(c, logoById.get(String(c.sellerId)) || null));
}

async function serializeOne(conv) {
  const seller = await Seller.findById(conv.sellerId).select('logoUrl').catch(() => null);
  return serialize(conv, seller?.logoUrl || null);
}

router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ buyerId: buyerIdFor(req) }).sort({ updatedAt: -1 });
    res.json({ conversations: await serializeList(conversations) });
  })
);

// Single-thread fetch for the full-screen conversation view (ConversationPage) — avoids
// re-fetching the whole list just to open/poll one chat.
router.get(
  '/conversations/:id',
  asyncHandler(async (req, res) => {
    const conv = await Conversation.findOne({ _id: req.params.id, buyerId: buyerIdFor(req) });
    if (!conv) return res.status(404).json({ message: 'Conversation not found.' });
    res.json({ conversation: await serializeOne(conv) });
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
    res.json({ conversation: serialize(conv, sellerDoc.logoUrl || null) });
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
    res.json({ conversation: await serializeOne(conv) });
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
    res.json({ conversation: await serializeOne(conv) });
  })
);

// Deletes the whole thread from the buyer's side only — the seller's own copy of the
// conversation is untouched, same as a one-sided "delete chat" in most messengers. Buyer-scoped
// by construction (the query itself is buyerId-filtered), so this can't touch anyone else's data.
router.delete(
  '/conversations/:id',
  asyncHandler(async (req, res) => {
    const result = await Conversation.deleteOne({ _id: req.params.id, buyerId: buyerIdFor(req) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Conversation not found.' });
    res.json({ ok: true });
  })
);

// WhatsApp-style per-message delete — `scope: 'me'` hides it from just this buyer's own view,
// `scope: 'everyone'` tombstones it for both sides (only if this buyer sent it). Messages are
// plain subdocuments with no _id of their own (see models/Conversation.js), so the position in
// the array — which the client already has, having rendered it — is the address; the 'everyone'
// ownership check happens server-side against the trusted `from` field, never client input.
router.patch(
  '/conversations/:id/messages/:index',
  asyncHandler(async (req, res) => {
    const conv = await Conversation.findOne({ _id: req.params.id, buyerId: buyerIdFor(req) });
    if (!conv) return res.status(404).json({ message: 'Conversation not found.' });

    const index = Number(req.params.index);
    const error = applyMessageDelete(conv, index, 'buyer', req.body?.scope);
    if (error) return res.status(error.status).json({ message: error.message });

    await conv.save();
    res.json({ conversation: await serializeOne(conv) });
  })
);

export default router;
