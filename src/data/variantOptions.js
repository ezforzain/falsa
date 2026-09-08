// Predefined option lists for the seller form's variant axes (Color, Size, Shade…) — picked by
// axis key (+ category group for "Size", which means different things per group). Feeds
// VariantOptionPicker so a seller usually just searches/taps instead of typing "Red, Blue, Black"
// by hand; anything not in the list can still be typed in and added as a custom option.
// Keep this separate from productCategories.js (attributes/axis *labels*) — this file is only
// about the *values* offered for a given axis.

export const colorPresets = [
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#9CA3AF' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#FACC15' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Olive', hex: '#556B2F' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Sky Blue', hex: '#38BDF8' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Beige', hex: '#E8DCC8' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Multicolor', hex: null },
];

const shadePresets = ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Ivory', 'Natural', 'Porcelain'];
const clothingSizePresets = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];
const footwearSizePresets = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const genericSizePresets = ['Small', 'Medium', 'Large', 'Extra Large'];

// { type: 'color' } options carry {name, hex} so the picker can render a swatch dot.
// { type: 'text' } options are plain strings. Returning null means "no curated list" — the
// caller falls back to the original free-text input (e.g. Model Variant, which is really open
// device-model text, not something a fixed list helps with).
export function getVariantOptionPreset(axisKey, categoryGroup) {
  if (axisKey === 'color') return { type: 'color', options: colorPresets };
  if (axisKey === 'shade') return { type: 'text', options: shadePresets };
  if (axisKey === 'size') {
    if (categoryGroup === 'Fashion - Clothing') return { type: 'text', options: clothingSizePresets };
    if (categoryGroup === 'Fashion - Footwear') return { type: 'text', options: footwearSizePresets };
    return { type: 'text', options: genericSizePresets };
  }
  return null;
}
