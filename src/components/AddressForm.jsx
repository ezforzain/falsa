import { useState } from 'react';
import LocationDropdown from './LocationDropdown';
import { IconHome, IconStore } from './icons';

export const EMPTY_ADDRESS = { fullName: '', phone: '', city: '', address: '', label: 'Home' };

const fieldClass =
  'w-full px-[16px] py-[12px] border border-border rounded-xl text-[14.5px] font-sans bg-white text-ink outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)] transition-shadow';
const labelClass = 'block text-[13px] font-semibold text-ink-soft mb-2';

// Delivery-address form for checkout (see CartPage) — full name, phone, city (existing
// LocationDropdown, PK city list), full address, and a Home/Office label, matching the
// Daraz-style set the buyer settled on. Purely controlled — the caller owns submit/cancel and
// whatever persistence happens (checkout auto-saves it to the account).
export default function AddressForm({ value, onChange, onSubmit, onCancel, submitLabel = 'Save & Continue', loading = false, error = null }) {
  const [touched, setTouched] = useState(false);
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

  const missing = ['fullName', 'phone', 'city', 'address'].filter((k) => !String(value[k] || '').trim());

  const handleSubmit = () => {
    setTouched(true);
    if (missing.length > 0) return;
    onSubmit();
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{error}</p>}

      <div>
        <label className={labelClass}>Full name</label>
        <input
          type="text"
          value={value.fullName}
          onChange={set('fullName')}
          placeholder="Who should the courier ask for?"
          className={fieldClass}
        />
        {touched && !value.fullName.trim() && <p className="text-xs text-orange-text mt-1.5">Full name is required.</p>}
      </div>

      <div>
        <label className={labelClass}>Phone number</label>
        <input
          type="text"
          value={value.phone}
          onChange={set('phone')}
          placeholder="+92 300 0000000"
          className={fieldClass}
        />
        {touched && !value.phone.trim() && <p className="text-xs text-orange-text mt-1.5">Phone number is required.</p>}
      </div>

      <LocationDropdown
        label="City"
        required
        value={value.city}
        onChange={(city) => onChange({ ...value, city })}
        error={touched && !value.city.trim() ? 'City is required.' : null}
      />

      <div>
        <label className={labelClass}>Full address</label>
        <textarea
          value={value.address}
          onChange={set('address')}
          rows={3}
          placeholder="House / street / area, landmark"
          className={`${fieldClass} resize-none`}
        />
        {touched && !value.address.trim() && <p className="text-xs text-orange-text mt-1.5">Address is required.</p>}
      </div>

      <div>
        <label className={labelClass}>Save as</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'Home', Icon: IconHome },
            { value: 'Office', Icon: IconStore },
          ].map(({ value: opt, Icon }) => (
            <label
              key={opt}
              className={`flex items-center gap-2.5 px-4 py-3 border-[1.5px] rounded-xl cursor-pointer transition-colors ${
                value.label === opt ? 'border-orange bg-orange-tint' : 'border-border hover:border-border-strong'
              }`}
            >
              <input
                type="radio"
                name="address_label"
                value={opt}
                checked={value.label === opt}
                onChange={() => onChange({ ...value, label: opt })}
                className="accent-orange w-4 h-4"
              />
              <Icon width="15" height="15" className={value.label === opt ? 'text-orange-text' : 'text-ink-soft'} />
              <span className={`text-[14px] font-semibold ${value.label === opt ? 'text-orange-text' : 'text-ink-soft'}`}>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5 mt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-white border border-border text-ink-soft font-semibold text-sm px-5 py-3 rounded-full hover:bg-surface-muted transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 bg-orange hover:bg-orange-hover text-white font-semibold text-[15px] py-3 rounded-full shadow-[0_8px_20px_rgba(201,123,45,0.3)] transition-all"
        >
          {loading && (
            <span className="w-4 h-4 border-[2.5px] border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
          )}
          {loading ? 'Placing order…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
