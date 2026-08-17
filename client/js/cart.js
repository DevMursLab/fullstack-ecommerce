// Cart-facing helper functions used by pages/cart.js and the cart drawer.
// renderCartDrawer() itself lives in ui.js (built alongside the rest of the shell).

function getFreeShippingProgress() {
  const subtotal = getCartSubtotal();
  const threshold = CONFIG.FREE_SHIPPING_THRESHOLD;
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100));
  const remaining = Math.max(0, threshold - subtotal);
  return { subtotal, threshold, percent, remaining, qualifies: remaining === 0 };
}

function freeShippingBarHtml() {
  const p = getFreeShippingProgress();
  return `
    <div class="free-ship-bar">
      <div class="progress-bar"><div class="progress-bar-fill" style="width:${p.percent}%"></div></div>
      <p>${p.qualifies ? 'You qualify for free shipping!' : `Add ${formatMoney(p.remaining)} more for free shipping!`}</p>
    </div>
  `;
}

function incrementCartItem(key) {
  const item = STATE.cart.find(i => i.key === key);
  if (!item) return;
  updateCartQty(key, Math.min(item.qty + 1, item.stock || Infinity));
}

function decrementCartItem(key) {
  const item = STATE.cart.find(i => i.key === key);
  if (!item) return;
  updateCartQty(key, item.qty - 1);
}

async function validateCartCoupon(code) {
  if (!code) return { success: false, message: 'Enter a coupon code' };
  const subtotal = getCartSubtotal();
  const res = await api.post('/coupons/validate', { code, appliesTo: 'order', subtotal, userId: STATE.user && STATE.user._id });
  if (res && res.success) {
    const discount = res.discount || 0;
    applyCheckoutCoupon(code, discount);
    return { success: true, discount };
  }
  const coupon = (typeof MOCK_COUPONS !== 'undefined' ? MOCK_COUPONS : []).find(c => c.code === code && c.isActive);
  if (coupon && (!coupon.minSpend || subtotal >= coupon.minSpend)) {
    const discount = coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : coupon.value;
    applyCheckoutCoupon(code, discount);
    return { success: true, discount };
  }
  return { success: false, message: (res && res.message) || 'Invalid coupon' };
}

async function placeOrder() {
  const totals = getCheckoutTotals();
  const payload = {
    items: STATE.cart.map(item => ({
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.qty
    })),
    shippingAddress: STATE.checkout.shippingAddress,
    couponCode: STATE.checkout.couponCode,
    discount: totals.discount,
    tax: totals.tax
  };
  const res = await api.post('/orders', payload);
  if (res && res.success) {
    STATE.lastOrderNumber = res.order && (res.order.orderNumber || res.order._id);
    return { success: true, order: res.order };
  }
  return { success: false, message: res.message };
}

function addProductToCart(product, variantName, qty = 1) {
  const variant = (product.variants || []).find(v => v.name === variantName) || (product.variants || [])[0];
  if (!variant) {
    showToast('This product has no available variant.', 'error');
    return false;
  }
  if (variant.stock <= 0) {
    showToast('This item is out of stock.', 'error');
    return false;
  }
  addToCart(product, variant, qty);
  const key = cartKey(product._id, variant.name);
  const cartItem = STATE.cart.find(i => i.key === key);
  if (cartItem) cartItem.variantId = variant._id || null;
  if (typeof renderHeader === 'function') renderHeader();
  if (typeof openCartDrawer === 'function') openCartDrawer();
  showToast(`${product.name} added to cart.`, 'success');
  return true;
}
