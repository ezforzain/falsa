// Mock data ported from the Falsafah Tot design exports (Falsafah Tot v2.dc.html)

export const unsplash = (id, w = 700) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const categories = [
  {
    key: "textiles",
    name: "Textiles",
    icon: "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z",
    img: unsplash("photo-1523381210434-271e8be1f52b", 200),
  },
  {
    key: "surgical",
    name: "Surgical Instruments",
    icon: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
    img: unsplash("photo-1583911860205-72f8ac8ddcbe", 200),
  },
  {
    key: "leather",
    name: "Leather Goods",
    icon: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42zM7.5 7.5h.01",
    img: unsplash("photo-1473188588951-666fce8e7c68", 200),
  },
  {
    key: "sports",
    name: "Sports Goods",
    icon: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
    img: unsplash("photo-1575361204480-aadea25e6e68", 200),
  },
  {
    key: "rice",
    name: "Rice & Grains",
    icon: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
    img: unsplash("photo-1586201375761-83865001e31c", 200),
  },
  {
    key: "electronics",
    name: "Electronics",
    icon: "M6 6h12v12H6zM10 10h4v4h-4zM9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2",
    img: unsplash("photo-1504148455328-c376907d081c", 200),
  },
  {
    key: "packaging",
    name: "Packaging",
    icon: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7l8.7 5 8.7-5M12 22V12",
    img: unsplash("photo-1553413077-190dd305871c", 200),
  },
  {
    key: "hardware",
    name: "Hardware & Tools",
    icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
    img: unsplash("photo-1607166452427-7e4477079cb9", 200),
  },
];

export const products = [
  {
    id: "cotton-twill-fabric",
    name: "Cotton Twill Fabric 280 GSM",
    seller: "Anwar Textile Mills",
    location: "Faisalabad, Pakistan",
    category: "Textiles & Fabrics",
    rating: "4.8",
    price: "Rs 670",
    moq: "500m",
    unit: "metre",
    badge: "Best seller",
    stock: 2400,
    img: unsplash("photo-1523381210434-271e8be1f52b"),
  },
  {
    id: "surgical-instrument-set",
    name: "Stainless Surgical Instrument Set",
    seller: "Sialkot Surgical Co.",
    location: "Sialkot, Pakistan",
    category: "Surgical Instruments",
    rating: "4.9",
    price: "Rs 2,480",
    moq: "100pc",
    unit: "set",
    badge: "Top rated",
    stock: 340,
    img: unsplash("photo-1583911860205-72f8ac8ddcbe"),
  },
  {
    id: "leather-work-gloves",
    name: "Full-Grain Leather Work Gloves",
    seller: "Karachi Leatherworks",
    location: "Karachi, Pakistan",
    category: "Leather Goods",
    rating: "4.7",
    price: "Rs 865",
    moq: "300pr",
    unit: "pair",
    badge: "Verified",
    stock: 980,
    img: unsplash("photo-1473188588951-666fce8e7c68"),
  },
  {
    id: "match-grade-footballs",
    name: "Match-Grade Footballs",
    seller: "Star Sports Mfg.",
    location: "Sialkot, Pakistan",
    category: "Sports Goods",
    rating: "4.8",
    price: "Rs 1,560",
    moq: "200pc",
    unit: "piece",
    badge: "Hot",
    stock: 18,
    img: unsplash("photo-1575361204480-aadea25e6e68"),
  },
  {
    id: "corrugated-shipping-boxes",
    name: "Corrugated Shipping Boxes",
    seller: "PakPack Industries",
    location: "Lahore, Pakistan",
    category: "Packaging",
    rating: "4.6",
    price: "Rs 340",
    moq: "1000pc",
    unit: "piece",
    badge: "Verified",
    stock: 5200,
    img: unsplash("photo-1607166452427-7e4477079cb9"),
  },
  {
    id: "hand-tools-hardware-set",
    name: "Hand Tools & Hardware Set",
    seller: "Gujranwala Metals",
    location: "Gujranwala, Pakistan",
    category: "Hardware & Tools",
    rating: "4.7",
    price: "Rs 1,120",
    moq: "150pc",
    unit: "set",
    badge: "Verified",
    stock: 610,
    img: unsplash("photo-1504148455328-c376907d081c"),
  },
  {
    id: "basmati-rice-25kg",
    name: "Basmati Rice 25kg Bags",
    seller: "Al-Barkat Rice Mills",
    location: "Sheikhupura, Pakistan",
    category: "Rice & Grains",
    rating: "4.7",
    price: "Rs 3,200",
    moq: "50bag",
    unit: "bag",
    badge: "Trending",
    stock: 240,
    img: unsplash("photo-1586201375761-83865001e31c"),
  },
  {
    id: "denim-fabric-rolls",
    name: "Denim Fabric Rolls",
    seller: "Faisalabad Denim Co.",
    location: "Faisalabad, Pakistan",
    category: "Textiles & Fabrics",
    rating: "4.5",
    price: "Rs 590",
    moq: "400m",
    unit: "metre",
    badge: "Trending",
    stock: 0,
    img: unsplash("photo-1565084888279-aca607ecce0c"),
  },
  {
    id: "warehouse-racking-systems",
    name: "Warehouse Racking Systems",
    seller: "PakPack Industries",
    location: "Lahore, Pakistan",
    category: "Hardware & Tools",
    rating: "4.6",
    price: "Rs 8,400",
    moq: "10set",
    unit: "set",
    badge: "Verified",
    stock: 42,
    img: unsplash("photo-1553413077-190dd305871c"),
  },
];

