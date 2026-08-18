import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { cartApi } from '../lib/api';
import { useNotifications } from './NotificationsContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { notify } = useNotifications();
  const [items, setItems] = useState([]); // [{ product, qty }]
  const [subtotal, setSubtotal] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyResponse = (data) => {
    setItems(data.items);
    setSubtotal(data.subtotal);
    setCount(data.count);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await cartApi.get();
        if (!cancelled) applyResponse(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = useCallback(async (product, qty = 1) => {
    const data = await cartApi.addItem(product.id, qty);
    applyResponse(data);
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const data = await cartApi.removeItem(productId);
    applyResponse(data);
  }, []);

  const updateQty = useCallback(async (productId, qty) => {
    const data = qty <= 0 ? await cartApi.removeItem(productId) : await cartApi.updateItem(productId, qty);
    applyResponse(data);
  }, []);

  const clearCart = useCallback(async () => {
    const data = await cartApi.clear();
    applyResponse(data);
  }, []);

  // No real payment step — this places a mock order and empties the cart. The order
  // confirmation (id/total/item count) is returned so the caller can display it.
  const checkout = useCallback(async () => {
    const order = await cartApi.checkout();
    setItems([]);
    setSubtotal(0);
    setCount(0);
    notify(
      'orders',
      'Order placed',
      `Order ${order.orderId} for ${order.itemCount} item${order.itemCount === 1 ? '' : 's'} has been placed successfully.`
    );
    return order;
  }, [notify]);

  const value = { items, addToCart, removeFromCart, updateQty, clearCart, checkout, count, subtotal, loading, error };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
