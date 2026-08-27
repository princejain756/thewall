(function () {
  const CART_KEY = 'tw_cart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateBadge();
    window.dispatchEvent(new CustomEvent('tw-cart-updated'));
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  function updateBadge() {
    const count = getCartCount();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(count);
      el.classList.toggle('is-visible', count > 0);
    });
  }

  function addToCart(item) {
    const cart = getCart();
    const existing = cart.findIndex(
      (i) =>
        i.productId === item.productId &&
        i.variantId === item.variantId &&
        (i.customImage || '') === (item.customImage || '') &&
        (i.format || '') === (item.format || '') &&
        (i.color || '') === (item.color || ''),
    );
    if (existing >= 0) {
      cart[existing].quantity += item.quantity || 1;
    } else {
      cart.push({ ...item, quantity: item.quantity || 1 });
    }
    saveCart(cart);
    return cart;
  }

  function updateQuantity(index, quantity) {
    const cart = getCart();
    if (quantity < 1) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateBadge();
  }

  function formatPrice(paise) {
    return '₹' + (paise / 100).toFixed(2);
  }

  window.TWCart = {
    getCart,
    saveCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartCount,
    updateBadge,
    formatPrice,
  };

  document.addEventListener('DOMContentLoaded', updateBadge);
  window.addEventListener('storage', updateBadge);
})();