// Variant/discount mock data for the Product Variant Selection Bottom Sheet — this catalog has
// no real per-product variant data, so every product gets the same small "Color Family" set and
// a deterministic discount percentage, cycling through a fixed list rather than random values so
// the same product always looks the same across reloads.
const VARIANT_IMAGE_IDS = [
  "photo-1523381210434-271e8be1f52b",
  "photo-1620799140408-edc6dcb6d633",
  "photo-1489987707025-afc232f7ea0f",
  "photo-1441986300917-64674bd600d8",
];
const VARIANT_NAMES = [
  "Classic White",
  "Charcoal Grey",
  "Deep Forest Green",
  "Sandstone Beige",
];
const DISCOUNT_PERCENTS = [12, 18, 22, 15, 20, 10, 25, 8, 14];

products.forEach((product, i) => {
  product.discountPercent = DISCOUNT_PERCENTS[i % DISCOUNT_PERCENTS.length];
  product.variants = VARIANT_NAMES.map((name, vi) => ({
    id: `${product.id}-var-${vi + 1}`,
    name,
    img: unsplash(VARIANT_IMAGE_IDS[vi % VARIANT_IMAGE_IDS.length], 200),
  }));
});

export const getProductById = (id) => products.find((p) => p.id === id);

// Trims outer whitespace and collapses repeated internal whitespace, e.g. "  leather   goods " -> "leather goods".
export const normalizeQuery = (raw) =>
  String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");

// Case-insensitive match against name, category, and seller — not name-only — so a query
// like "leather goods" (a category, not a product name) still finds relevant products.
export const matchesQuery = (product, query) => {
  const q = normalizeQuery(query).toLowerCase();
  if (!q) return true;
  return (
    product.name.toLowerCase().includes(q) ||
    product.category.toLowerCase().includes(q) ||
    product.seller.toLowerCase().includes(q)
  );
};

export const searchProducts = (query) =>
  products.filter((p) => matchesQuery(p, query));

export const parsePrice = (priceStr) =>
  parseInt(String(priceStr).replace(/[^0-9]/g, ""), 10) || 0;

export const formatPKR = (n) => "Rs " + Math.round(n).toLocaleString("en-PK");

export const trendingProducts = [
  "cotton-twill-fabric",
  "surgical-instrument-set",
  "leather-work-gloves",
  "match-grade-footballs",
].map(getProductById);

