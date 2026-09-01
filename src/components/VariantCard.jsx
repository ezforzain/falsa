import { IconCheck } from './icons';

// A single selectable option in a variant/options grid — image + name, with a distinct
// selected state (orange border, light orange fill, checkmark badge). Truncates long names to
// two lines instead of overflowing the card.
export default function VariantCard({ variant, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(variant)}
      aria-pressed={selected}
      className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-center cursor-pointer transition-colors duration-150 ${
        selected ? 'border-orange bg-orange-tint' : 'border-border bg-white hover:border-border-strong'
      }`}
    >
      {selected && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange flex items-center justify-center shadow-sm">
          <IconCheck width="11" height="11" strokeWidth="3" className="text-white" />
        </span>
      )}
      <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-surface-muted shrink-0">
        <img src={variant.img} alt={variant.name} className="w-full h-full object-cover" />
      </span>
      <span
        className={`text-[11.5px] font-medium leading-tight line-clamp-2 break-words ${
          selected ? 'text-orange-text' : 'text-ink-soft'
        }`}
      >
        {variant.name}
      </span>
    </button>
  );
}
