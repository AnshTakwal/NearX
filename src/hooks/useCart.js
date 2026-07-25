import { useState, useEffect, useCallback } from 'react';
import * as cartApi from '../api/cart';

/**
 * useCart — reactive wrapper around the localStorage cart API.
 * Re-renders whenever the cart changes via storage events or direct calls.
 */
export function useCart() {
  const [cart, setCart] = useState(() => cartApi.getCart());

  // Sync with localStorage changes from other tabs and from same tab
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'nearx_cart') {
        setCart(cartApi.getCart());
      }
    };
    const handleUpdate = () => {
      setCart(cartApi.getCart());
    };
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener('cart_updated', handleUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cart_updated', handleUpdate);
    };
  }, []);

  const refresh = useCallback(() => setCart(cartApi.getCart()), []);

  const addToCart = useCallback(
    (product, quantity = 1) => {
      const result = cartApi.addToCart(product, quantity);
      refresh();
      return result;
    },
    [refresh]
  );

  const removeFromCart = useCallback(
    (productId) => {
      cartApi.removeFromCart(productId);
      refresh();
    },
    [refresh]
  );

  const updateQuantity = useCallback(
    (productId, quantity) => {
      cartApi.updateQuantity(productId, quantity);
      refresh();
    },
    [refresh]
  );

  const clearCart = useCallback(() => {
    cartApi.clearCart();
    refresh();
  }, [refresh]);

  const totals = cartApi.getCartTotal();

  return {
    cartItems: cart.items,
    storeId: cart.storeId,
    storeName: cart.storeName,
    itemCount: totals.itemCount,
    total: totals.total,
    mrp: totals.mrp,
    discounted: totals.discounted,
    saved: totals.saved,
    deliveryFee: totals.deliveryFee,
    serviceCharge: totals.serviceCharge,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refresh,
  };
}