export const spotlightNear = [
  {
    rank: 1,
    distance: "12 km away",
    shipping: "Rs 450 · 2 days",
    product: getProductById("cotton-twill-fabric"),
  },
  {
    rank: 2,
    distance: "38 km away",
    shipping: "Rs 700 · 3 days",
    product: getProductById("corrugated-shipping-boxes"),
  },
  {
    rank: 3,
    distance: "90 km away",
    shipping: "Rs 990 · 4 days",
    product: getProductById("hand-tools-hardware-set"),
  },
];

export const spotlightTrend = [
  { growth: "38%", product: getProductById("basmati-rice-25kg") },
  { growth: "24%", product: getProductById("denim-fabric-rolls") },
  { growth: "19%", product: getProductById("warehouse-racking-systems") },
  { growth: "12%", product: getProductById("match-grade-footballs") },
];

export const searchHints = [
  "cotton twill fabric",
  "surgical instrument set",
  "leather work gloves",
  "match-grade footballs",
];

export const priceTiers = (basePrice) => {
  const base = parsePrice(basePrice) || 670;
  return [
    { range: "500–2,000 units", price: formatPKR(base) },
    { range: "2,000–10,000 units", price: formatPKR(base * 0.87) },
    { range: "10,000+ units", price: formatPKR(base * 0.77) },
  ];
};

export const mobileCategories = [
  {
    key: "textiles",
    name: "Textiles",
    fullName: "Textiles & Fabrics", 
    img: unsplash("photo-1523381210434-271e8be1f52b", 200),
  },
  {
    key: "surgical",
    name: "Surgical",
    fullName: "Surgical Instruments",
    img: unsplash("photo-1583911860205-72f8ac8ddcbe", 200),
  },
  {
    key: "leather",
    name: "Leather",
    fullName: "Leather Goods",
    img: unsplash("photo-1473188588951-666fce8e7c68", 200),
  },
  {
    key: "sports",
    name: "Sports",
    fullName: "Sports Goods",
    img: unsplash("photo-1575361204480-aadea25e6e68", 200),
  },
  {
    key: "rice",
    name: "Rice & Grains",
    fullName: "Rice & Grains",
    img: unsplash("photo-1586201375761-83865001e31c", 200),
  },
  {
    key: "hardware",
    name: "Hardware",
    fullName: "Hardware & Tools",
    img: unsplash("photo-1504148455328-c376907d081c", 200),
  },
];

