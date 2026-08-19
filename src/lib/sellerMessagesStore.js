// Demo buyer/seller chat — there's no real-time messaging backend yet, so conversation state
// lives in localStorage, scoped per seller account. SellerLayout reads it for the unread-count
// badge; SellerMessages.jsx owns seeding + sending. The custom event keeps the two in sync
// without prop-drilling through the router (SellerLayout renders <Outlet/>, not the page itself).
const EVENT = 'seller-messages-updated';
const storageKey = (userId) => `falsafahtot_seller_messages_${userId}`;

const FALLBACK_BUYERS = ['Al-Noor Traders', 'Zenith Imports Co.', 'Blue Ocean Textiles'];

function buildSeed(buyerNames) {
  const names = buyerNames && buyerNames.length > 0 ? buyerNames.slice(0, 4) : FALLBACK_BUYERS;
  const now = Date.now();
  return names.map((name, i) => ({
    id: `conv_${i}`,
    buyerCompany: name,
    unread: i === 0 ? 2 : i === 1 ? 1 : 0,
    messages: [
      { id: `${i}_a`, from: 'buyer', text: 'Hi, is this item still in stock?', at: now - (i + 2) * 3_600_000 },
      { id: `${i}_b`, from: 'buyer', text: "What's your best price for a bulk order?", at: now - (i + 1) * 3_000_000 },
    ],
  }));
}

export function loadConversations(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadOrSeedConversations(userId, buyerNames) {
  const existing = loadConversations(userId);
  if (existing.length > 0) return existing;
  const seeded = buildSeed(buyerNames);
  saveConversations(userId, seeded);
  return seeded;
}

export function saveConversations(userId, conversations) {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(conversations));
  } catch {
    // Storage unavailable (e.g. private browsing) — conversation state just stays session-only.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function totalUnread(conversations) {
  return conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
}

export const MESSAGES_UPDATED_EVENT = EVENT;
