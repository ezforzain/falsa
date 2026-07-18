import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { galleryImageIds, priceTiers, unsplash } from '../data/mockData';
import { catalog, sellers } from '../lib/api';
import { useCart } from '../context/CartContext';
import useIsMobile from '../hooks/useIsMobile';
import QuantityModal from '../components/QuantityModal';
import Toast from '../components/Toast';
import ImageGallery from '../components/ImageGallery';
import StoreCard from '../components/StoreCard';
import VariantBottomSheet from '../components/VariantBottomSheet';
import FirstVisitSignupPrompt from '../components/FirstVisitSignupPrompt';
import { IconChevronRight, IconShield, IconCheck, IconTruck, IconTrendingUp } from '../components/icons';

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
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-7 pb-20">
        <div className="grid gap-9 lg:gap-14 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' }}>
          <div className="animate-pulse h-[240px] md:h-[360px] lg:h-[540px] rounded-[18px] bg-surface-muted" />
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
      <main className="max-w-[1240px] mx-auto px-6 py-20 text-center">
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

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-7 pb-20 animate-fade-up">
      {/* Breadcrumb */}
      <div className="text-[13px] text-text-muted mb-[26px] flex items-center gap-2 flex-wrap">
        <Link to="/" className="text-green font-medium no-underline hover:underline">
          Home
        </Link>
        <IconChevronRight className="text-border-strong" />
        <span>{product.category}</span>
        <IconChevronRight className="text-border-strong" />
        <span className="text-ink-soft">{product.name}</span>
      </div>

      <div className="grid gap-9 lg:gap-14 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' }}>
        {/* Gallery */}
        <ImageGallery
          images={images}
          alt={product.name}
          heightClassName="h-[240px] md:h-[360px] lg:h-[540px] lg:max-h-[600px]"
          radiusClassName="rounded-[14px] sm:rounded-[16px] lg:rounded-[18px]"
          thumbHeightClassName="h-[54px] sm:h-[66px] lg:h-[78px]"
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
          <h1 className="font-display text-[26px] sm:text-[32px] font-bold m-0 mb-3 tracking-tight leading-[1.15] text-balance">
            {product.name}
          </h1>
          {storeSeller ? (
            <StoreCard rating={product.rating} seller={storeSeller} />
          ) : (
            <div className="animate-pulse h-[78px] bg-surface-muted rounded-2xl mb-[22px]" />
          )}

          {/* Price tiers */}
          <div className="border border-border rounded-2xl overflow-hidden mb-[22px] bg-white">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              {tiers.map((tier, i) => (
                <div
                  key={tier.range}
                  className={`px-5 py-[18px] ${i < tiers.length - 1 ? 'border-r border-border' : ''} ${i === tiers.length - 1 ? 'bg-[#F7FBF9]' : 'bg-white'}`}
                >
                  <div className="font-mono text-[11px] text-text-muted mb-1.5">{tier.range}</div>
                  <div className="font-display font-bold text-xl text-green">{tier.price}</div>
                  <div className="text-[11.5px] text-text-muted">PKR / {product.unit}</div>
                </div>
              ))}
            </div>
            <div className="bg-surface-muted px-5 py-3 text-[12.5px] text-text flex flex-wrap gap-x-6 gap-y-1 justify-between">
              <span>
                MOQ: <strong className="text-ink">{product.moq}</strong>
              </span>
              <span>
                Lead time: <strong className="text-ink">10–14 days</strong>
              </span>
              <span>
                Samples: <strong className="text-ink">Available</strong>
              </span>
            </div>
          </div>

          {/* Shipping estimate */}
          <div className="flex items-center justify-between bg-green-tint border border-green-tint-border rounded-[13px] px-[18px] py-4 flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-2.5 text-[13.5px] text-ink-soft">
              <IconTruck className="text-green" />
              Ship to <strong>🇵🇰 Pakistan</strong> — nearest seller
            </div>
            <div className="text-[13.5px] font-bold text-green">FREE on first order</div>
          </div>

          {actionError && <p className="text-sm text-orange-text mb-3">{actionError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleOrderNow}
              disabled={ordering || outOfStock}
              aria-busy={ordering}
              className="relative z-10 pointer-events-auto flex-1 flex items-center justify-center gap-2 text-center cursor-pointer disabled:cursor-not-allowed bg-orange hover:bg-orange-hover active:bg-orange-hover text-white font-semibold text-[15px] py-[15px] rounded-full shadow-[0_8px_24px_rgba(201,123,45,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
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
              className="relative z-10 pointer-events-auto flex-1 text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 font-semibold text-[15px] py-[15px] rounded-full transition-all active:scale-[0.98] bg-white border-[1.5px] border-green text-green hover:bg-green-tint active:bg-green-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              {outOfStock ? 'Out of stock' : 'Add to Cart'}
            </button>
          </div>

          <div className="flex gap-[22px] mt-[22px] text-[12.5px] text-text flex-wrap">
            <span className="flex items-center gap-1.5">
              <IconCheck className="text-green" strokeWidth="2.2" />
              Secure escrow
            </span>
            <span className="flex items-center gap-1.5">
              <IconCheck className="text-green" strokeWidth="2.2" />
              Sample available
            </span>
            <span className="flex items-center gap-1.5">
              <IconCheck className="text-green" strokeWidth="2.2" />
              Worldwide delivery
            </span>
          </div>
        </div>
      </div>

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
