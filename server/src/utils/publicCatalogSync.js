import { Product } from '../models/Product.js';

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
      moq: sellerProduct.moq,
      unit: sellerProduct.unit,
      stock: sellerProduct.stock,
      img: sellerProduct.img,
      images: sellerProduct.images,
      description: sellerProduct.description || '',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function removeSellerProductFromCatalog(sellerProductId) {
  await Product.findByIdAndDelete(sellerProductId.toString());
}
