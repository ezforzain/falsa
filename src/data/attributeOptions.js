// Predefined option lists for the seller form's category-detail *attributes* (Brand, Material,
// Warranty…) — as opposed to variantOptions.js, which covers axes that generate variant rows
// (Color, Size, Shade). These feed the single-select AttributeOptionPicker, keyed by the
// specific leaf category first (e.g. "Mobile Phones") and falling back to the broader category
// group, so a seller searching Brand for phones doesn't see charger/case brands and vice versa.
import { productCategories } from './productCategories';

export const warrantyOptions = [
  'No Warranty',
  '7 Days',
  '15 Days',
  '30 Days',
  '3 Months',
  '6 Months',
  '1 Year',
  '2 Years',
  'Manufacturer Warranty',
];

const brandsByCategory = {
  'mobile-phones': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Infinix', 'Tecno', 'Nokia', 'Huawei'],
  tablets: ['Apple', 'Samsung', 'Lenovo', 'Huawei', 'Xiaomi', 'Amazon'],
  'power-banks': ['Anker', 'Xiaomi', 'Baseus', 'Samsung', 'Romoss', 'Oraimo'],
  'chargers-cables': ['Anker', 'Baseus', 'Belkin', 'Samsung', 'Xiaomi', 'Ugreen'],
  'mobile-covers': ['Spigen', 'Nillkin', 'Baseus', 'Generic'],
  'screen-protectors': ['Nillkin', 'Spigen', 'Baseus', 'Generic'],
  laptops: ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Microsoft'],
  televisions: ['Samsung', 'LG', 'Sony', 'TCL', 'Haier', 'Ecostar', 'Orient'],
  'audio-headphones': ['Sony', 'JBL', 'Bose', 'Apple', 'Samsung', 'Anker', 'boAt', 'QCY'],
  cameras: ['Canon', 'Nikon', 'Sony', 'GoPro', 'DJI', 'Fujifilm'],
  'large-appliances': ['Dawlance', 'Haier', 'LG', 'Samsung', 'Orient', 'PEL', 'Kenwood'],
  'small-kitchen-appliances': ['Philips', 'Panasonic', 'Anex', 'National', 'Westpoint', 'Kenwood'],
  shoes: ['Nike', 'Adidas', 'Puma', 'Bata', 'Servis', 'Skechers', 'New Balance'],
  'mens-clothing': ['Gul Ahmed', 'Khaadi', 'Bonanza', 'J.', 'Outfitters', 'Diners'],
  'womens-clothing': ['Khaadi', 'Gul Ahmed', 'Sapphire', 'Alkaram', 'Sana Safinaz', 'Bonanza Satrangi'],
  'kids-clothing': ['Gul Ahmed', 'OshKosh', 'Toyo', 'Generic'],
  'bags-wallets': ['Levi’s', 'Charles & Keith', 'Bonia', 'Generic'],
  watches: ['Casio', 'Fossil', 'Rolex', 'Q&Q', 'Titan', 'Seiko'],
  skincare: ['CeraVe', 'The Ordinary', 'Ponds', 'Olay', 'Nivea', 'Garnier'],
  makeup: ['Maybelline', 'L’Oréal', 'MAC', 'NYX', 'Sweet Touch', 'Medora'],
  'personal-care': ['Dove', 'Lux', 'Sunsilk', 'Head & Shoulders', 'Lifebuoy'],
  fragrances: ['J.', 'Junaid Jamshed', 'Al-Rehab', 'Bvlgari', 'Dior'],
  furniture: ['Interwood', 'Habitt', 'ChenOne', 'Generic'],
  bedding: ['ChenOne', 'Bonhomie', 'Generic'],
  kitchenware: ['Prestige', 'National', 'Sonex', 'Generic'],
  lighting: ['Philips', 'Osram', 'Ecostar', 'Generic'],
  automotive: ['Honda', 'Toyota', 'Suzuki', 'Yamaha', 'Generic / Aftermarket'],
  'toys-games': ['Fisher-Price', 'LEGO', 'Hot Wheels', 'Generic'],
  'baby-care': ['Pampers', 'Johnson’s', 'Huggies', 'Generic'],
  'sports-goods': ['Nike', 'Adidas', 'Decathlon', 'Generic'],
  'pet-supplies': ['Pedigree', 'Whiskas', 'Royal Canin', 'Generic'],
};

const brandsByGroup = {
  'Fashion - Accessories': ['Generic', 'Local Artisan', 'Metal', 'Leather'],
  'Home & Living': ['Interwood', 'Habitt', 'ChenOne', 'Generic'],
  'Baby & Toys': ['Fisher-Price', 'LEGO', 'Generic'],
  'Sports & Outdoors': ['Nike', 'Adidas', 'Decathlon', 'Generic'],
};

const defaultBrands = ['Generic', 'Local Brand', 'Imported'];

export function getBrandOptions(categoryName) {
  const entry = productCategories.find((c) => c.name === categoryName);
  if (!entry) return defaultBrands;
  return brandsByCategory[entry.key] || brandsByGroup[entry.group] || defaultBrands;
}

const materialsByGroup = {
  'Fashion - Clothing': ['Cotton', 'Lawn', 'Linen', 'Silk', 'Chiffon', 'Georgette', 'Denim', 'Polyester', 'Wool', 'Velvet'],
  'Fashion - Footwear': ['Leather', 'Synthetic Leather', 'Canvas', 'Rubber', 'Suede', 'Mesh'],
  'Fashion - Accessories': ['Leather', 'Metal', 'Gold-plated', 'Silver', 'Fabric', 'Plastic'],
  'Home & Living': ['Wood', 'Engineered Wood (MDF)', 'Steel', 'Iron', 'Glass', 'Fabric / Upholstered', 'Plastic', 'Marble'],
  Electronics: ['Plastic', 'Metal', 'Aluminum', 'Glass', 'Composite'],
  'Mobiles & Accessories': ['Silicone', 'Leather', 'Polycarbonate', 'TPU', 'Tempered Glass', 'Metal'],
  'Sports & Outdoors': ['Rubber', 'Steel', 'Foam', 'Nylon'],
  'Baby & Toys': ['Plastic', 'Cotton', 'Wood', 'Silicone'],
};

const defaultMaterials = ['Plastic', 'Metal', 'Wood', 'Cotton', 'Other'];

export function getMaterialOptions(categoryGroup) {
  return materialsByGroup[categoryGroup] || defaultMaterials;
}

// Single dispatcher the form calls for every 'picker'-type attribute — keeps ProductFormModal
// from needing to know which preset list belongs to which attribute key.
export function getAttributePreset(attrKey, categoryName, categoryGroup) {
  if (attrKey === 'brand') return { type: 'text', options: getBrandOptions(categoryName) };
  if (attrKey === 'warranty') return { type: 'text', options: warrantyOptions };
  if (attrKey === 'material' || attrKey === 'fabric') return { type: 'text', options: getMaterialOptions(categoryGroup) };
  return null;
}
