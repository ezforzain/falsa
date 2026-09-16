// Same 4 marketplace sections as MarketplaceTabs (src/components/marketplace/MarketplaceTabs.jsx)
// and FilterConfig.FILTER_SECTIONS on the backend — kept in this fixed order everywhere. Shared
// between AdminPage.jsx (the delete-filter confirm dialog needs a section's label) and
// tabs/FiltersTab.jsx (the tab itself).
export const FILTER_SECTIONS = [
  { key: 'b2b', label: 'B2B' },
  { key: 'spotlight', label: 'Spotlight' },
  { key: 'worldwide', label: 'Worldwide' },
  { key: 'freeshipping', label: 'Free Shipping' },
];

export const FILTER_TYPE_LABELS = {
  category: 'Category',
  country: 'Country',
  priceRange: 'Price range',
  moq: 'Max MOQ',
  verified: 'Verified Sellers',
  officialStore: 'Mall / Official Store',
  freeShipping: 'Free Shipping',
  rating: 'Rating',
  discount: 'On Sale',
  sortBy: 'Sort by',
};
