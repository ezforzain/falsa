import { Product } from '../models/Product.js';
import { Seller } from '../models/Seller.js';
import { parseMoqNumber } from './moq.js';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// The Seller Portal's "Add listing" flow writes to SellerProduct — a private, freely-editable
// table so a seller can manage their own inventory without touching the read-only public
// catalog directly (see the comment on the SellerProduct model). Nothing mirrored an active
// listing into the public `Product` collection that the storefront (/api/products, product
// pages, search, spotlight) actually reads from — so a seller could create, edit, and see a
// listing in their own dashboard, and it would never appear anywhere a buyer could find it.
//
// This is the one place that keeps the two in sync, keyed by the same _id so create/update/
// delete all map to a single lookup. Draft listings (or anything not `status: 'active'`) are
// kept out of the public catalog entirely rather than published half-hidden.
export async function syncSellerProductToCatalog(sellerProduct, ownerUser) {
  const id = sellerProduct._id.toString();

  if (sellerProduct.status !== 'active') {
    await Product.findByIdAndDelete(id);
    return;
  }

  const sellerRef = ownerUser?.sellerId;
  if (!sellerRef) {
    // Every seller signup creates a linked Seller directory record (see auth.routes.js
    // findOrCreateSellerByName) — this should be unreachable, but a listing with no storefront
    // owner to attribute it to must not be silently published under a broken reference.
    console.error(`Cannot publish listing ${id}: seller account ${ownerUser?._id} has no linked storefront record.`);
    return;
  }

  // Backfill the catalog Seller directory record's country from the owning account's signup
  // country the first time a listing syncs — this is the only place a real (non-seed) seller's
  // country ever reaches the storefront, so every product they publish can denormalize it below.
  const sellerDoc = await Seller.findById(sellerRef);
  if (sellerDoc && !sellerDoc.country && ownerUser.country) {
    sellerDoc.country = ownerUser.country;
    await sellerDoc.save();
  }

  await Product.findByIdAndUpdate(
    id,
    {
      _id: id,
      name: sellerProduct.name,
      sellerId: sellerRef,
      seller: ownerUser.companyName,
      location: ownerUser.address || ownerUser.country || null,
      category: sellerProduct.category,
      price: `Rs ${Number(sellerProduct.price).toLocaleString('en-US')}`,
      priceValue: Number(sellerProduct.price),
      moq: sellerProduct.moq,
      moqValue: parseMoqNumber(sellerProduct.moq),
      unit: sellerProduct.unit,
      stock: sellerProduct.stock,
      img: sellerProduct.img,
      images: sellerProduct.images,
      description: sellerProduct.description || '',
      b2bEnabled: Boolean(sellerProduct.b2bEnabled),
      freeShipping: sellerProduct.freeShipping !== false,
      worldwideFreeShipping: Boolean(sellerProduct.worldwideFreeShipping),
      sellerCountry: sellerDoc?.country || ownerUser.country || null,
      sellerVerified: sellerDoc?.verified || false,
      sellerOfficialStore: sellerDoc?.officialStore || false,
      tags: Array.isArray(sellerProduct.tags) ? sellerProduct.tags : [],
      specifications: Array.isArray(sellerProduct.specifications) ? sellerProduct.specifications : [],
      variants: (sellerProduct.variants || []).map((v) => ({
        id: slugify(v.name) || undefined,
        name: v.name,
        img: sellerProduct.img,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
      })),
      shipping: sellerProduct.shipping || {},
      priceTiers: Array.isArray(sellerProduct.priceTiers) ? sellerProduct.priceTiers : [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function removeSellerProductFromCatalog(sellerProductId) {
  await Product.findByIdAndDelete(sellerProductId.toString());
}
