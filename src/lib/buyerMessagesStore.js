// Buyer-side counterpart to sellerMessagesStore.js — same demo/localStorage approach, since
// there's no real-time messaging backend yet (see that file for the full rationale). Scoped per
// buyer (signed-in user id, or the guest id also used for the guest cart/follows — see
// lib/api.js's getGuestId) with one conversation per seller the buyer has messaged.
const EVENT = 'buyer-messages-updated';
const storageKey = (buyerId) => `falsafahtot_buyer_messages_${buyerId}`;

export function loadConversations(buyerId) {
  if (!buyerId) return [];
  try {
    const raw = localStorage.getItem(storageKey(buyerId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConversations(buyerId, conversations) {
  if (!buyerId) return;
  try {
    localStorage.setItem(storageKey(buyerId), JSON.stringify(conversations));
  } catch {
    // Storage unavailable (e.g. private browsing) — conversation state just stays session-only.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

// Finds the buyer's existing thread with this seller, or opens a new empty one — used when a
// buyer arrives via "Chat" on a product/seller page so that seller's conversation is ready to
// type into immediately, without them having to find it in a list first.
export function getOrCreateConversation(buyerId, seller) {
  const conversations = loadConversations(buyerId);
  const existing = conversations.find((c) => c.sellerId === seller.id);
  if (existing) return { conversation: existing, conversations };

  const conversation = { id: seller.id, sellerId: seller.id, sellerName: seller.name, messages: [] };
  const next = [conversation, ...conversations];
  saveConversations(buyerId, next);
  return { conversation, conversations: next };
}

export const MESSAGES_UPDATED_EVENT = EVENT;
