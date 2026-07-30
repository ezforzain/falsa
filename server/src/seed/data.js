// Seed data ported from the frontend's src/data/mockData.js, so the real backend starts out
// showing the same catalog the mock API did.

export const unsplash = (id, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const categories = [
  {
    key: 'textiles',
    name: 'Textiles',
    icon: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
    img: unsplash('photo-1523381210434-271e8be1f52b', 200),
  },
  {
    key: 'surgical',
    name: 'Surgical Instruments',
    icon: 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2',
    img: unsplash('photo-1583911860205-72f8ac8ddcbe', 200),
  },
  {
    key: 'leather',
    name: 'Leather Goods',
    icon: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42zM7.5 7.5h.01',
    img: unsplash('photo-1473188588951-666fce8e7c68', 200),
  },
  {
    key: 'sports',
    name: 'Sports Goods',
    icon: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
    img: unsplash('photo-1575361204480-aadea25e6e68', 200),
  },
  {
    key: 'rice',
    name: 'Rice & Grains',
    icon: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
    img: unsplash('photo-1586201375761-83865001e31c', 200),
  },
  {
    key: 'electronics',
    name: 'Electronics',
    icon: 'M6 6h12v12H6zM10 10h4v4h-4zM9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2',
    img: unsplash('photo-1504148455328-c376907d081c', 200),
  },
  {
    key: 'packaging',
    name: 'Packaging',
    icon: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7l8.7 5 8.7-5M12 22V12',
    img: unsplash('photo-1553413077-190dd305871c', 200),
  },
  {
    key: 'hardware',
    name: 'Hardware & Tools',
    icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    img: unsplash('photo-1607166452427-7e4477079cb9', 200),
  },
];

export const mobileCategories = [
  { key: 'textiles', name: 'Textiles', fullName: 'Textiles & Fabrics', img: unsplash('photo-1523381210434-271e8be1f52b', 200) },
  { key: 'surgical', name: 'Surgical', fullName: 'Surgical Instruments', img: unsplash('photo-1583911860205-72f8ac8ddcbe', 200) },
  { key: 'leather', name: 'Leather', fullName: 'Leather Goods', img: unsplash('photo-1473188588951-666fce8e7c68', 200) },
  { key: 'sports', name: 'Sports', fullName: 'Sports Goods', img: unsplash('photo-1575361204480-aadea25e6e68', 200) },
  { key: 'rice', name: 'Rice & Grains', fullName: 'Rice & Grains', img: unsplash('photo-1586201375761-83865001e31c', 200) },
  { key: 'hardware', name: 'Hardware', fullName: 'Hardware & Tools', img: unsplash('photo-1504148455328-c376907d081c', 200) },
];

export const mobileTabs = [
  { key: 'aimode', label: 'B2B', banner: 'B2B: describe what you need in plain words and we’ll match suppliers for you.' },
  { key: 'spotlight', label: 'Spotlight', banner: null },
  { key: 'worldwide', label: 'Worldwide', banner: 'Worldwide: browsing verified sellers across all 190+ countries.' },
  { key: 'freeshipping', label: 'Free Shipping', banner: 'Free Shipping: showing products eligible for free shipping on your first order.' },
];

// Per-product detail content for the Product Detail page — description, spec sheet, and a
// handful of seeded reviews. Keyed by product id and merged onto the base product records
// below, so the two stay easy to scan independently (identity/pricing vs. long-form content).
const PRODUCT_DETAILS = {
  'cotton-twill-fabric': {
    description:
      'Heavyweight 280 GSM cotton twill woven for workwear, uniforms, and heavy-use apparel. ' +
      'Sanforized and pre-shrunk for dimensional stability after washing, with a tight diagonal ' +
      'weave that resists abrasion and holds a crisp finish through repeated industrial laundering. ' +
      'Supplied in bulk rolls with consistent dye lots across the full order — critical for buyers ' +
      'running large cut-and-sew production runs where shade matching across rolls matters.',
    specifications: [
      { label: 'Material', value: '100% cotton twill' },
      { label: 'Weight', value: '280 GSM' },
      { label: 'Width', value: '58 in / 147 cm' },
      { label: 'Weave', value: '2/1 twill' },
      { label: 'Shrinkage', value: 'Under 3% (sanforized)' },
      { label: 'Color options', value: '4 (see variants)' },
      { label: 'Packaging', value: 'Rolled, poly-wrapped, 50m per roll' },
      { label: 'Origin', value: 'Faisalabad, Pakistan' },
    ],
    reviews: [
      { author: 'Gulistan Sourcing Co.', rating: 5, comment: 'Consistent GSM across every roll in a 2,200m order — exactly what we needed for a uniform contract. Reordering.', daysAgo: 12, images: [unsplash('photo-1523381210434-271e8be1f52b', 300), unsplash('photo-1620799140408-edc6dcb6d633', 300)] },
      { author: 'Redwood Imports LLC', rating: 5, comment: 'Color held up after 40+ industrial washes in our testing. Sanforizing claim checks out.', daysAgo: 28 },
      { author: 'Nordic Trade House', rating: 4, comment: 'Good quality twill, lead time ran about 3 days over the quoted window during peak season.', daysAgo: 45, verifiedPurchase: false },
    ],
  },
  'surgical-instrument-set': {
    description:
      'Precision-forged stainless steel surgical instrument set covering the core tools needed for ' +
      'general procedures — scissors, forceps, needle holders, and scalpel handles finished to a ' +
      'mirror or satin grade depending on tool. Manufactured in Sialkot’s surgical cluster and ' +
      'validated for repeated autoclave sterilization without pitting or joint stiffness, with each ' +
      'set batch-tested for hinge tension before packing.',
    specifications: [
      { label: 'Material', value: 'German-grade stainless steel (DIN 58298)' },
      { label: 'Finish', value: 'Mirror / satin (tool-dependent)' },
      { label: 'Sterilization', value: 'Autoclave safe, up to 134°C' },
      { label: 'Set contents', value: '32 pieces per set' },
      { label: 'Certification', value: 'CE marked, ISO 13485 facility' },
      { label: 'Packaging', value: 'Instrument tray + sterilization pouch' },
      { label: 'Origin', value: 'Sialkot, Pakistan' },
    ],
    reviews: [
      { author: 'Meridian Health Supply', rating: 5, comment: 'Hinge tension is even across the whole set — no loose scissors like we’ve had from other suppliers.', daysAgo: 9, images: [unsplash('photo-1583911860205-72f8ac8ddcbe', 300)] },
      { author: 'Al-Karam Traders', rating: 5, comment: 'Passed our sterilization validation on the first batch. Documentation was thorough.', daysAgo: 33 },
      { author: 'Redwood Imports LLC', rating: 5, comment: 'Top-rated for a reason. Consistent finish quality across a 100-set order.', daysAgo: 51 },
    ],
  },
  'leather-work-gloves': {
    description:
      'Full-grain leather work gloves built for warehouse, construction, and light industrial handling. ' +
      'The palm and reinforced fingers are cut from single-hide sections rather than split leather, so ' +
      'they break in without delaminating, and the double-stitched seams hold up under repeated flexing. ' +
      'A reinforced thumb crotch and elastic wrist keep debris out during long shifts.',
    specifications: [
      { label: 'Material', value: 'Full-grain cowhide leather' },
      { label: 'Lining', value: 'Unlined (breathable)' },
      { label: 'Cuff', value: 'Elastic knit wrist' },
      { label: 'Sizes available', value: 'S / M / L / XL' },
      { label: 'Stitching', value: 'Double-stitched palm and seams' },
      { label: 'Packaging', value: '12 pairs per polybag, 25 bags per carton' },
      { label: 'Origin', value: 'Karachi, Pakistan' },
    ],
    reviews: [
      { author: 'Nordic Trade House', rating: 5, comment: 'Held up through a full quarter on our warehouse floor before the first pair needed replacing.', daysAgo: 15 },
      { author: 'Gulistan Sourcing Co.', rating: 4, comment: 'Good full-grain quality, sizing runs slightly large versus our usual supplier.', daysAgo: 40 },
      { author: 'Meridian Health Supply', rating: 5, comment: 'Stitching hasn’t come loose on a single pair from a 300-pair order. Reliable verified seller.', daysAgo: 60 },
    ],
  },
  'match-grade-footballs': {
    description:
      'Hand-stitched, match-grade footballs built to FIFA Quality Pro size and weight tolerances. ' +
      'The 32-panel PU casing is thermally bonded at the seams for water resistance and shape retention ' +
      'over a full match, with a butyl bladder that holds air pressure significantly longer than latex ' +
      'alternatives — a common pain point buyers flag with cheaper imports.',
    specifications: [
      { label: 'Size', value: '5 (official match size)' },
      { label: 'Casing', value: '32-panel PU, hand-stitched' },
      { label: 'Bladder', value: 'Butyl (extended air retention)' },
      { label: 'Weight', value: '410–450g' },
      { label: 'Water absorption', value: 'Under 10% (FIFA Quality Pro)' },
      { label: 'Packaging', value: 'Individually boxed, 24 per carton' },
      { label: 'Origin', value: 'Sialkot, Pakistan' },
    ],
    reviews: [
      { author: 'Redwood Imports LLC', rating: 5, comment: 'Air retention is noticeably better than the latex-bladder balls we used before. Shape holds after months of use.', daysAgo: 7 },
      { author: 'Al-Karam Traders', rating: 4, comment: 'Great stitching quality. A couple of units in the first carton had minor panel misalignment.', daysAgo: 22 },
      { author: 'Nordic Trade House', rating: 5, comment: 'Our club-level buyers confirmed these meet match-grade feel. Reordering for next season.', daysAgo: 38 },
    ],
  },
  'corrugated-shipping-boxes': {
    description:
      'Double-wall corrugated shipping boxes built for e-commerce and freight handling, with a ' +
      'burst strength rated for stacked pallet storage. The flute profile is tuned for cushioning ' +
      'without adding unnecessary bulk, and boxes ship flat-packed to keep freight costs down on ' +
      'large orders — assembly takes seconds with the pre-scored fold lines.',
    specifications: [
      { label: 'Construction', value: 'Double-wall corrugated (BC flute)' },
      { label: 'Burst strength', value: '275 psi (Mullen test)' },
      { label: 'Standard size', value: '12 x 12 x 12 in (custom sizes available)' },
      { label: 'Load rating', value: 'Up to 65 kg stacked' },
      { label: 'Print', value: 'Plain kraft or custom 1-color print' },
      { label: 'Packaging', value: 'Flat-packed, 25 per bundle' },
      { label: 'Origin', value: 'Lahore, Pakistan' },
    ],
    reviews: [
      { author: 'Gulistan Sourcing Co.', rating: 5, comment: 'No crushed boxes on arrival even after a long-haul freight leg. Good burst strength for the price.', daysAgo: 11 },
      { author: 'Meridian Health Supply', rating: 4, comment: 'Solid boxes, custom print took a bit longer than the standard lead time quoted.', daysAgo: 26 },
      { author: 'Al-Karam Traders', rating: 5, comment: 'Verified seller, consistent quality across a 5,000-unit reorder.', daysAgo: 50 },
    ],
  },
  'hand-tools-hardware-set': {
    description:
      'A general-purpose hand tool and hardware set covering wrenches, pliers, screwdrivers, and ' +
      'a socket assortment, forged from chrome vanadium steel for everyday industrial and maintenance ' +
      'use. Each tool is drop-forged rather than cast, so the working ends resist rounding and cracking ' +
      'under sustained torque, and the whole set ships in a reusable blow-molded case.',
    specifications: [
      { label: 'Material', value: 'Chrome vanadium steel, drop-forged' },
      { label: 'Set contents', value: '150 pieces' },
      { label: 'Finish', value: 'Chrome-plated, corrosion resistant' },
      { label: 'Case', value: 'Blow-molded, reusable' },
      { label: 'Warranty', value: 'Manufacturer defect coverage, 12 months' },
      { label: 'Packaging', value: '1 set per case, 20 cases per carton' },
      { label: 'Origin', value: 'Gujranwala, Pakistan' },
    ],
    reviews: [
      { author: 'Nordic Trade House', rating: 4, comment: 'Good value set for the price point. A couple of sockets had visible tool marks from finishing.', daysAgo: 18 },
      { author: 'Redwood Imports LLC', rating: 5, comment: 'Chrome vanadium claim checks out — no rounding on the hex bits after months of shop use.', daysAgo: 42 },
      { author: 'Gulistan Sourcing Co.', rating: 5, comment: 'Reliable supplier, case latches survived freight without cracking.', daysAgo: 65 },
    ],
  },
  'basmati-rice-25kg': {
    description:
      'Aged extra-long-grain basmati rice, sourced and milled in Sheikhupura and packed in 25kg bags ' +
      'for wholesale and food-service buyers. Aged a minimum of 12 months before milling to develop ' +
      'the characteristic aroma and reduce breakage on cooking, with each lot tested for moisture ' +
      'content before packing to protect against spoilage in transit.',
    specifications: [
      { label: 'Grain type', value: 'Extra-long-grain basmati' },
      { label: 'Aging', value: 'Minimum 12 months' },
      { label: 'Moisture content', value: 'Under 14%' },
      { label: 'Broken grains', value: 'Under 5%' },
      { label: 'Bag size', value: '25 kg, PP woven with liner' },
      { label: 'Shelf life', value: '24 months from packing' },
      { label: 'Origin', value: 'Sheikhupura, Pakistan' },
    ],
    reviews: [
      { author: 'Meridian Health Supply', rating: 5, comment: 'Aroma and grain length are noticeably better than the last supplier we used. Low breakage on cooking.', daysAgo: 14 },
      { author: 'Al-Karam Traders', rating: 4, comment: 'Good consistent quality lot to lot. Moisture content matched the spec sheet on independent testing.', daysAgo: 29 },
      { author: 'Nordic Trade House', rating: 5, comment: 'Trending for a reason — reordered twice this quarter for our food-service accounts.', daysAgo: 47 },
    ],
  },
  'denim-fabric-rolls': {
    description:
      'Mid-weight denim fabric rolls suitable for jeans, jackets, and workwear cut-and-sew production. ' +
      'Ring-spun yarn gives the fabric a soft hand-feel while keeping tensile strength high for garment ' +
      'durability, and the indigo dye is rope-dyed rather than slasher-dyed for the classic fading ' +
      'pattern buyers expect from premium denim goods.',
    specifications: [
      { label: 'Material', value: '98% cotton, 2% elastane' },
      { label: 'Weight', value: '12 oz' },
      { label: 'Width', value: '60 in / 152 cm' },
      { label: 'Dye process', value: 'Rope-dyed indigo' },
      { label: 'Stretch', value: '2-way stretch' },
      { label: 'Packaging', value: 'Rolled, poly-wrapped, 40m per roll' },
      { label: 'Origin', value: 'Faisalabad, Pakistan' },
    ],
    reviews: [
      { author: 'Redwood Imports LLC', rating: 5, comment: 'Rope-dyed indigo fades beautifully in wash testing — matches premium denim we’ve sourced elsewhere for more.', daysAgo: 20 },
      { author: 'Gulistan Sourcing Co.', rating: 4, comment: 'Good hand-feel and stretch recovery. One roll in our last order ran slightly under width spec.', daysAgo: 35 },
      { author: 'Meridian Health Supply', rating: 5, comment: 'Trending fabric for our line right now — quality matches the samples exactly.', daysAgo: 58 },
    ],
  },
  'warehouse-racking-systems': {
    description:
      'Heavy-duty adjustable pallet racking engineered for warehouse and distribution center storage, ' +
      'rated for both hand-loaded shelving and forklift pallet loads depending on beam configuration. ' +
      'Powder-coated steel uprights resist corrosion in humid storage environments, and the ' +
      'bolt-together design allows reconfiguration without welding on-site.',
    specifications: [
      { label: 'Material', value: 'Powder-coated structural steel' },
      { label: 'Load capacity', value: 'Up to 2,500 kg per level' },
      { label: 'Height', value: 'Adjustable, 2–6m uprights' },
      { label: 'Beam levels', value: '4 (configurable)' },
      { label: 'Assembly', value: 'Bolt-together, no welding required' },
      { label: 'Packaging', value: 'Flat-packed on pallets' },
      { label: 'Origin', value: 'Lahore, Pakistan' },
    ],
    reviews: [
      { author: 'Nordic Trade House', rating: 5, comment: 'Assembly was straightforward with the included hardware. Rated load capacity checks out under our forklift loads.', daysAgo: 25 },
      { author: 'Al-Karam Traders', rating: 4, comment: 'Solid racking, powder coat had minor scuffing from freight but nothing structural.', daysAgo: 44 },
      { author: 'Redwood Imports LLC', rating: 5, comment: 'Verified seller, reconfigured our whole warehouse layout with these without any welding on-site.', daysAgo: 70 },
    ],
  },
};

function withDetails(product) {
  const details = PRODUCT_DETAILS[product.id];
  return {
    ...product,
    description: details.description,
    specifications: details.specifications,
    reviews: details.reviews.map((r) => ({
      author: r.author,
      rating: r.rating,
      comment: r.comment,
      date: new Date(Date.now() - r.daysAgo * 86400000),
      images: r.images || [],
      verifiedPurchase: r.verifiedPurchase !== false,
    })),
  };
}

export const products = [
  { id: 'cotton-twill-fabric', name: 'Cotton Twill Fabric 280 GSM', seller: 'Anwar Textile Mills', location: 'Faisalabad, Pakistan', category: 'Textiles & Fabrics', rating: '4.8', price: 'Rs 670', moq: '500m', unit: 'metre', badge: 'Best seller', stock: 2400, sold: 860, spotlight: true, spotlightType: 'featured', img: unsplash('photo-1523381210434-271e8be1f52b') },
  { id: 'surgical-instrument-set', name: 'Stainless Surgical Instrument Set', seller: 'Sialkot Surgical Co.', location: 'Sialkot, Pakistan', category: 'Surgical Instruments', rating: '4.9', price: 'Rs 2,480', moq: '100pc', unit: 'set', badge: 'Top rated', stock: 340, sold: 540, spotlight: true, spotlightType: 'featured', img: unsplash('photo-1583911860205-72f8ac8ddcbe') },
  { id: 'leather-work-gloves', name: 'Full-Grain Leather Work Gloves', seller: 'Karachi Leatherworks', location: 'Karachi, Pakistan', category: 'Leather Goods', rating: '4.7', price: 'Rs 865', moq: '300pr', unit: 'pair', badge: 'Verified', stock: 980, sold: 1200, spotlight: true, spotlightType: 'sponsored', img: unsplash('photo-1473188588951-666fce8e7c68') },
  { id: 'match-grade-footballs', name: 'Match-Grade Footballs', seller: 'Star Sports Mfg.', location: 'Sialkot, Pakistan', category: 'Sports Goods', rating: '4.8', price: 'Rs 1,560', moq: '200pc', unit: 'piece', badge: 'Hot', stock: 18, sold: 210, img: unsplash('photo-1575361204480-aadea25e6e68') },
  { id: 'corrugated-shipping-boxes', name: 'Corrugated Shipping Boxes', seller: 'PakPack Industries', location: 'Lahore, Pakistan', category: 'Packaging', rating: '4.6', price: 'Rs 340', moq: '1000pc', unit: 'piece', badge: 'Verified', stock: 5200, sold: 670, img: unsplash('photo-1607166452427-7e4477079cb9') },
  { id: 'hand-tools-hardware-set', name: 'Hand Tools & Hardware Set', seller: 'Gujranwala Metals', location: 'Gujranwala, Pakistan', category: 'Hardware & Tools', rating: '4.7', price: 'Rs 1,120', moq: '150pc', unit: 'set', badge: 'Verified', stock: 610, sold: 305, img: unsplash('photo-1504148455328-c376907d081c') },
  { id: 'basmati-rice-25kg', name: 'Basmati Rice 25kg Bags', seller: 'Al-Barkat Rice Mills', location: 'Sheikhupura, Pakistan', category: 'Rice & Grains', rating: '4.7', price: 'Rs 3,200', moq: '50bag', unit: 'bag', badge: 'Trending', stock: 240, sold: 430, spotlight: true, spotlightType: 'sponsored', img: unsplash('photo-1586201375761-83865001e31c') },
  { id: 'denim-fabric-rolls', name: 'Denim Fabric Rolls', seller: 'Faisalabad Denim Co.', location: 'Faisalabad, Pakistan', category: 'Textiles & Fabrics', rating: '4.5', price: 'Rs 590', moq: '400m', unit: 'metre', badge: 'Trending', stock: 0, sold: 150, img: unsplash('photo-1565084888279-aca607ecce0c') },
  { id: 'warehouse-racking-systems', name: 'Warehouse Racking Systems', seller: 'PakPack Industries', location: 'Lahore, Pakistan', category: 'Hardware & Tools', rating: '4.6', price: 'Rs 8,400', moq: '10set', unit: 'set', badge: 'Verified', stock: 42, sold: 95, spotlight: true, spotlightType: 'featured', freeShipping: false, img: unsplash('photo-1553413077-190dd305871c') },
].map(withDetails);

// Color-family variants only make sense for goods that actually come in dyeable colors — showing
// a "Charcoal Grey" swatch on a football or a rice bag was a symptom of the same bug as the
// gallery images below: one fixed set of apparel photos/labels applied to every product
// regardless of category. Restricted to the categories where a color choice is realistic, and
// built from real photos of actual products in those categories rather than an arbitrary set.
const APPAREL_LIKE_CATEGORIES = new Set(['Textiles & Fabrics', 'Leather Goods']);
const VARIANT_NAMES = ['Classic White', 'Charcoal Grey', 'Deep Forest Green', 'Sandstone Beige'];
const DISCOUNT_PERCENTS = [12, 18, 22, 15, 20, 10, 25, 8, 14];

products.forEach((product, i) => {
  product.discountPercent = DISCOUNT_PERCENTS[i % DISCOUNT_PERCENTS.length];

  // Images come only from this exact category (not the broader apparel-like group) — a cotton
  // fabric's color swatches should never show a leather glove, even though both categories are
  // apparel-adjacent enough to have a "color family" picker at all.
  const categoryMateImages = products.filter((p) => p.category === product.category && p.id !== product.id).map((p) => p.img);
  const allCategoryImages = [product.img, ...categoryMateImages];

  product.variants = APPAREL_LIKE_CATEGORIES.has(product.category)
    ? VARIANT_NAMES.map((name, vi) => ({
        id: `${product.id}-var-${vi + 1}`,
        name,
        img: allCategoryImages[vi % allCategoryImages.length],
      }))
    : [];

  // Detail-page gallery — built from this product's own cover photo plus real photos of other
  // products sharing its category (both already verified-correct elsewhere in this file),
  // padded out with repeats of its own photo if the category has no siblings. Previously every
  // product's gallery used one fixed, unrelated set of clothing photos regardless of category.
  const gallery = [...new Set(allCategoryImages.filter(Boolean))];
  while (gallery.length < 3) gallery.push(product.img);
  product.images = gallery;
});

export const trendingProductIds = ['cotton-twill-fabric', 'surgical-instrument-set', 'leather-work-gloves', 'match-grade-footballs'];

export const spotlightNear = [
  { rank: 1, distance: '12 km away', shipping: 'Rs 450 · 2 days', productId: 'cotton-twill-fabric' },
  { rank: 2, distance: '38 km away', shipping: 'Rs 700 · 3 days', productId: 'corrugated-shipping-boxes' },
  { rank: 3, distance: '90 km away', shipping: 'Rs 990 · 4 days', productId: 'hand-tools-hardware-set' },
];

export const spotlightTrend = [
  { growth: '38%', productId: 'basmati-rice-25kg' },
  { growth: '24%', productId: 'denim-fabric-rolls' },
  { growth: '19%', productId: 'warehouse-racking-systems' },
  { growth: '12%', productId: 'match-grade-footballs' },
];

export const SELLER_SEED_META = {
  'Anwar Textile Mills': { verified: true, followerCount: 1240, responseRate: 97, responseTime: 'Within 1 hour' },
  'Karachi Leatherworks': { verified: true, followerCount: 860, responseRate: 95, responseTime: 'Within 2 hours' },
  'PakPack Industries': { verified: true, followerCount: 640, responseRate: 93, responseTime: 'Within 3 hours' },
  'Sialkot Surgical Co.': { verified: false, followerCount: 410, responseRate: 89, responseTime: 'Within 6 hours' },
  'Star Sports Mfg.': { verified: false, followerCount: 520, responseRate: 91, responseTime: 'Within 4 hours' },
  'Gujranwala Metals': { verified: false, followerCount: 310, responseRate: 88, responseTime: 'Within a day' },
  'Al-Barkat Rice Mills': { verified: false, followerCount: 275, responseRate: 90, responseTime: 'Within 8 hours' },
  'Faisalabad Denim Co.': { verified: false, followerCount: 380, responseRate: 87, responseTime: 'Within a day' },
};

export const DEMO_USERS = [
  {
    role: 'buyer',
    email: 'buyer@falsafahtot.com',
    phone: '+92 300 0000000',
    password: 'password123',
    companyName: 'Al-Karam Traders',
    country: 'Pakistan',
  },
  {
    role: 'seller',
    email: 'seller@falsafahtot.com',
    phone: '+92 300 1111111',
    password: 'password123',
    companyName: 'Anwar Textile Mills',
    country: 'Pakistan',
    category: 'Textiles & Fabrics',
    sellerType: 'individual',
    address: 'Plot 14, Industrial Estate, Faisalabad, Pakistan',
    cnicNumber: '3520112345671',
    cnicStatus: 'approved',
  },
  {
    role: 'admin',
    email: 'admin@falsafahtot.com',
    phone: '+92 300 9999999',
    password: 'password123',
    companyName: 'Falsafah HQ',
    country: 'Pakistan',
  },
];

export const DEMO_SELLER_PRODUCTS = [
  {
    ownerEmail: 'seller@falsafahtot.com',
    name: 'Cotton Twill Fabric 280 GSM',
    category: 'Textiles & Fabrics',
    description: 'Export-grade 280 GSM cotton twill, pre-shrunk and dyed to order. Popular for workwear, uniforms, and heavy-duty garment lining. Available in standard and custom widths.',
    sku: 'TEX-1001',
    price: 670,
    unit: 'metre',
    moq: '500m',
    stock: 2400,
    status: 'active',
    images: [unsplash('photo-1523381210434-271e8be1f52b'), unsplash('photo-1620799140408-edc6dcb6d633'), unsplash('photo-1489987707025-afc232f7ea0f')],
    daysAgo: 12,
  },
  {
    ownerEmail: 'seller@falsafahtot.com',
    name: 'Denim Fabric Rolls',
    category: 'Textiles & Fabrics',
    description: 'Mid-weight 12oz denim, indigo-dyed, sold in full rolls. Suitable for apparel and accessories manufacturing.',
    sku: 'TEX-1002',
    price: 590,
    unit: 'metre',
    moq: '400m',
    stock: 0,
    status: 'active',
    images: [unsplash('photo-1565084888279-aca607ecce0c')],
    daysAgo: 6,
  },
  {
    ownerEmail: 'seller@falsafahtot.com',
    name: 'Organic Cotton Canvas Roll',
    category: 'Textiles & Fabrics',
    description: '',
    sku: 'TEX-1003',
    price: 810,
    unit: 'metre',
    moq: '250m',
    stock: 640,
    status: 'draft',
    images: [unsplash('photo-1620799140408-edc6dcb6d633'), unsplash('photo-1441986300917-64674bd600d8')],
    daysAgo: 2,
  },
];

export const DEMO_SELLER_ORDERS = [
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Al-Karam Traders', buyerCountry: 'Pakistan', productName: 'Cotton Twill Fabric 280 GSM', qty: 800, unitPrice: 670, status: 'Pending', daysAgo: 1 },
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Gulistan Sourcing Co.', buyerCountry: 'United Arab Emirates', productName: 'Cotton Twill Fabric 280 GSM', qty: 2200, unitPrice: 583, status: 'Processing', daysAgo: 3 },
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Nordic Trade House', buyerCountry: 'Sweden', productName: 'Denim Fabric Rolls', qty: 400, unitPrice: 590, status: 'Shipped', daysAgo: 6 },
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Redwood Imports LLC', buyerCountry: 'United States', productName: 'Cotton Twill Fabric 280 GSM', qty: 500, unitPrice: 670, status: 'Delivered', daysAgo: 14 },
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Al-Karam Traders', buyerCountry: 'Pakistan', productName: 'Denim Fabric Rolls', qty: 150, unitPrice: 590, status: 'Cancelled', daysAgo: 20 },
];
