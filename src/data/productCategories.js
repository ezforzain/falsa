// Full category list for the seller product listing form — deliberately separate from the
// homepage `categories` in mockData.js (which drives icon tiles and must stay untouched).
// Each entry's `group` maps into `categoryTemplates` below to drive the form's dynamic
// attributes/variants section.

export const productCategories = [
  // Mobiles & Accessories
  { key: 'mobile-phones', name: 'Mobile Phones', group: 'Mobiles & Accessories', keywords: ['phone', 'smartphone', 'mobile', 'android', 'iphone'] },
  { key: 'mobile-covers', name: 'Mobile Covers & Cases', group: 'Mobiles & Accessories', keywords: ['cover', 'case', 'mobile', 'phone', 'back cover'] },
  { key: 'screen-protectors', name: 'Screen Protectors', group: 'Mobiles & Accessories', keywords: ['screen', 'protector', 'glass', 'tempered', 'mobile'] },
  { key: 'power-banks', name: 'Power Banks', group: 'Mobiles & Accessories', keywords: ['power bank', 'battery', 'charger', 'portable'] },
  { key: 'chargers-cables', name: 'Chargers & Cables', group: 'Mobiles & Accessories', keywords: ['charger', 'cable', 'usb', 'adapter', 'wire'] },
  { key: 'tablets', name: 'Tablets', group: 'Mobiles & Accessories', keywords: ['tablet', 'ipad'] },

  // Electronics
  { key: 'televisions', name: 'Televisions', group: 'Electronics', keywords: ['tv', 'television', 'led', 'smart tv'] },
  { key: 'laptops', name: 'Laptops & Computers', group: 'Electronics', keywords: ['laptop', 'computer', 'pc', 'notebook'] },
  { key: 'cameras', name: 'Cameras & Drones', group: 'Electronics', keywords: ['camera', 'dslr', 'drone', 'photography'] },
  { key: 'audio-headphones', name: 'Audio & Headphones', group: 'Electronics', keywords: ['headphone', 'earbuds', 'speaker', 'audio', 'earphones'] },
  { key: 'large-appliances', name: 'Large Appliances', group: 'Electronics', keywords: ['fridge', 'refrigerator', 'washing machine', 'ac', 'air conditioner'] },
  { key: 'small-kitchen-appliances', name: 'Kitchen Appliances', group: 'Electronics', keywords: ['blender', 'microwave', 'kettle', 'toaster', 'kitchen'] },
  { key: 'electronics-b2b', name: 'Electronics (Wholesale)', group: 'Industrial & Wholesale', keywords: ['electronics', 'components', 'bulk', 'wholesale'] },

  // Fashion
  { key: 'mens-clothing', name: "Men's Clothing", group: 'Fashion - Clothing', keywords: ['men', 'shirt', 'kurta', 'trouser', 'clothing'] },
  { key: 'womens-clothing', name: "Women's Clothing", group: 'Fashion - Clothing', keywords: ['women', 'dress', 'kurti', 'lawn', 'clothing'] },
  { key: 'kids-clothing', name: "Kids' Clothing", group: 'Fashion - Clothing', keywords: ['kids', 'baby', 'children', 'clothing'] },
  { key: 'shoes', name: 'Shoes & Footwear', group: 'Fashion - Footwear', keywords: ['shoes', 'sneakers', 'sandals', 'footwear', 'boots'] },
  { key: 'bags-wallets', name: 'Bags & Wallets', group: 'Fashion - Accessories', keywords: ['bag', 'wallet', 'purse', 'handbag', 'backpack'] },
  { key: 'watches', name: 'Watches', group: 'Fashion - Accessories', keywords: ['watch', 'wristwatch', 'smartwatch'] },
  { key: 'jewelry', name: 'Jewelry & Accessories', group: 'Fashion - Accessories', keywords: ['jewelry', 'necklace', 'earrings', 'bangles', 'ring'] },

  // Health & Beauty
  { key: 'skincare', name: 'Skincare', group: 'Health & Beauty', keywords: ['skincare', 'cream', 'moisturizer', 'serum', 'face wash'] },
  { key: 'makeup', name: 'Makeup', group: 'Health & Beauty', keywords: ['makeup', 'lipstick', 'foundation', 'cosmetics'] },
  { key: 'personal-care', name: 'Personal Care', group: 'Health & Beauty', keywords: ['shampoo', 'soap', 'personal care', 'hygiene'] },
  { key: 'fragrances', name: 'Fragrances', group: 'Health & Beauty', keywords: ['perfume', 'fragrance', 'scent', 'attar'] },

  // Home & Living
  { key: 'furniture', name: 'Furniture', group: 'Home & Living', keywords: ['furniture', 'sofa', 'table', 'chair', 'bed'] },
  { key: 'home-decor', name: 'Home Decor', group: 'Home & Living', keywords: ['decor', 'decoration', 'wall art', 'showpiece'] },
  { key: 'bedding', name: 'Bedding & Linen', group: 'Home & Living', keywords: ['bedsheet', 'bedding', 'linen', 'pillow', 'blanket'] },
  { key: 'kitchenware', name: 'Kitchenware', group: 'Home & Living', keywords: ['kitchenware', 'utensils', 'cookware', 'crockery'] },
  { key: 'lighting', name: 'Lighting', group: 'Home & Living', keywords: ['light', 'lamp', 'bulb', 'lighting'] },

  // Groceries & Food
  { key: 'groceries', name: 'Groceries & Food', group: 'Groceries & Food', keywords: ['grocery', 'food', 'snacks', 'pantry'] },
  { key: 'rice-grains', name: 'Rice & Grains', group: 'Industrial & Wholesale', keywords: ['rice', 'grain', 'wheat', 'basmati', 'wholesale'] },

  // Baby & Toys
  { key: 'baby-care', name: 'Baby Care', group: 'Baby & Toys', keywords: ['baby', 'diaper', 'infant', 'baby care'] },
  { key: 'toys-games', name: 'Toys & Games', group: 'Baby & Toys', keywords: ['toy', 'game', 'kids toy', 'puzzle'] },

  // Sports & Outdoors
  { key: 'sports-goods', name: 'Sports Goods', group: 'Sports & Outdoors', keywords: ['sports', 'gym', 'fitness', 'outdoor', 'exercise'] },

  // Automotive
  { key: 'automotive', name: 'Automotive & Motorbike', group: 'Automotive', keywords: ['car', 'bike', 'automotive', 'motorbike', 'auto parts'] },

  // Books, Stationery & Office
  { key: 'books', name: 'Books', group: 'Books & Stationery', keywords: ['book', 'novel', 'textbook'] },
  { key: 'stationery-office', name: 'Stationery & Office Supplies', group: 'Books & Stationery', keywords: ['stationery', 'office', 'pen', 'notebook', 'supplies'] },

  // Pet Supplies
  { key: 'pet-supplies', name: 'Pet Supplies', group: 'Pet Supplies', keywords: ['pet', 'dog', 'cat', 'pet food', 'pet supplies'] },

  // Industrial & Wholesale (original B2B set)
  { key: 'textiles', name: 'Textiles', group: 'Industrial & Wholesale', keywords: ['fabric', 'textile', 'cloth', 'gsm', 'wholesale'] },
  { key: 'surgical', name: 'Surgical Instruments', group: 'Industrial & Wholesale', keywords: ['surgical', 'medical', 'instrument', 'forceps'] },
  { key: 'leather', name: 'Leather Goods', group: 'Industrial & Wholesale', keywords: ['leather', 'hide', 'goods'] },
  { key: 'packaging', name: 'Packaging', group: 'Industrial & Wholesale', keywords: ['packaging', 'box', 'carton', 'wrap'] },
  { key: 'hardware', name: 'Hardware & Tools', group: 'Industrial & Wholesale', keywords: ['hardware', 'tools', 'nails', 'screws', 'wrench'] },

  { key: 'other', name: 'Other', group: 'Other', keywords: ['other', 'misc', 'miscellaneous'] },
];

