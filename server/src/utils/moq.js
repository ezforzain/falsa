// MOQ (Minimum Order Quantity) is stored as a free-form string like "200pc", "500m", or "50bag"
// — this pulls out just the leading number so the cart routes can reject additions below it.
// Returns null when the string has no parseable number (rather than 0/NaN) so callers can fall
// back to "no minimum" instead of accidentally blocking every order.
export function parseMoqNumber(moq) {
  if (typeof moq === 'number') return moq > 0 ? moq : null;
  if (typeof moq !== 'string') return null;
  const match = moq.match(/\d+/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}