// ---------- Product Detail page: derived display content ----------
// The catalog has real per-product `description`/`specifications`/`reviews` — used directly
// when present. Everything else below (features, packaging, FAQ, certifications, company
// profile) has no backing data at all, so it's computed deterministically from the product/
// seller id instead, same pattern as `priceTiers` and the per-product `discountPercent`/
// `variants` above — the same listing always renders the same content across reloads, it's
// just not sourced from the database.
const hashString = (str) => {
  let h = 0;
  const s = String(str ?? "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export const productDescription = (product) =>
  (product.description && product.description.trim()) ||
  (product.b2bEnabled
    ? `${product.name} is supplied directly from ${product.seller}'s production facility${
        product.location ? ` in ${product.location}` : ""
      }. Manufactured to consistent quality standards for bulk B2B orders, this listing is backed by verified production capacity, flexible minimum order quantities, and dependable lead times — built for importers, distributors, and retail buyers sourcing at scale.`
    : `${product.name} is sold by ${product.seller}${
        product.location ? ` from ${product.location}` : ""
      } — a verified seller offering a genuine product, secure checkout, and easy 14-day returns.`);

// B2B specs read like a supplier listing (MOQ, supply ability, payment terms); B2C specs read
// like a retail listing (return/warranty, authenticity) — same shopper never sees the wrong set.
export const productSpecifications = (product) => {
  if (Array.isArray(product.specifications) && product.specifications.length > 0) {
    return product.specifications.map((s) => [s.label, s.value]);
  }
  if (!product.b2bEnabled) {
    return [
      ["Category", product.category],
      ["Country of Origin", product.location || "Pakistan"],
      ["Authenticity", "100% genuine — buyer guarantee"],
      ["Return Policy", "14-day easy return"],
      ["Warranty", "Standard seller warranty"],
    ];
  }
  return [
    ["Category", product.category],
    ["Minimum Order Quantity", product.moq],
    ["Unit", product.unit],
    ["Place of Origin", product.location || "Pakistan"],
    ["Supply Ability", "10,000+ units / month"],
    ["Packaging Details", "Export-standard carton / pallet packaging"],
    ["Port", "Karachi, Pakistan"],
    ["Payment Terms", "T/T, L/C, Trade Assurance"],
    ["Sample Available", "Yes"],
  ];
};

export const productFeatures = (product) =>
  product.b2bEnabled
    ? [
        `Consistent quality across every ${product.unit || "unit"} of ${(product.category || "product").toLowerCase()}`,
        "Flexible order sizes from sample to full container load",
        "Dedicated quality-control checks before dispatch",
        "Custom branding and private labeling available on request",
        "Responsive seller support for order tracking and documentation",
        "Competitive tiered pricing for bulk buyers",
      ]
    : [
        "Fast, reliable delivery with real-time order tracking",
        "14-day easy return if it's not the right fit",
        "Verified seller — genuine, authentic products only",
        "Secure checkout with buyer protection on every order",
      ];

export const packagingShipping = (product) => {
  const h = hashString(product.id);
  return {
    packaging: "Export-grade carton / pallet packaging, moisture-protected",
    weight: `${(2 + (h % 18)).toFixed(1)} kg approx. per unit carton`,
    leadTime: "10–14 days after order confirmation",
    ports: "Karachi, Lahore (dry port)",
    methods: "Sea freight, air freight, or express courier for samples",
  };
};

const REVIEW_NAMES = ["Ahmed R.", "Fatima K.", "Global Trade LLC", "Nordic Sourcing Co.", "M. Bilal", "Al-Karam Traders", "S. Aisha", "Redwood Imports"];
const REVIEW_COUNTRIES = ["Pakistan", "UAE", "United States", "United Kingdom", "Sweden", "Germany", "Saudi Arabia", "Turkey"];
const REVIEW_COMMENTS = [
  "Great quality and exactly as described. Will order again.",
  "Communication was smooth and delivery was on time.",
  "Good value for bulk orders, packaging was solid.",
  "Product matched the samples we received. Recommended supplier.",
  "Minor delay in shipping but the seller kept us updated throughout.",
  "Consistent quality across repeat orders — a reliable supplier.",
];

export const productReviewSummary = (product) => {
  const real = Array.isArray(product.reviews) && product.reviews.length > 0 ? product.reviews : null;
  if (real) {
    const total = real.length;
    const rating = real.reduce((sum, r) => sum + (r.rating || 0), 0) / total;
    const counts = [0, 0, 0, 0, 0]; // counts[0] = 1-star ... counts[4] = 5-star
    real.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
      counts[star - 1]++;
    });
    const breakdown = [5, 4, 3, 2, 1].map((star) => ({ star, pct: Math.round((counts[star - 1] / total) * 100) }));
    return { rating, total, breakdown };
  }

  const h = hashString(product.id);
  const rating = parseFloat(product.rating) || 4.6;
  const total = 60 + (h % 480);
  const weights = [0.62, 0.24, 0.08, 0.04, 0.02];
  const breakdown = [5, 4, 3, 2, 1].map((star, i) => ({ star, pct: Math.round(weights[i] * 100) }));
  return { rating, total, breakdown };
};

