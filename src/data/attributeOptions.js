// Predefined value lists for the seller form's spec attributes (Brand, Warranty, Material…) —
// picked by attribute key, and by category group where the same key means very different real
// values per group (e.g. "Brand" for Mobiles vs. for Health & Beauty). Feeds
// AttributeOptionPicker so a seller usually just searches/taps a popular value instead of typing
// it by hand; anything not in the list can still be typed in and added as a custom value — never
// a dead end. Keep this separate from productCategories.js (attribute *labels*/placeholders) —
// this file is only about the *values* offered for a given attribute.
//
// Deliberately scoped to attributes where a fixed list actually helps (Brand, Warranty,
// Material/Fabric, Care, Skin Type, Age Group, Pet Type, Certification). Attributes that are
// inherently free text per product (Model Number, Dimensions, Compatible Model, Origin, Expiry…)
// keep the plain input — a preset list there would just be noise.

const genericBrands = ['Generic', 'Local', 'Imported', 'Unbranded'];

const brandsByGroup = {
  'Mobiles & Accessories': ['Samsung', 'Apple', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Infinix', 'Tecno', 'Itel', 'Huawei', 'Honor', 'Nokia', 'OnePlus', 'Google', 'Generic'],
  Electronics: ['Samsung', 'LG', 'Haier', 'Dawlance', 'PEL', 'Orient', 'Kenwood', 'TCL', 'Sony', 'Panasonic', 'Changhong Ruba', 'Boss', 'Generic'],
  'Fashion - Clothing': ['Khaadi', 'Gul Ahmed', 'Sapphire', 'Bonanza Satrangi', 'Alkaram Studio', 'Nishat Linen', 'Sana Safinaz', 'Junaid Jamshed', 'Outfitters', 'Generic', 'Local'],
  'Fashion - Footwear': ['Bata', 'Servis', 'Stylo', 'Borjan', 'Nike', 'Adidas', 'Puma', 'Generic', 'Local'],
  'Fashion - Accessories': ['Generic', 'Local', 'Fossil', 'Casio', 'Q&Q', 'Guess', 'Charles & Keith'],
  'Health & Beauty': ['Ponds', 'Olay', "L'Oreal", 'Garnier', 'Sunsilk', 'Dove', 'Fair & Handsome', 'Bioamla', 'Medora', 'Generic', 'Imported'],
  'Baby & Toys': ['Pampers', 'Huggies', "Johnson's", 'Fisher-Price', 'Generic', 'Local'],
  'Sports & Outdoors': ['Nike', 'Adidas', 'Puma', 'Reebok', 'Generic', 'Local'],
  Automotive: ['Honda', 'Toyota', 'Suzuki', 'OEM', 'Generic'],
  'Books & Stationery': ['Generic', 'Local', 'Imported'],
  'Pet Supplies': ['Royal Canin', 'Pedigree', 'Whiskas', 'Friskies', 'Generic', 'Local'],
};

const warrantyPresets = ['No warranty', '7 days', '15 days', '1 month', '3 months', '6 months', '1 year', '2 years', '3 years', '5 years', 'Lifetime'];

const materialsByGroup = {
  'Mobiles & Accessories': ['Silicone', 'TPU', 'Leather', 'Polycarbonate', 'Tempered Glass', 'Metal', 'Fabric'],
  'Fashion - Footwear': ['Leather', 'Canvas', 'Rubber', 'Synthetic', 'Mesh', 'Suede'],
  'Fashion - Accessories': ['Leather', 'Metal', 'Gold-plated', 'Silver-plated', 'Fabric', 'Plastic'],
  'Home & Living': ['Wood', 'Steel', 'Fabric', 'Glass', 'Plastic', 'MDF', 'Rattan', 'Marble'],
  'Baby & Toys': ['Plastic', 'Cotton', 'Wood', 'Silicone', 'Fabric'],
  'Sports & Outdoors': ['Rubber', 'Steel', 'Foam', 'Nylon', 'Polyester', 'Leather'],
  'Books & Stationery': ['Paper', 'Plastic', 'Metal', 'Wood'],
};
const genericMaterials = ['Plastic', 'Cotton', 'Steel', 'Wood', 'Fabric', 'Metal'];

const fabricPresets = ['Lawn', 'Cotton', 'Linen', 'Silk', 'Chiffon', 'Georgette', 'Khaddar', 'Velvet', 'Polyester', 'Denim', 'Wool', 'Net'];
const carePresets = ['Machine wash cold', 'Machine wash warm', 'Hand wash only', 'Dry clean only', 'Do not bleach', 'Iron on low heat', 'Do not tumble dry'];
const skinTypePresets = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal', 'All skin types'];
const ageGroupPresets = ['0-6 months', '6-12 months', '1-3 years', '3-5 years', '5-8 years', '8-12 years', '12+ years', 'All ages'];
const petTypePresets = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'All Pets'];
const certificationPresets = ['ISO 9001', 'ISO 14001', 'CE', 'Halal Certified', 'HACCP', 'GMP', 'FDA Approved', 'SGS Tested'];

// Returns a plain string[] of preset values for a given spec attribute, or null when this
// attribute is better left as free text (no fixed list applies well). `categoryGroup` narrows
// brand/material, which mean different real-world values per group.
export function getAttributeOptionPreset(attrKey, categoryGroup) {
  if (attrKey === 'brand') return brandsByGroup[categoryGroup] || genericBrands;
  if (attrKey === 'warranty') return warrantyPresets;
  if (attrKey === 'material') return materialsByGroup[categoryGroup] || genericMaterials;
  if (attrKey === 'materialGrade') return null;
  if (attrKey === 'fabric') return fabricPresets;
  if (attrKey === 'care') return carePresets;
  if (attrKey === 'skinType') return skinTypePresets;
  if (attrKey === 'ageGroup') return ageGroupPresets;
  if (attrKey === 'petType') return petTypePresets;
  if (attrKey === 'certification') return certificationPresets;
  return null;
}
