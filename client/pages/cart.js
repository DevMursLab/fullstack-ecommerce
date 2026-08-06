// Cart page.

async function renderCart() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <section class="page-section">
      <div class="container">
        <div class="section-heading" style="text-align:left;margin-bottom:var(--space-6);">
          <h2>Your Cart</h2>
        </div>
        <div id="cart-page-body"></div>
      </div>
    </section>
  `;

  renderCartPageBody();
}

function renderCartPageBody() {
  const container = document.getElementById('cart-page-body');
  if (!container) return;

  if (!STATE.cart.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛍️</div>
        <p>Your cart is empty.</p>
        <a href="#/shop" class="btn btn-primary mt-4">Continue Shopping</a>
      </div>
    `;
    return;
  }

  const subtotal = getCartSubtotal();
  const threshold = CONFIG.FREE_SHIPPING_THRESHOLD;
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
  const remaining = Math.max(0, threshold - subtotal);

  const totals = typeof getCheckoutTotals === 'function' ? getCheckoutTotals() : {
    subtotal, discount: 0, shipping: getShippingCost(0), tax: 0, total: subtotal + getShippingCost(0)
  };

  container.innerHTML = `
    <div class="cart-page-layout" style="display:grid;grid-template-columns:1fr 360px;gap:var(--space-8);align-items:start;">
      <div>
        <div class="free-ship-bar">
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
          <p>${remaining > 0 ? `Add ${formatMoney(remaining)} more for free shipping!` : 'You qualify for free shipping!'}</p>
        </div>
        <div id="cart-items-list" class="mt-6"></div>
      </div>
      <aside class="wizard-summary">
        <h3>Order Summary</h3>
        <div class="form-group mt-4">
          <label class="form-label">Coupon Code</label>
          <div class="flex gap-2">
            <input type="text" id="cart-coupon-input" placeholder="Enter code" value="${STATE.checkout.couponCode || ''}">
            <button class="btn btn-outline" id="cart-apply-coupon">Apply</button>
          </div>
          <p id="cart-coupon-msg" class="mt-2" style="font-size:.85rem;"></p>
        </div>
        <div class="summary-line"><span>Subtotal</span><span>${formatMoney(totals.subtotal)}</span></div>
        ${totals.discount ? `<div class="summary-line"><span>Discount</span><span>-${formatMoney(totals.discount)}</span></div>` : ''}
        <div class="summary-line"><span>Shipping</span><span>${totals.shipping === 0 ? 'Free' : formatMoney(totals.shipping)}</span></div>
        ${totals.tax ? `<div class="summary-line"><span>Tax</span><span>${formatMoney(totals.tax)}</span></div>` : ''}
        <div class="summary-line total"><span>Total</span><span>${formatMoney(totals.total)}</span></div>
        <a href="#/checkout" class="btn btn-primary btn-block mt-4">Proceed to Checkout</a>
        <a href="#/shop" class="btn btn-outline btn-block mt-2">Continue Shopping</a>
      </aside>
    </div>
  `;

  renderCartItemsList();

  document.getElementById('cart-apply-coupon').addEventListener('click', async () => {
    const code = document.getElementById('cart-coupon-input').value.trim();
    const msgEl = document.getElementById('cart-coupon-msg');
    if (!code) { msgEl.textContent = 'Enter a coupon code.'; msgEl.style.color = 'var(--color-error)'; return; }

    const res = await validateCartCoupon(code);
    if (res.success) {
      msgEl.textContent = `Coupon applied! You saved ${formatMoney(res.discount)}.`;
      msgEl.style.color = 'var(--color-success)';
    } else {
      msgEl.textContent = res.message || 'Invalid coupon.';
      msgEl.style.color = 'var(--color-error)';
    }
    renderCartPageBody();
  });
}

function renderCartItemsList() {
  const list = document.getElementById('cart-items-list');
  if (!list) return;
  list.innerHTML = STATE.cart.map(item => `
    <div class="cart-item" style="display:flex;gap:var(--space-3);padding:var(--space-4) 0;border-bottom:1px solid var(--color-border);">
      <div class="cart-item-img" style="width:80px;height:80px;border-radius:var(--radius-md);background:var(--color-border);overflow:hidden;flex-shrink:0;">
        <img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
      </div>
      <div class="flex-1">
        <strong>${item.name}</strong>
        <p class="text-muted" style="font-size:.85rem;">${item.variantName}</p>
        <div class="flex items-center gap-4 mt-2">
          <div class="qty-stepper">
            <button data-action="dec" data-key="${item.key}">−</button>
            <span>${item.qty}</span>
            <button data-action="inc" data-key="${item.key}">+</button>
          </div>
          <button data-action="remove" data-key="${item.key}" style="color:var(--color-error);font-size:.85rem;">Remove</button>
        </div>
      </div>
      <strong>${formatMoney(item.price * item.qty)}</strong>
    </div>
  `).join('');

  list.querySelectorAll('[data-action="inc"]').forEach(btn => btn.addEventListener('click', () => {
    const item = STATE.cart.find(i => i.key === btn.dataset.key);
    if (item) updateCartQty(btn.dataset.key, item.qty + 1);
    renderCartPageBody();
    if (typeof renderHeader === 'function') renderHeader();
  }));
  list.querySelectorAll('[data-action="dec"]').forEach(btn => btn.addEventListener('click', () => {
    const item = STATE.cart.find(i => i.key === btn.dataset.key);
    if (item) updateCartQty(btn.dataset.key, item.qty - 1);
    renderCartPageBody();
    if (typeof renderHeader === 'function') renderHeader();
  }));
  list.querySelectorAll('[data-action="remove"]').forEach(btn => btn.addEventListener('click', () => {
    removeFromCart(btn.dataset.key);
    renderCartPageBody();
    if (typeof renderHeader === 'function') renderHeader();
  }));
}
