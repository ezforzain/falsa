// Resolves the buyer's country for the marketplace tabs' country-aware ranking (Spotlight,
// Worldwide) and shipping-eligibility checks (Free Shipping). Priority: the signed-in user's
// saved account country, else a fixed home-market fallback — the app has no other country/
// location system today (guests aren't geolocated), and the fallback is a deliberate, disclosed
// choice rather than invented location tracking.
const FALLBACK_COUNTRY = 'Pakistan';

export function getBuyerCountry(user) {
  return user?.country || FALLBACK_COUNTRY;
}
