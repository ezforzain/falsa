import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPKR, parsePrice } from '../data/mockData';
import { IconCart, IconCheck, IconTruck } from '../components/icons';

export default function CartPage() {
  const { items, updateQty, removeFromCart, subtotal, loading, checkout } = useCart();
  const [qtyError, setQtyError] = useState(null); // { productId, message }
  const qtyErrorTimer = useRef(null);

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [orderConfirmation, setOrderConfirmation] = useState(null); // { orderId, subtotal, itemCount }

  const handleQtyChange = async (productId, newQty) => {
    try {
      await updateQty(productId, newQty);
    } catch (err) {
      setQtyError({ productId, message: err.message });
      clearTimeout(qtyErrorTimer.current);
      qtyErrorTimer.current = setTimeout(() => setQtyError(null), 3000);
    }
  };

  const handleCheckout = async () => {
    if (checkingOut) return;
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const order = await checkout();
      setOrderConfirmation(order);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (orderConfirmation) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
        <div className="text-center py-16 px-5 bg-white border border-border rounded-2xl max-w-[480px] mx-auto">
          <span className="w-16 h-16 rounded-full bg-green inline-flex items-center justify-center mb-5 shadow-[0_12px_30px_rgba(14,90,70,0.3)]">
            <IconCheck width="28" height="28" className="text-white" strokeWidth="2.6" />
          </span>
          <h1 className="font-display text-2xl font-bold text-ink mb-2 tracking-tight">Order placed!</h1>
          <p className="text-[15px] text-text mb-1 leading-relaxed">
            Order <strong className="text-ink-soft">{orderConfirmation.orderId}</strong> is confirmed —{' '}
            {orderConfirmation.itemCount} item{orderConfirmation.itemCount === 1 ? '' : 's'} for{' '}
            <strong className="text-green">{formatPKR(orderConfirmation.subtotal)}</strong>.
          </p>
          <p className="text-sm text-text-muted mb-6">Sellers will confirm and ship via secure escrow.</p>
          <Link
            to="/"
            className="cursor-pointer inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-[26px] py-3 rounded-full no-underline transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20">
        <h1 className="font-display text-[28px] font-bold m-0 mb-8 tracking-tight">Your Cart</h1>
        <div className="flex flex-col gap-4 max-w-[720px]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 bg-white border border-border rounded-2xl p-4">
              <div className="w-20 h-20 rounded-xl bg-surface-muted shrink-0" />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div className="h-4 bg-surface-muted rounded w-2/3" />
                <div className="h-3 bg-surface-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
        <h1 className="font-display text-[28px] font-bold m-0 mb-8 tracking-tight">Your Cart</h1>
        <div className="text-center py-16 px-5 bg-white border border-dashed border-border-strong rounded-2xl max-w-[480px] mx-auto">
          <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-5">
            <IconCart width="24" height="24" className="text-green" />
          </span>
          <p className="text-[15px] text-text mb-6">Your cart is empty. Browse the marketplace to find products.</p>
          <Link
            to="/"
            className="cursor-pointer inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-[26px] py-3 rounded-full no-underline transition-colors"
          >
            Browse marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">Your Cart</h1>
      <p className="text-sm text-text-muted mb-7">{items.length} product{items.length > 1 ? 's' : ''} in cart</p>

      <div className="grid gap-9 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' }}>
        {/* Items */}
        <div className="flex flex-col gap-4">
          {items.map(({ product, qty }) => {
            const lineTotal = parsePrice(product.price) * qty;
            return (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-border rounded-2xl p-4 sm:p-5"
              >
                {/* Image + product details */}
                <div className="flex gap-4 sm:flex-1 min-w-0">
                  <Link to={`/product/${product.id}`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0">
                    <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <Link
                      to={`/product/${product.id}`}
                      className="text-[15px] font-semibold text-ink no-underline hover:underline line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    <div className="text-[12.5px] text-text-muted mt-1">{product.seller}</div>
                    <div className="text-[13px] text-text-muted mt-1.5">
                      {product.price} <span>/{product.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity selector + line total — indented to align under the product text on
                    mobile (stacked), sits inline at the end of the row on sm+ (side by side). */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 pl-20 sm:pl-0">
                  <div className="flex items-center gap-2 border border-border rounded-full px-1 py-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(product.id, qty - 1)}
                      aria-label="Decrease quantity"
                      className="cursor-pointer w-7 h-7 rounded-full flex items-center justify-center text-ink hover:bg-surface-muted transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{qty}</span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(product.id, qty + 1)}
                      aria-label="Increase quantity"
                      className="cursor-pointer w-7 h-7 rounded-full flex items-center justify-center text-ink hover:bg-surface-muted transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 sm:min-w-[100px]">
                    <span className="font-display font-bold text-green text-base sm:text-[17px] whitespace-nowrap">
                      {formatPKR(lineTotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      aria-label={`Remove ${product.name} from cart`}
                      className="cursor-pointer text-xs text-text-muted hover:text-orange transition-colors"
                    >
                      Remove
                    </button>
                    {qtyError?.productId === product.id && (
                      <p className="text-[11px] text-orange-text text-right max-w-[140px]">{qtyError.message}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-white border border-border rounded-2xl p-6 sticky top-24">
          <h2 className="font-display text-lg font-bold m-0 mb-5">Order Summary</h2>

          <div className="flex flex-col gap-3 text-sm mb-5">
            <div className="flex justify-between items-center">
              <span className="text-text">Subtotal</span>
              <span className="text-ink font-medium">{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text flex items-center gap-1.5">
                <IconTruck width="13" height="13" className="text-green" />
                Shipping
              </span>
              <span className="text-green font-medium">Free</span>
            </div>
          </div>

          <div className="h-px bg-border mb-5" />

          <div className="flex justify-between items-baseline mb-6">
            <span className="text-sm font-semibold text-ink-soft">Total</span>
            <span className="font-display font-bold text-xl text-green">{formatPKR(subtotal)}</span>
          </div>

          {checkoutError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{checkoutError}</p>}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            className="w-full flex items-center justify-center gap-2 text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 bg-orange hover:bg-orange-hover text-white font-semibold text-[15px] py-[15px] rounded-full shadow-[0_8px_24px_rgba(201,123,45,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0"
          >
            {checkingOut && (
              <span className="w-4 h-4 border-[2.5px] border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {checkingOut ? 'Placing order…' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </main>
  );
}
