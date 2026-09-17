import { useCallback, useEffect, useState } from 'react';
import { marketplace } from '../lib/api';

const SESSION_KEY = 'falsafahtot_safah_mart_location';

function readCached() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCached(coords) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(coords));
  } catch {
    // Storage unavailable (private browsing etc.) — just re-resolves next visit this tab.
  }
}

// Resolves the buyer's coordinates for Safah Mart: browser GPS first, with a manual-address
// fallback (geocoded server-side, see POST /api/marketplace/geocode) for anyone who denies or
// lacks geolocation. Resolved coordinates are cached for the tab session only — never written to
// the buyer's saved account address unless they explicitly opt in (see saveAsMyAddress below).
export default function useSafahMartLocation() {
  const [status, setStatus] = useState('idle'); // idle | requesting | granted | denied
  const [coords, setCoords] = useState(null);
  const [manualError, setManualError] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    const cached = readCached();
    if (cached) {
      setCoords(cached);
      setStatus('granted');
      return;
    }
    if (!navigator.geolocation) {
      setStatus('denied');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        writeCached(next);
        setCoords(next);
        setStatus('granted');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const geocodeManualAddress = useCallback(async (address) => {
    setManualError(null);
    setManualLoading(true);
    try {
      const result = await marketplace.geocode(address);
      writeCached(result);
      setCoords(result);
      setStatus('granted');
      return true;
    } catch (err) {
      setManualError(err.message || 'Could not locate that address.');
      return false;
    } finally {
      setManualLoading(false);
    }
  }, []);

  return { status, coords, geocodeManualAddress, manualError, manualLoading };
}