export const productReviews = (product) => {
  const real = Array.isArray(product.reviews) && product.reviews.length > 0 ? product.reviews : null;
  if (real) {
    return real.map((r, i) => ({
      id: `${product.id}-review-${i}`,
      name: r.author,
      rating: r.rating,
      comment: r.comment,
      date: r.date,
      images: r.images || [],
      verifiedPurchase: r.verifiedPurchase !== false,
    }));
  }

  const h = hashString(product.id);
  return Array.from({ length: 5 }).map((_, i) => {
    const daysAgo = 3 + ((h + i * 11) % 90);
    return {
      id: `${product.id}-review-${i}`,
      name: REVIEW_NAMES[(h + i * 7) % REVIEW_NAMES.length],
      country: REVIEW_COUNTRIES[(h + i * 3) % REVIEW_COUNTRIES.length],
      rating: 5 - ((h + i) % 2),
      comment: REVIEW_COMMENTS[(h + i * 5) % REVIEW_COMMENTS.length],
      date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      images: [],
      verifiedPurchase: true,
    };
  });
};

export const productFaqs = (product) => [
  {
    q: "What is the minimum order quantity?",
    a: `The minimum order quantity for ${product.name} is ${product.moq}. Contact the seller to discuss smaller trial orders.`,
  },
  {
    q: "Can I get a sample before placing a bulk order?",
    a: "Yes, samples are available. Sample cost and shipping are usually paid by the buyer unless negotiated otherwise.",
  },
  {
    q: "What payment methods are accepted?",
    a: "This seller accepts bank transfer (T/T), letter of credit (L/C), and orders placed through Trade Assurance for buyer protection.",
  },
  {
    q: "How long does production and shipping take?",
    a: "Typical lead time is 10–14 days for production, plus shipping time depending on your destination and chosen freight method.",
  },
  {
    q: "Do you offer custom branding or packaging?",
    a: "Custom branding, private labeling, and packaging customization are available for qualifying order volumes — message the seller for details.",
  },
];

export const certifications = [
  { name: "ISO 9001", desc: "Quality management certified" },
  { name: "BSCI", desc: "Social compliance audited" },
  { name: "SGS Verified", desc: "Third-party inspected" },
  { name: "Trade Assurance", desc: "Order protection guaranteed" },
];

const ALL_MARKETS = ["Middle East", "Europe", "North America", "South Asia", "East Asia", "Africa"];

export const companyProfile = (seller) => {
  const h = hashString(seller?.id || seller?.name);
  const markets = ALL_MARKETS.filter((_, i) => ((h >> i) & 1) === 0);
  return {
    foundedYear: 2001 + (h % 20),
    staffCount: ["10–50", "50–100", "100–200", "200–500"][h % 4],
    businessType: ["Manufacturer", "Manufacturer & Trading Company", "Trading Company"][h % 3],
    mainMarkets: (markets.length >= 2 ? markets : ALL_MARKETS).slice(0, 3),
    annualRevenue: ["US$1M – 2.5M", "US$2.5M – 5M", "US$5M – 10M", "US$10M – 50M"][h % 4],
  };
};

// Deterministic "N sold" social-proof stat shown next to the rating — same hashString technique
// as the other synthetic-but-stable stats above, so it stays fixed for a given product instead
// of jumping around between renders.
export const productSoldCount = (product) => {
  const h = hashString(product.id);
  return 150 + (h % 4850);
};

// Short spec-highlight chips for the icon badge row near the top of the Overview tab — just the
// first few real specifications (falls back to the generated list, same as productSpecifications).
export const productHighlights = (product) =>
  productSpecifications(product)
    .slice(0, 4)
    .map(([label, value]) => ({ label, value }));

export const mobileTabs = [
  {
    key: "aimode",
    label: "B2B",
    banner:
      "B2B: describe what you need in plain words and we’ll match suppliers for you.",
  },
  { key: "spotlight", label: "Spotlight", banner: null },
  {
    key: "worldwide",
    label: "Worldwide",
    banner: "Worldwide: browsing verified sellers across all 190+ countries.",
  },
  {
    key: "freeshipping",
    label: "Free Shipping",
    banner:
      "Free Shipping: showing products eligible for free shipping on your first order.",
  },
];
