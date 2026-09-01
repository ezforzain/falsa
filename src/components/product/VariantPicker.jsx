import VariantCard from '../VariantCard';

// Daraz-style inline variant/pack picker, shown directly on the product page (not hidden behind
// a tap) — reuses the same VariantCard used inside VariantBottomSheet so the selected option
// looks identical whether it's picked here or in the sheet, and the two stay in sync (see
// ProductPage's selectedVariant state, passed to both).
export default function VariantPicker({ variants, selected, onSelect }) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="text-[13px] font-semibold text-ink-soft mb-2.5">
        Options: <span className="text-ink font-bold">{selected?.name}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {variants.map((variant) => (
          <VariantCard key={variant.id} variant={variant} selected={selected?.id === variant.id} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
