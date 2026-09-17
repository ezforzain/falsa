const EARTH_RADIUS_KM = 6371;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

// Great-circle distance between two lat/lng points, in kilometers.
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Assumed local-delivery speed used to turn distance into travel time — there's no real courier
// ETA API behind Safah Mart yet, this is a documented estimate, not a promise.
const AVG_DELIVERY_SPEED_KMH = 20;
const MINUTES_PER_DAY = 24 * 60;

function parseHHMM(value) {
  const [h, m] = String(value || '00:00').split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

// Returns a human-readable ETA label, or null if the seller's own delivery radius can't reach
// this distance at all — callers must drop the product entirely on null, never show a product as
// Safah Mart eligible when the seller can't realistically deliver it (per the feature's own
// requirement: never promise delivery outside the configured service area).
export function computeDeliveryEta({
  distanceKm,
  deliveryRadiusKm,
  prepTimeMinutes,
  opensAt,
  closesAt,
  sameDayDelivery,
  now = new Date(),
}) {
  if (!Number.isFinite(distanceKm) || distanceKm > deliveryRadiusKm) return null;

  const travelMinutes = (distanceKm / AVG_DELIVERY_SPEED_KMH) * 60;
  const totalMinutes = prepTimeMinutes + travelMinutes;

  const opensAtMin = parseHHMM(opensAt);
  const closesAtMin = parseHHMM(closesAt);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (!sameDayDelivery) return 'Tomorrow';

  const isOpenNow = nowMinutes >= opensAtMin && nowMinutes < closesAtMin;
  if (isOpenNow && nowMinutes + totalMinutes <= closesAtMin) {
    return 'Estimated delivery: Today';
  }

  const notYetOpen = nowMinutes < opensAtMin;
  if (notYetOpen && opensAtMin + totalMinutes <= closesAtMin) {
    return 'Estimated delivery: Today';
  }

  if (totalMinutes <= MINUTES_PER_DAY) return 'Delivery within 24 hours';

  return 'Tomorrow';
}
