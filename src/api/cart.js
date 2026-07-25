/**
 * Cart API — client-side localStorage cart.
 * All prices in paise (DB format). UI converts to ₹ by dividing by 100.
 */

const CART_KEY = 'nearx_cart';

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: [], storeId: null, storeName: '' };
  } catch {
    return { items: [], storeId: null, storeName: '' };
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart_updated'));
}

/** Get the full cart object. */
export function getCart() {
  return readCart();
}

/**
 * Add a product to cart.
 * If product is from a different store, prompt user to clear cart.
 * @param {object} product - Must have: id, name, store_id, store_name, mrp (paise), sale_price (paise), image_url, expiry_date, discount_percent
 * @param {number} quantity
 * @returns {boolean} true if added, false if user cancelled
 */
export function addToCart(product, quantity = 1) {
  const cart = readCart();

  // We no longer restrict by store_id
  const existing = cart.items.find((i) => i.id === product.id);
  if (existing) {
    cart.items = cart.items.map((i) =>
      i.id === product.id
        ? { ...i, cartQty: Math.min(i.cartQty + quantity, i.stock ?? 99) }
        : i
    );
  } else {
    cart.items.push({ ...product, cartQty: quantity });
  }

  if (!cart.storeId) {
    cart.storeId = product.store_id;
    cart.storeName = product.stores?.name || product.store_name || '';
  }

  writeCart(cart);
  return true;
}

/** Remove a product from cart by product id. */
export function removeFromCart(productId) {
  const cart = readCart();
  cart.items = cart.items.filter((i) => i.id !== productId);
  if (cart.items.length === 0) {
    cart.storeId = null;
    cart.storeName = '';
  }
  writeCart(cart);
}

/** Update quantity of a specific product. Removes if qty <= 0. */
export function updateQuantity(productId, quantity) {
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  const cart = readCart();
  cart.items = cart.items.map((i) =>
    i.id === productId ? { ...i, cartQty: quantity } : i
  );
  writeCart(cart);
}

/** Clear the entire cart. */
export function clearCart() {
  writeCart({ items: [], storeId: null, storeName: '' });
}

/**
 * Calculate cart totals. All values in paise.
 * @returns {{ mrp: number, discounted: number, saved: number, deliveryFee: number, total: number, itemCount: number }}
 */
export function getCartTotal() {
  const cart = readCart();
  let mrp = 0;
  let discounted = 0;

  cart.items.forEach((item) => {
    mrp += (item.mrp || 0) * item.cartQty;
    discounted += (item.sale_price || 0) * item.cartQty;
  });

  const saved = mrp - discounted;
  const deliveryFee = cart.items.length > 0 ? 4000 : 0; // ₹40 in paise
  const uniqueStores = new Set(cart.items.map(i => i.store_id)).size;
  const serviceCharge = uniqueStores > 1 ? 2000 : 0; // ₹20 multi-store fee
  const total = discounted + deliveryFee + serviceCharge;
  const itemCount = cart.items.reduce((sum, i) => sum + i.cartQty, 0);

  return { mrp, discounted, saved, deliveryFee, serviceCharge, total, itemCount };
}