export const categoryGroups = [...new Set(productCategories.map((c) => c.group))];

const defaultTemplate = {
  attributes: [
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Generic, Sony, Local' },
    { key: 'material', label: 'Material', placeholder: 'e.g. Plastic, Cotton, Steel' },
  ],
  variantAxes: [{ key: 'color', label: 'Color', placeholder: 'e.g. Red, Blue, Black' }],
};

export const categoryTemplates = {
  'Mobiles & Accessories': {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Samsung, Apple, Generic' },
      { key: 'compatibleModel', label: 'Compatible Model', placeholder: 'e.g. iPhone 14, Galaxy S23' },
      { key: 'material', label: 'Material', placeholder: 'e.g. Silicone, Leather, Polycarbonate' },
      { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 6 months' },
    ],
    variantAxes: [
      { key: 'color', label: 'Color', placeholder: 'e.g. Red, Blue, Black' },
      { key: 'variant', label: 'Model Variant', placeholder: 'e.g. iPhone 14, iPhone 14 Pro' },
    ],
  },
  Electronics: {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Samsung, LG, Generic' },
      { key: 'model', label: 'Model Number', placeholder: 'e.g. WM-2200' },
      { key: 'power', label: 'Power / Voltage', placeholder: 'e.g. 220V, 100W' },
      { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 1 year' },
    ],
    variantAxes: [{ key: 'color', label: 'Color', placeholder: 'e.g. Black, White, Silver' }],
  },
  'Fashion - Clothing': {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Generic, Local' },
      { key: 'fabric', label: 'Fabric / Material', placeholder: 'e.g. Lawn, Cotton, Linen' },
      { key: 'care', label: 'Care Instructions', placeholder: 'e.g. Machine wash cold' },
    ],
    variantAxes: [
      { key: 'color', label: 'Color', placeholder: 'e.g. Red, Blue, Black' },
      { key: 'size', label: 'Size', placeholder: 'e.g. S, M, L, XL' },
    ],
  },
  'Fashion - Footwear': {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Generic, Local' },
      { key: 'material', label: 'Material', placeholder: 'e.g. Leather, Canvas, Rubber' },
    ],
    variantAxes: [
      { key: 'color', label: 'Color', placeholder: 'e.g. Black, White' },
      { key: 'size', label: 'Size', placeholder: 'e.g. 38, 39, 40, 41' },
    ],
  },
  'Fashion - Accessories': {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Generic, Local' },
      { key: 'material', label: 'Material', placeholder: 'e.g. Leather, Metal, Gold-plated' },
    ],
    variantAxes: [{ key: 'color', label: 'Color', placeholder: 'e.g. Gold, Silver, Black' }],
  },
  'Health & Beauty': {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Generic, Local' },
      { key: 'skinType', label: 'Skin / Use Type', placeholder: 'e.g. Oily, Dry, All skin types' },
      { key: 'volume', label: 'Volume / Weight', placeholder: 'e.g. 100ml, 50g' },
      { key: 'expiry', label: 'Expiry / Shelf Life', placeholder: 'e.g. 24 months from mfg' },
    ],
    variantAxes: [{ key: 'shade', label: 'Shade / Variant', placeholder: 'e.g. Fair, Medium, Deep' }],
  },
  'Home & Living': {
    attributes: [
      { key: 'material', label: 'Material', placeholder: 'e.g. Wood, Steel, Fabric' },
      { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 120 x 60 x 75 cm' },
    ],
    variantAxes: [{ key: 'color', label: 'Color', placeholder: 'e.g. Brown, White, Grey' }],
  },
  'Groceries & Food': {
    attributes: [
      { key: 'weight', label: 'Weight / Volume', placeholder: 'e.g. 1kg, 500g, 1L' },
      { key: 'expiry', label: 'Expiry / Shelf Life', placeholder: 'e.g. 12 months' },
      { key: 'origin', label: 'Origin', placeholder: 'e.g. Punjab, Imported' },
    ],
    variantAxes: [],
  },
  'Baby & Toys': {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Generic, Local' },
      { key: 'ageGroup', label: 'Age Group', placeholder: 'e.g. 0-6 months, 3+ years' },
      { key: 'material', label: 'Material', placeholder: 'e.g. Plastic, Cotton' },
    ],
    variantAxes: [{ key: 'color', label: 'Color', placeholder: 'e.g. Red, Blue' }],
  },
  'Sports & Outdoors': {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Generic, Local' },
      { key: 'material', label: 'Material', placeholder: 'e.g. Rubber, Steel' },
    ],
    variantAxes: [{ key: 'size', label: 'Size', placeholder: 'e.g. S, M, L' }],
  },
  Automotive: {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Generic, OEM' },
      { key: 'compatibleModel', label: 'Compatible Model', placeholder: 'e.g. Honda Civic 2018-2022' },
    ],
    variantAxes: [{ key: 'color', label: 'Color', placeholder: 'e.g. Black, Red' }],
  },
  'Books & Stationery': {
    attributes: [
      { key: 'brand', label: 'Brand / Publisher', placeholder: 'e.g. Generic, Local' },
      { key: 'material', label: 'Material', placeholder: 'e.g. Paper, Plastic' },
    ],
    variantAxes: [],
  },
  'Pet Supplies': {
    attributes: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g. Generic, Local' },
      { key: 'petType', label: 'Pet Type', placeholder: 'e.g. Dog, Cat' },
    ],
    variantAxes: [{ key: 'size', label: 'Size', placeholder: 'e.g. Small, Medium, Large' }],
  },
  'Industrial & Wholesale': {
    attributes: [
      { key: 'materialGrade', label: 'Material / Grade', placeholder: 'e.g. 280 GSM, Grade A' },
      { key: 'origin', label: 'Origin', placeholder: 'e.g. Faisalabad, Pakistan' },
      { key: 'certification', label: 'Certification', placeholder: 'e.g. ISO 9001' },
    ],
    variantAxes: [],
  },
  Other: defaultTemplate,
};

export function getCategoryTemplate(categoryName) {
  const entry = productCategories.find((c) => c.name === categoryName);
  if (!entry) return defaultTemplate;
  return categoryTemplates[entry.group] || defaultTemplate;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function suggestCategories(title, limit = 3) {
  const tokens = tokenize(title);
  if (tokens.length === 0) return [];

  const scored = productCategories.map((cat) => {
    const haystack = tokenize(cat.name + ' ' + cat.keywords.join(' '));
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 2;
      else if (haystack.some((h) => h.includes(token) || token.includes(h))) score += 1;
    }
    return { cat, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.cat);
}
