import { useState } from 'react';
import { seller } from '../lib/api';

const fieldClass =
  'w-full px-[16px] py-[12px] border border-border rounded-xl text-[14.5px] font-sans bg-surface-muted text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(59,111,224,0.12)] transition-shadow';
const labelClass = 'block text-[13px] font-semibold text-ink-soft mb-2';

function fromStore(safahMart) {
  return {
    lat: safahMart?.lat ?? null,
    lng: safahMart?.lng ?? null,
    deliveryRadiusKm: safahMart?.deliveryRadiusKm ?? 5,
    prepTimeMinutes: safahMart?.prepTimeMinutes ?? 30,
    opensAt: safahMart?.opensAt || '09:00',
    closesAt: safahMart?.closesAt || '21:00',
    sameDayDelivery: safahMart?.sameDayDelivery !== false,
  };
}

// Shop-location + local-delivery config for the Safah Mart marketplace — saves straight to the
// server on its own "Save" button, same pattern as PromoBannerManager/StoreSectionsManager on
// this page, rather than riding along with the page's main "Save changes" button. No map-pin
// picker this round (MVP) — the seller just grants location access once, same GPS flow the buyer
// side uses.
export default function SafahMartSettingsCard({ safahMart, onChange }) {
  const [form, setForm] = useState(fromStore(safahMart));
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your location. Please allow location access and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const { store: updated } = await seller.updateSafahMartSettings(form);
      onChange(updated.safahMart);
      setForm(fromStore(updated.safahMart));
      setSaved(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text -mt-2">
        Set your shop's location and delivery range so nearby buyers can find you on Safah Mart.
        Products won't appear there until this is saved with a real location.
      </p>

      {saveError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{saveError}</p>}
      {locationError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{locationError}</p>}

      <div>
        <label className={labelClass}>Shop location</label>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[13.5px] text-ink-soft">
            {form.lat != null && form.lng != null
              ? `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}`
              : 'Not set yet'}
          </span>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-transparent border border-border hover:border-border-strong text-ink-soft font-semibold text-[12.5px] py-2 px-4 rounded-full transition-colors"
          >
            {locating ? 'Locating…' : 'Use my current shop location'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Delivery radius (km)</label>
          <input
            type="number"
            min="1"
            value={form.deliveryRadiusKm}
            onChange={(e) => setForm((f) => ({ ...f, deliveryRadiusKm: Number(e.target.value) }))}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Prep time (minutes)</label>
          <input
            type="number"
            min="0"
            value={form.prepTimeMinutes}
            onChange={(e) => setForm((f) => ({ ...f, prepTimeMinutes: Number(e.target.value) }))}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Opens at</label>
          <input type="time" value={form.opensAt} onChange={(e) => setForm((f) => ({ ...f, opensAt: e.target.value }))} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Closes at</label>
          <input type="time" value={form.closesAt} onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))} className={fieldClass} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink cursor-pointer">
        <input
          type="checkbox"
          checked={form.sameDayDelivery}
          onChange={() => setForm((f) => ({ ...f, sameDayDelivery: !f.sameDayDelivery }))}
          className="w-4 h-4 accent-green cursor-pointer"
        />
        Same-day delivery available
      </label>

      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-2.5 px-6 rounded-full transition-colors"
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save Safah Mart settings'}
        </button>
      </div>
    </div>
  );
}
