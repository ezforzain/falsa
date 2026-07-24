import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  galleryImageIds,
  priceTiers,
  unsplash,
  productDescription,
  productSpecifications,
  productFeatures,
  packagingShipping,
  productReviewSummary,
  productReviews,
  productFaqs,
  certifications,
  companyProfile,
} from '../data/mockData';
import { catalog, sellers } from '../lib/api';
import { recordRecentlyViewed, getRecentlyViewedIds } from '../lib/recentlyViewed';
import { useCart } from '../context/CartContext';
import useIsMobile from '../hooks/useIsMobile';
import QuantityModal from '../components/QuantityModal';
import Toast from '../components/Toast';
import ImageGallery from '../components/ImageGallery';
import StoreCard from '../components/StoreCard';
import ShareButton from '../components/ShareButton';
import ChatButton from '../components/ChatButton';
import VariantBottomSheet from '../components/VariantBottomSheet';
import FirstVisitSignupPrompt from '../components/FirstVisitSignupPrompt';
import SectionCard from '../components/product/SectionCard';
import TrustBadges from '../components/product/TrustBadges';
import QuickFacts from '../components/product/QuickFacts';
import ProductSpecifications from '../components/product/ProductSpecifications';
import ProductFeatures from '../components/product/ProductFeatures';
import PackagingShipping from '../components/product/PackagingShipping';
import SellerInfoSection from '../components/product/SellerInfoSection';
import CompanyProfileSection from '../components/product/CompanyProfileSection';
import CertificationsSection from '../components/product/CertificationsSection';
import ReviewsSection from '../components/product/ReviewsSection';
import FaqSection from '../components/product/FaqSection';
import ProductRail from '../components/product/ProductRail';
import { IconChevronRight, IconShield, IconTrendingUp, IconStar } from '../components/icons';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  const [ordering, setOrdering] = useState(false);
  const [actionError, setActionError] = useState(null);
  const orderTimer = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  const [storeSeller, setStoreSeller] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState(null);

  const { addToCart, items } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const alreadyInCart = items.find((i) => i.product.id === product?.id)?.qty || 0;
  const outOfStock = typeof product?.stock === 'number' && alreadyInCart >= product.stock;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);

    catalog
      .product(id)
      .then(({ product: fetched }) => {
        if (cancelled) return;
        setProduct(fetched);
        recordRecentlyViewed(fetched.id);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) setNotFound(true);
        else setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Loads the Store Card once the product (and its sellerId) is known — separate from the
  // product fetch above so a slow/failed seller lookup never blocks rendering the product itself.
  useEffect(() => {
    if (!product?.sellerId) return;
    let cancelled = false;
    setStoreSeller(null);
    sellers
      .get(product.sellerId)
      .then(({ seller, products: sellerProducts, following }) => {
        if (cancelled) return;
        setStoreSeller({ ...seller, productCount: sellerProducts.length, following });
      })
      .catch(() => {
        // Non-critical — the rest of the page still works without the Store Card.
      });
    return () => {
      cancelled = true;
    };
  }, [product?.sellerId]);

  // Powers both "Related Products" (same category) and "Recently Viewed Products" — one fetch
  // of the whole catalog is enough to derive both rails client-side.
  useEffect(() => {
    if (!product?.id) return;
    let cancelled = false;
    catalog
      .products()
      .then(({ products: all }) => {
        if (!cancelled) setCatalogProducts(all);
      })
      .catch(() => {
        // Non-critical — Related/Recently Viewed rails just won't render.
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  useEffect(() => () => clearTimeout(orderTimer.current), []);

  // On mobile, "Order Now" opens the Daraz-style variant sheet so a shopper picks a color and
  // quantity before checking out. Desktop keeps the existing immediate-order flow.
  const handleOrderNow = () => {
    if (ordering || !product || outOfStock) return;
    if (isMobile) {
      setSheetError(null);
      setSheetOpen(true);
      return;
    }
    setOrdering(true);
    setActionError(null);
    orderTimer.current = setTimeout(async () => {
      try {
        await addToCart(product);
        navigate('/cart');
      } catch (err) {
        setActionError(err.message);
      } finally {
        setOrdering(false);
      }
    }, 400);
  };

  const handleSheetBuyNow = async ({ qty }) => {
    setSheetLoading(true);
    setSheetError(null);
    try {
      await addToCart(product, qty);
      setSheetOpen(false);
      navigate('/cart');
    } catch (err) {
      setSheetError(err.message);
    } finally {
      setSheetLoading(false);
    }
  };

  const openQuantityModal = () => {
    if (!product || outOfStock) return;
    setModalError(null);
    setModalOpen(true);
  };

  const handleConfirmAddToCart = async (qty) => {
    setModalLoading(true);
    setModalError(null);
    try {
      await addToCart(product, qty);
      setModalOpen(false);
      setToastVisible(true);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-20">
        <div className="grid gap-10 lg:gap-16 items-start lg:grid-cols-[minmax(0,560px)_1fr]">
          <div className="animate-pulse h-[280px] md:h-[400px] lg:h-[560px] rounded-[18px] bg-surface-muted" />
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-6 bg-surface-muted rounded w-2/3" />
            <div className="h-4 bg-surface-muted rounded w-1/2" />
            <div className="h-32 bg-surface-muted rounded" />
            <div className="h-12 bg-surface-muted rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (notFound || (!product && error)) {
    return (
      <main className="max-w-[1320px] mx-auto px-6 py-20 text-center">
        <p className="text-text mb-5">{notFound ? 'Product not found.' : error}</p>
        <Link to="/" className="text-green font-semibold no-underline hover:underline">
          Back to marketplace
        </Link>
      </main>
    );
  }

  if (!product) return null;

  const images = galleryImageIds.map((imgId) => unsplash(imgId, 1100));
  const tiers = priceTiers(product.price);
  const reviewSummary = productReviewSummary(product);
  const reviews = productReviews(product);
  const profile = companyProfile(storeSeller);

  const relatedProducts = catalogProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);
  const recentlyViewedProducts = getRecentlyViewedIds()
    .filter((pid) => pid !== product.id)
    .map((pid) => catalogProducts.find((p) => p.id === pid))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-20 animate-fade-up">
      {/* Breadcrumb */}
      <div className="text-[13px] text-text-muted mb-6 flex items-center gap-2 flex-wrap">
        <Link to="/" className="text-green font-medium no-underline hover:underline">
          Home
        </Link>
        <IconChevronRight className="text-border-strong" />
        <span>{product.category}</span>
        <IconChevronRight className="text-border-strong" />
        <span className="text-ink-soft">{product.name}</span>
      </div>

      {/* ---------- Hero: gallery + info, two columns ---------- */}
      <div className="grid gap-10 lg:gap-16 items-start lg:items-center lg:grid-cols-[minmax(0,560px)_1fr] mb-10 sm:mb-12">
        {/* Gallery */}
        <ImageGallery
          images={images}
          alt={product.name}
          heightClassName="h-[280px] sm:h-[400px] lg:h-[560px]"
          radiusClassName="rounded-[14px] sm:rounded-[16px] lg:rounded-[18px]"
          thumbHeightClassName="h-[54px] sm:h-[66px] lg:h-[78px]"
          fit="contain"
          badge={
            <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/94 text-green text-[11px] sm:text-xs font-bold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
              <IconTrendingUp />
              Trending #1
            </span>
          }
        />

        {/* Info */}
        <div>
          <div className="inline-flex items-center gap-2 bg-green-tint text-green text-xs font-bold px-3.5 py-1.5 rounded-full mb-[18px]">
            <IconShield strokeWidth="2.2" />
            Verified seller · 100% Trusted
          </div>

          <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[38px] font-bold m-0 mb-3 tracking-tight leading-[1.12] text-balance">
            {product.name}
          </h1>

          <a
            href="#reviews"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-soft no-underline hover:underline mb-4"
          >
            <IconStar width="14" height="14" />
            {reviewSummary.rating.toFixed(1)}
            <span className="text-text-muted font-medium">({reviewSummary.total.toLocaleString()} reviews)</span>
          </a>

          {storeSeller ? (
            <StoreCard rating={product.rating} seller={storeSeller} />
          ) : (
            <div className="animate-pulse h-[78px] bg-surface-muted rounded-2xl mb-[22px]" />
          )}

          {/* Headline price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-display font-bold text-[32px] sm:text-[38px] text-green tracking-tight">{product.price}</span>
            <span className="text-sm text-text-muted font-medium">/ {product.unit}</span>
          </div>

          {/* Price tiers */}
          <div className="border border-border rounded-2xl overflow-hidden mb-6 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-3">
              {tiers.map((tier, i) => (
                <div
                  key={tier.range}
                  className={`px-5 py-[18px] ${i < tiers.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-border' : ''} ${i === tiers.length - 1 ? 'bg-[#F7FBF9]' : 'bg-white'}`}
                >
                  <div className="font-mono text-[11px] text-text-muted mb-1.5">{tier.range}</div>
                  <div className="font-display font-bold text-xl text-green">{tier.price}</div>
                  <div className="text-[11.5px] text-text-muted">PKR / {product.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* MOQ / stock / shipping / delivery quick facts */}
          <QuickFacts product={product} outOfStock={outOfStock} />

          {/* Trust badges */}
          <TrustBadges className="mb-6" />

          {actionError && <p className="text-sm text-orange-text mb-3">{actionError}</p>}

          {/* Action buttons — one responsive row, Order Now is the dominant CTA */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleOrderNow}
              disabled={ordering || outOfStock}
              aria-busy={ordering}
              className="relative z-10 pointer-events-auto basis-full sm:basis-0 sm:flex-[1.6] flex items-center justify-center gap-2 text-center cursor-pointer disabled:cursor-not-allowed bg-orange hover:bg-orange-hover active:bg-orange-hover text-white font-semibold text-[15px] h-[52px] rounded-full shadow-[0_8px_24px_rgba(201,123,45,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            >
              {ordering && (
                <span className="w-4 h-4 border-[2.5px] border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              )}
              {outOfStock ? 'Out of stock' : ordering ? 'Placing order…' : 'Order Now'}
            </button>
            <button
              type="button"
              onClick={openQuantityModal}
              disabled={outOfStock}
              className="relative z-10 pointer-events-auto flex-1 min-w-[140px] text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 font-semibold text-[15px] h-[52px] rounded-full transition-all active:scale-[0.98] bg-white border-[1.5px] border-green text-green hover:bg-green-tint active:bg-green-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              {outOfStock ? 'Out of stock' : 'Add to Cart'}
            </button>
            <ChatButton />
            <ShareButton title={product.name} />
          </div>
        </div>
      </div>

      {/* ---------- Content sections ---------- */}
      <SectionCard title="Product Description" id="description">
        <p className="text-[14.5px] text-text leading-relaxed m-0">{productDescription(product)}</p>
      </SectionCard>

      <ProductSpecifications specs={productSpecifications(product)} />
      <ProductFeatures features={productFeatures(product)} />
      <PackagingShipping info={packagingShipping(product)} />

      {storeSeller && <SellerInfoSection seller={storeSeller} rating={product.rating} />}
      {storeSeller && <CompanyProfileSection profile={profile} />}

      <CertificationsSection items={certifications} />
      <ReviewsSection summary={reviewSummary} reviews={reviews} />
      <FaqSection faqs={productFaqs(product)} />

      <ProductRail title="Related Products" products={relatedProducts} />
      <ProductRail title="Recently Viewed Products" products={recentlyViewedProducts} />

      <QuantityModal
        product={product}
        open={modalOpen}
        alreadyInCart={alreadyInCart}
        loading={modalLoading}
        error={modalError}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAddToCart}
      />
      <Toast message="Added to cart successfully" show={toastVisible} onHide={() => setToastVisible(false)} />
      <VariantBottomSheet
        product={product}
        open={sheetOpen}
        loading={sheetLoading}
        error={sheetError}
        onClose={() => setSheetOpen(false)}
        onBuyNow={handleSheetBuyNow}
      />
      <FirstVisitSignupPrompt />
    </main>
  );
}
