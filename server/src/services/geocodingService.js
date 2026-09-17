// Free, no-API-key geocoding via OpenStreetMap's Nominatim — used only as the manual-address
// fallback for buyers who deny/don't have browser geolocation on the Safah Mart page (see
// POST /api/marketplace/geocode). Nominatim's usage policy requires a real User-Agent identifying
// the app and caps free usage at ~1 request/second — the in-memory cache below absorbs repeat
// lookups of the same address within a server's lifetime rather than re-hitting it every time.
import axios from 'axios';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'FalsafahApp/1.0 (contact: support@falsafah.app)';

const cache = new Map();

function normalize(address) {
  return String(address || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Returns { lat, lng } or null if the address couldn't be resolved (bad input, or Nominatim has
// no match) — never throws for a "no result" case, only for a genuine network/config failure.
export async function geocodeAddress(address) {
  const key = normalize(address);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key);

  const { data } = await axios.get(NOMINATIM_URL, {
    params: { format: 'json', q: address, limit: 1 },
    headers: { 'User-Agent': USER_AGENT },
    timeout: 8000,
  });

  const result = Array.isArray(data) && data.length > 0
    ? { lat: Number(data[0].lat), lng: Number(data[0].lon) }
    : null;

  cache.set(key, result);
  return result;
}
