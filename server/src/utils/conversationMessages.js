// Shared between messages.routes.js (buyer) and seller.routes.js (seller) — both sides read/
// write the same Conversation.messages array (see models/Conversation.js), so the WhatsApp-style
// delete semantics live here once instead of drifting between two copies.

// `side` is whichever of 'buyer'/'seller' is asking — always derived from the authenticated
// request (buyerIdFor/req.user.sellerId), never from client input.
export function serializeMessage(m, index, side) {
  // "Delete for me" hides it from just this side's own view — the other party's copy (and the
  // DB record) is untouched, so it simply never appears in this side's response at all.
  if (m.deletedFor?.includes(side)) return null;
  return {
    index,
    from: m.from,
    text: m.deletedForEveryone ? null : m.text,
    deleted: Boolean(m.deletedForEveryone),
    at: m.at,
  };
}

export function serializeMessages(messages, side) {
  return messages.map((m, i) => serializeMessage(m, i, side)).filter(Boolean);
}

// Mutates `conv` in place (caller still needs to conv.save()) and returns null on success, or an
// { status, message } describing why the request was rejected.
export function applyMessageDelete(conv, index, side, scope) {
  const target = Number.isInteger(index) ? conv.messages[index] : null;
  if (!target) return { status: 404, message: 'Message not found.' };
  // Already invisible to this side (either they deleted-for-me it already, or it's a
  // deleted-for-everyone tombstone) — nothing left to do, but not an error either.
  if (target.deletedFor?.includes(side)) return null;

  if (scope === 'everyone') {
    // Only the original sender can tombstone a message for both sides — otherwise anyone in the
    // thread could erase what the other person said.
    if (target.from !== side) return { status: 403, message: 'You can only delete your own messages for everyone.' };
    target.deletedForEveryone = true;
    return null;
  }
  if (scope === 'me') {
    target.deletedFor = [...(target.deletedFor || []), side];
    return null;
  }
  return { status: 400, message: 'scope must be "me" or "everyone".' };
}
