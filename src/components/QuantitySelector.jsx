// Reusable minus/value/plus stepper. Touch-friendly 44px hit targets, clamps to [min, max],
// and disables the minus button once `qty` hits `min` (per spec: disabled at 1 by default).
export default function QuantitySelector({ qty, onChange, min = 1, max = Infinity }) {
  const decrease = () => {
    if (qty <= min) return;
    onChange(Math.max(qty - 1, min));
  };

  const increase = () => {
    if (qty >= max) return;
    onChange(Math.min(qty + 1, max));
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={decrease}
        disabled={qty <= min}
        aria-label="Decrease quantity"
        className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-lg font-semibold text-ink cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 hover:bg-surface-muted active:scale-95 transition-all shrink-0"
      >
        −
      </button>
      <span className="min-w-[28px] text-center font-display font-bold text-base text-ink tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={increase}
        disabled={qty >= max}
        aria-label="Increase quantity"
        className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-lg font-semibold text-ink cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 hover:bg-surface-muted active:scale-95 transition-all shrink-0"
      >
        +
      </button>
    </div>
  );
}
