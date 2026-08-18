// Small shared on/off control for Settings-style rows (notification toggles, reduce motion) —
// a plain checkbox styled as a pill so it reads consistently with the rest of the settings UI
// and stays keyboard/screen-reader accessible for free (real <input type="checkbox">).
export default function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative shrink-0 w-[44px] h-[26px] rounded-full transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green ${
        checked ? 'bg-green' : 'bg-border-strong'
      }`}
    >
      <span
        className="absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  );
}
