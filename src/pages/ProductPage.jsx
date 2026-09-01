import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  priceTiers,
  productDescription,
  productSpecifications,
  productFeatures,
  productReviewSummary,
  productReviews,
  productFaqs,
  certifications,
  productSoldCount,
  productHighlights,
  companyProfile,
  packagingShipping,
} from '../data/mockData';
import { catalog, sellers } from '../lib/api';
import { parseMoqNumber } from '../lib/moq';
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
import VariantPicker from '../components/product/VariantPicker';
import FirstVisitSignupPrompt from '../components/FirstVisitSignupPrompt';
import SectionCard from '../components/product/SectionCard';
import QuickFacts from '../components/product/QuickFacts';
import PriceBox from '../components/product/PriceBox';
import FeatureBadges from '../components/product/FeatureBadges';
import StickyActionBar from '../components/product/StickyActionBar';
import ProductTabs from '../components/product/ProductTabs';
import ProductSpecifications from '../components/product/ProductSpecifications';
import ProductFeatures from '../components/product/ProductFeatures';
import SellerInfoSection from '../components/product/SellerInfoSection';
import CompanyProfileSection from '../components/product/CompanyProfileSection';
import PackagingShipping from '../components/product/PackagingShipping';
import TrustBadges from '../components/product/TrustBadges';
import CertificationsSection from '../components/product/CertificationsSection';
import ReviewsSection from '../components/product/ReviewsSection';
import FaqSection from '../components/product/FaqSection';
import ProductRail from '../components/product/ProductRail';
import MobileProductHeader from '../components/product/MobileProductHeader';
import { IconChevronRight, IconShield, IconTrendingUp } from '../components/icons';

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

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState(null);

  const [stickyBarVisible, setStickyBarVisible] = useState(false);
  const ctaSentinelRef = useRef(null);

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

  // Keep the inline VariantPicker's selection in sync with whichever product is actually loaded
  // — resets to the first variant (or none) every time the page navigates to a different product.
  useEffect(() => {
    setSelectedVariant(product?.variants?.[0] || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

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

  // Reveals the mobile sticky Buy Now / Add to Cart bar once the inline buy box (with its own
  // full-size buttons) has scrolled out of view — avoids showing two copies of the same actions
  // on screen at once right at the top of the page.
  useEffect(() => {
    if (!isMobile || !product) {
      setStickyBarVisible(false);
      return;
    }
    const sentinel = ctaSentinelRef.current;
    if (!sentinel) return;
    // `!isIntersecting` alone is true both when the sentinel is scrolled past (above the
    // viewport — what we want) AND before it's been reached at all (still below the viewport, on
    // first paint) — checking that its top has actually passed above 0 disambiguates the two.
    const observer = new IntersectionObserver(
      ([entry]) => setStickyBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isMobile, product]);

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
        await addToCart(product, parseMoqNumber(product.moq) || 1);
        navigate('/cart');
      } catch (err) {
        setActionError(err.message);
      } finally {
        setOrdering(false);
      }
    }, 400);
  };

  // The sheet always offers both actions regardless of which button opened it — `intent` (set by
  // whichever of the sheet's own two footer buttons was tapped) decides what happens next.
  const handleSheetConfirm = async ({ qty, intent }) => {
    setSheetLoading(true);
    setSheetError(null);
    try {
      await addToCart(product, qty);
      setSheetOpen(false);
      if (intent === 'buy') navigate('/cart');
      else setToastVisible(true);
    } catch (err) {
      setSheetError(err.message);
    } finally {
      setSheetLoading(false);
    }
  };

  // Mobile routes "Add to Cart" through the same variant sheet as "Order Now" (see
  // handleOrderNow) rather than the plain QuantityModal, so both actions get the same
  // color/quantity picker. Desktop keeps its existing QuantityModal flow.
  const openQuantityModal = () => {
    if (!product || outOfStock) return;
    if (isMobile) {
      setSheetError(null);
      setSheetOpen(true);
      return;
    }
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
      <>
        {isMobile && <MobileProductHeader />}
        <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-20">
          <div className="grid gap-10 lg:gap-16 items-start lg:grid-cols-[minmax(0,560px)_1fr]">
            <div className="animate-pulse h-[320px] md:h-[440px] lg:h-[620px] rounded-[18px] bg-surface-muted" />
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-6 bg-surface-muted rounded w-2/3" />
              <div className="h-4 bg-surface-muted rounded w-1/2" />
              <div className="h-32 bg-surface-muted rounded" />
              <div className="h-12 bg-surface-muted rounded" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (notFound || (!product && error)) {
    return (
      <>
        {isMobile && <MobileProductHeader />}
        <main className="max-w-[1320px] mx-auto px-6 py-20 text-center">
          <p className="text-text mb-5">{notFound ? 'Product not found.' : error}</p>
          <Link to="/" className="text-green font-semibold no-underline hover:underline">
            Back to marketplace
          </Link>
        </main>
      </>
    );
  }

  if (!product) return null;

  // Built from the product's own data (its cover photo plus real photos of other products in
  // its category — see server/src/seed/data.js) rather than one fixed set of stock photos
  // shared across every product regardless of category.
  const images = product.images?.length ? product.images : product.img ? [product.img] : [];
  const reviewSummary = productReviewSummary(product);
  const reviews = productReviews(product);
  const soldCount = productSoldCount(product);
  const highlights = productHighlights(product);
  // Up to 3 most-relevant/trending hashtags (server-ranked, see topTagsFor in
  // server/src/utils/hashtags.js) shown right under the title; any of the product's other
  // tags stay reachable from the description instead of cluttering the top of the page.
  const topTags = product.topTags || [];
  const extraTags = (product.tags || []).filter((t) => !topTags.some((top) => top.toLowerCase() === t.toLowerCase()));

  const sameCategory = catalogProducts.filter((p) => p.id !== product.id && p.category === product.category);
  const relatedProducts = sameCategory.slice(0, 4);
  // Distinct slice from relatedProducts (offset by 2) so the two rails don't show identical
  // items — a real "bought together" signal would come from order co-occurrence data, which
  // doesn't exist yet, so this is same-category products as a reasonable stand-in.
  const frequentlyBoughtWith = sameCategory.slice(2, 4);
  const recentlyViewedProducts = getRecentlyViewedIds()
    .filter((pid) => pid !== product.id)
    .map((pid) => catalogProducts.find((p) => p.id === pid))
    .filter(Boolean)
    .slice(0, 4);

  const tabs = [
    {
      key: 'overview',
      label: 'Overview',
      content: (
        <div className="flex flex-col gap-6 sm:gap-8">
          <SectionCard title="Product Description">
            <p className="text-[14.5px] text-text leading-relaxed m-0">{productDescription(product)}</p>
            {/* Any hashtags beyond the top 3 shown under the title stay reachable here,
                instead of cluttering the top of the page — still clickable/discoverable. */}
            {extraTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-border">
                <span className="text-[12px] font-semibold text-ink-soft">Tags:</span>
                {extraTags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/hashtag/${encodeURIComponent(tag)}`}
                    className="text-[12px] font-semibold text-green bg-green/10 hover:bg-green/15 rounded-full px-2.5 py-0.5 no-underline transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
          <ProductFeatures features={productFeatures(product)} />
          <CertificationsSection items={certifications} />
        </div>
      ),
    },
    {
      key: 'ratings',
      label: 'Ratings',
      content: <ReviewsSection summary={reviewSummary} reviews={reviews} />,
    },
    {
      key: 'details',
      label: 'Product Details',
      content: (
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Wholesale-tier pricing only makes sense for B2B sourcing — a Daraz-style single/
              few-unit consumer buy has nothing to tier. */}
          {product.b2bEnabled && (
            <SectionCard title="Bulk Pricing" subtitle="Unit price drops automatically at higher order quantities">
              <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-2xl overflow-hidden">
                {priceTiers(product.price).map((tier, i, arr) => (
                  <div
                    key={tier.range}
                    className={`px-5 py-[18px] ${i < arr.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-border' : ''} ${i === arr.length - 1 ? 'bg-green-tint' : 'bg-white'}`}
                  >
                    <div className="font-mono text-[11px] text-text-muted mb-1.5">{tier.range}</div>
                    <div className="font-display font-bold text-xl text-green">{tier.price}</div>
                    <div className="text-[11.5px] text-text-muted">PKR / {product.unit}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          <ProductSpecifications specs={productSpecifications(product)} />
          {/* Alibaba-style supplier context — business type, staff, main markets, packaging and
              lead time — shown only for B2B listings, where a buyer actually needs it. */}
          {product.b2bEnabled && storeSeller && <CompanyProfileSection profile={companyProfile(storeSeller)} />}
          {product.b2bEnabled && <PackagingShipping info={packagingShipping(product)} />}
          {storeSeller && <SellerInfoSection seller={storeSeller} rating={product.rating} />}
          <FaqSection faqs={productFaqs(product)} />
        </div>
      ),
    },
    {
      key: 'recommended',
      label: 'Recommended',
      content: (
        <div className="flex flex-col gap-8 sm:gap-10">
          <ProductRail title="Related Products" products={relatedProducts} />
          <ProductRail title="Frequently Bought Together" products={frequentlyBoughtWith} />
          <ProductRail title="Recently Viewed Products" products={recentlyViewedProducts} />
          {relatedProducts.length === 0 && frequentlyBoughtWith.length === 0 && recentlyViewedProducts.length === 0 && (
            <p className="text-[14px] text-text-muted text-center py-8">Nothing to recommend yet — keep browsing the marketplace.</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {isMobile && <MobileProductHeader product={product} />}
      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-16 sm:pb-20 animate-fade-up">
      {/* Breadcrumb — replaced by MobileProductHeader's Back button on mobile */}
      <div className="hidden md:flex text-[13px] text-text-muted mb-5 sm:mb-6 items-center gap-2 flex-wrap">
        <Link to="/" className="text-green font-medium no-underline hover:underline">
          Home
        </Link>
        <IconChevronRight className="text-border-strong" />
        <span>{product.category}</span>
        <IconChevronRight className="text-border-strong" />
        <span className="text-ink-soft">{product.name}</span>
      </div>

      {/* ---------- Hero: gallery + info, two columns ---------- */}
      <div className="grid gap-8 sm:gap-10 lg:gap-16 items-start lg:grid-cols-[minmax(0,560px)_1fr] mb-10 sm:mb-12">
        {/* Gallery — larger, swipeable, with pinch-to-zoom full-screen preview */}
        <div className="lg:sticky lg:top-24">
          <ImageGallery
            images={images}
            alt={product.name}
            heightClassName="h-[320px] sm:h-[440px] lg:h-[560px]"
            radiusClassName="rounded-[16px] sm:rounded-[18px] lg:rounded-[20px]"
            thumbHeightClassName="h-[56px] sm:h-[68px] lg:h-[78px]"
            fit="contain"
            badge={
              product.trendingOrder != null ? (
                <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/94 text-green text-[11px] sm:text-xs font-bold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
                  <IconTrendingUp />
                  Trending #{product.trendingOrder}
                </span>
              ) : null
            }
          />
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-24">
          {/* Was showing unconditionally on every product regardless of the seller's actual
              status — only a real admin-approved verified seller (product.verified, see
              catalog.routes.js's serializeProduct) should get this claim. */}
          {product.verified && (
            <div className="inline-flex items-center gap-2 bg-green-tint text-green text-xs font-bold px-3.5 py-1.5 rounded-full mb-4">
              <IconShield strokeWidth="2.2" />
              Verified seller · 100% Trusted
            </div>
          )}

          <h1 className="font-display text-[26px] sm:text-[32px] lg:text-[36px] font-bold m-0 mb-2 tracking-tight leading-[1.14] text-balance">
            {product.name}
          </h1>

          {/* YouTube-style hashtag row — max 3, clickable, only the tags currently ranked
              most relevant/trending for this product (see topTags above). */}
          {topTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {topTags.map((tag) => (
                <Link
                  key={tag}
                  to={`/hashtag/${encodeURIComponent(tag)}`}
                  className="text-[12.5px] font-semibold text-green bg-green-tint hover:bg-green/15 rounded-full px-3 py-1 no-underline transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {storeSeller ? (
            <StoreCard rating={product.rating} seller={storeSeller} />
          ) : (
            <div className="animate-pulse h-[78px] bg-surface-muted rounded-2xl mb-[22px]" />
          )}

          {/* Price — sticky-styled buy box: current/original/savings + rating + sold count */}
          <div className="bg-surface-muted/60 border border-border rounded-2xl px-5 py-5 mb-5">
            <PriceBox
              product={product}
              rating={reviewSummary.rating}
              reviewCount={reviewSummary.total}
              soldCount={soldCount}
              priceOverride={selectedVariant?.price}
            />
          </div>

          {/* Daraz-style pack/variant picker — visible on the page itself, not only inside the
              Add to Cart sheet, so a buyer sees and can pick a variant before tapping anything. */}
          <VariantPicker variants={product.variants} selected={selectedVariant} onSelect={setSelectedVariant} />

          {highlights.length > 0 && (
            <div className="mb-5">
              <FeatureBadges highlights={highlights} />
            </div>
          )}

          {/* MOQ / stock / shipping / delivery quick facts */}
          <QuickFacts product={product} outOfStock={outOfStock} b2bEnabled={product.b2bEnabled} />

          {/* Alibaba-style trust strip — Trade Assurance / verified seller reassurance right by
              the price, where a sourcing buyer expects it. Daraz-style B2C listings skip it. */}
          {product.b2bEnabled && <TrustBadges className="mb-5" />}

          {actionError && <p className="text-sm text-orange-text mb-3">{actionError}</p>}

          {/* Action buttons — one responsive row, Order Now is the dominant CTA. Sentinel marks
              where this inline buy box ends, so the mobile sticky bar only appears once it's
              scrolled out of view (see the IntersectionObserver effect above). */}
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
              {outOfStock ? 'Out of stock' : ordering ? (product.b2bEnabled ? 'Placing order…' : 'Placing…') : product.b2bEnabled ? 'Order Now' : 'Buy Now'}
            </button>
            <button
              type="button"
              onClick={openQuantityModal}
              disabled={outOfStock}
              className="relative z-10 pointer-events-auto flex-1 min-w-[140px] text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 font-semibold text-[15px] h-[52px] rounded-full transition-all active:scale-[0.98] bg-white border-[1.5px] border-green text-green hover:bg-green-tint active:bg-green-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              {outOfStock ? 'Out of stock' : 'Add to Cart'}
            </button>
            <ChatButton sellerId={storeSeller?.id} sellerName={storeSeller?.name} />
            <ShareButton title={product.name} />
          </div>
          <div ref={ctaSentinelRef} />
        </div>
      </div>

      {/* ---------- Tabbed content: Overview / Ratings / Product Details / Recommended ---------- */}
      <ProductTabs tabs={tabs} />

      {/* Clears the mobile sticky action bar so it never covers the last bit of content. */}
      {stickyBarVisible && <div className="h-[84px] md:hidden" aria-hidden="true" />}

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
        initialVariant={selectedVariant}
        loading={sheetLoading}
        error={sheetError}
        onClose={() => setSheetOpen(false)}
        onConfirm={handleSheetConfirm}
      />
      <FirstVisitSignupPrompt />

      {stickyBarVisible && (
        <StickyActionBar
          product={product}
          ordering={ordering}
          outOfStock={outOfStock}
          onOrderNow={handleOrderNow}
          onAddToCart={openQuantityModal}
          priceOverride={selectedVariant?.price}
        />
      )}
      </main>
    </>
  );
}
