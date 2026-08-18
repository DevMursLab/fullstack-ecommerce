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
      <div class="empty-state cart-empty-state">
        <div class="empty-state-icon cart-empty-icon">🛍️</div>
        <h3>Your cart is empty</h3>
        <p class="text-muted mt-2">Looks like you haven't added anything yet. Explore our salon-grade haircare, skincare, nailcare &amp; tools.</p>
        <a href="#/shop" class="btn btn-shop btn-lg mt-6">Start Shopping</a>
      </div>
    `;
    return;
  }

  const subtotal = getCartSubtotal();
  const threshold = CONFIG.FREE_SHIPPING_THRESHOLD;
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
  const remaining = Math.max(0, threshold - subtotal);
  const qualifies = remaining === 0;
  const itemCount = STATE.cart.reduce((sum, i) => sum + i.qty, 0);

  const totals = typeof getCheckoutTotals === 'function' ? getCheckoutTotals() : {
    subtotal, discount: 0, shipping: getShippingCost(0), tax: 0, total: subtotal + getShippingCost(0)
  };

  container.innerHTML = `
    <div class="cart-page-layout">
      <div>
        <div class="free-ship-bar ${qualifies ? 'qualified' : ''}">
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
          <p>${qualifies ? '✓ You’ve unlocked free shipping!' : `🚚 Add ${formatMoney(remaining)} more for free shipping!`}</p>
        </div>
        <div class="cart-items-header">
          <h3>${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart</h3>
        </div>
        <div id="cart-items-list" class="mt-3"></div>
      </div>
      <aside class="cart-summary-card">
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
        ${totals.discount ? `<div class="summary-line summary-discount"><span>Discount</span><span>-${formatMoney(totals.discount)}</span></div>` : ''}
        <div class="summary-line"><span>Shipping</span><span>${totals.shipping === 0 ? 'Free' : formatMoney(totals.shipping)}</span></div>
        ${totals.tax ? `<div class="summary-line"><span>Tax</span><span>${formatMoney(totals.tax)}</span></div>` : ''}
        <div class="summary-line total cart-total-line"><span>Total</span><span>${formatMoney(totals.total)}</span></div>
        <a href="#/checkout" class="btn btn-shop btn-lg btn-block mt-4">Proceed to Checkout →</a>
        <a href="#/shop" class="btn btn-outline btn-block mt-2">Continue Shopping</a>
        <div class="cart-trust-row">
          <span>🔒 Secure checkout</span>
          <span>💳 Powered by Stripe</span>
        </div>
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
    <div class="cart-item-row">
      <a class="cart-item-img" href="#/product/${item.productId}">
        <img src="${item.image}" alt="${escapeHtml(item.name)}" onerror="this.parentElement.innerHTML='<div class=&quot;placeholder-icon&quot;>🛍️</div>'">
      </a>
      <div class="cart-item-info">
        <a href="#/product/${item.productId}" class="cart-item-name">${escapeHtml(item.name)}</a>
        <p class="cart-item-variant">${escapeHtml(item.variantName || '')}</p>
        <div class="cart-item-controls">
          <div class="qty-stepper">
            <button data-action="dec" data-key="${item.key}" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button data-action="inc" data-key="${item.key}" aria-label="Increase quantity">+</button>
          </div>
          <button class="cart-item-remove" data-action="remove" data-key="${item.key}">Remove</button>
        </div>
      </div>
      <div class="cart-item-total">
        <strong>${formatMoney(item.price * item.qty)}</strong>
        ${item.qty > 1 ? `<span class="cart-item-unit-price">${formatMoney(item.price)} each</span>` : ''}
      </div>
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
