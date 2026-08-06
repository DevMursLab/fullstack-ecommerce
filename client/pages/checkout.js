// Checkout page — 3-step flow.

async function renderCheckout() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  if (!STATE.cart.length) {
    showToast('Your cart is empty.', 'error');
    location.hash = '#/cart';
    return;
  }

  setCheckoutStep(1);

  root.innerHTML = `
    <section class="page-section">
      <div class="container">
        <div class="step-indicator" id="checkout-steps"></div>
        <div class="wizard-layout">
          <div class="wizard-content" id="checkout-content"></div>
          <aside class="wizard-summary" id="checkout-summary"></aside>
        </div>
      </div>
    </section>
  `;

  renderCheckoutFlow();
}

function renderCheckoutFlow() {
  renderCheckoutSteps();
  renderCheckoutStepContent();
  renderCheckoutSummary();
}

function renderCheckoutSteps() {
  const el = document.getElementById('checkout-steps');
  if (!el) return;
  const labels = ['Shipping', 'Delivery', 'Payment'];
  const step = STATE.checkout.step;
  el.innerHTML = labels.map((label, i) => {
    const n = i + 1;
    const cls = n < step ? 'done' : n === step ? 'active' : '';
    return `
      <div class="step-dot">
        <div class="step-circle ${cls}" data-step="${n}">${n < step ? '✓' : n}</div>
      </div>
      ${i < labels.length - 1 ? `<div class="step-line ${n < step ? 'done' : ''}"></div>` : ''}
    `;
  }).join('');

  el.querySelectorAll('.step-circle.done').forEach(circle => circle.addEventListener('click', () => {
    setCheckoutStep(Number(circle.dataset.step));
    renderCheckoutFlow();
  }));
}

function renderCheckoutSummary() {
  const el = document.getElementById('checkout-summary');
  if (!el) return;
  const totals = getCheckoutTotals();
  el.innerHTML = `
    <h3>Order Summary</h3>
    <div class="mt-4">
      ${STATE.cart.map(item => `<div class="summary-line"><span>${item.name} × ${item.qty}</span><span>${formatMoney(item.price * item.qty)}</span></div>`).join('')}
    </div>
    <div class="summary-line"><span>Subtotal</span><span>${formatMoney(totals.subtotal)}</span></div>
    ${totals.discount ? `<div class="summary-line"><span>Discount</span><span>-${formatMoney(totals.discount)}</span></div>` : ''}
    <div class="summary-line"><span>Shipping</span><span>${totals.shipping === 0 ? 'Free' : formatMoney(totals.shipping)}</span></div>
    ${totals.tax ? `<div class="summary-line"><span>Tax</span><span>${formatMoney(totals.tax)}</span></div>` : ''}
    <div class="summary-line total"><span>Total</span><span>${formatMoney(totals.total)}</span></div>
  `;
}

function renderCheckoutStepContent() {
  const el = document.getElementById('checkout-content');
  if (!el) return;
  const step = STATE.checkout.step;
  if (step === 1) return renderCheckoutStep1(el);
  if (step === 2) return renderCheckoutStep2(el);
  if (step === 3) return renderCheckoutStep3(el);
}

function renderCheckoutStep1(el) {
  const addr = STATE.checkout.shippingAddress || {};
  const userAddresses = (STATE.user && STATE.user.addresses) || [];

  el.innerHTML = `
    <h2>Shipping Address</h2>
    ${userAddresses.length ? `
      <div class="form-group mt-4">
        <label class="form-label">Use a saved address</label>
        <select id="saved-address-select">
          <option value="">-- New address --</option>
          ${userAddresses.map((a, i) => `<option value="${i}">${a.label || a.street}</option>`).join('')}
        </select>
      </div>
    ` : ''}
    <div class="form-row mt-4">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" id="addr-name" value="${addr.name || (STATE.user ? STATE.user.name : '') || ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input type="tel" id="addr-phone" value="${addr.phone || (STATE.user ? STATE.user.phone : '') || ''}" required>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Street Address</label>
      <input type="text" id="addr-street" value="${addr.street || ''}" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">City</label>
        <input type="text" id="addr-city" value="${addr.city || ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Postal Code</label>
        <input type="text" id="addr-zip" value="${addr.zip || ''}">
      </div>
    </div>
    <button class="btn btn-primary btn-lg mt-4" id="checkout-s1-next">Continue to Delivery</button>
  `;

  const savedSelect = document.getElementById('saved-address-select');
  if (savedSelect) savedSelect.addEventListener('change', () => {
    if (savedSelect.value === '') return;
    const a = userAddresses[Number(savedSelect.value)];
    document.getElementById('addr-name').value = a.name || '';
    document.getElementById('addr-phone').value = a.phone || '';
    document.getElementById('addr-street').value = a.street || '';
    document.getElementById('addr-city').value = a.city || '';
    document.getElementById('addr-zip').value = a.zip || '';
  });

  document.getElementById('checkout-s1-next').addEventListener('click', () => {
    const name = document.getElementById('addr-name').value.trim();
    const phone = document.getElementById('addr-phone').value.trim();
    const street = document.getElementById('addr-street').value.trim();
    const city = document.getElementById('addr-city').value.trim();
    const zip = document.getElementById('addr-zip').value.trim();
    if (!name || !phone || !street || !city) {
      showToast('Please fill in all required address fields.', 'error');
      return;
    }
    setShippingAddress({ name, phone, street, city, zip });
    setCheckoutStep(2);
    renderCheckoutFlow();
  });
}

function renderCheckoutStep2(el) {
  el.innerHTML = `
    <h2>Delivery Method</h2>
    <label class="option-card mt-4 ${STATE.checkout.shippingMethod === 'standard' ? 'selected' : ''}" data-method="standard">
      <input type="radio" name="shipmethod" ${STATE.checkout.shippingMethod === 'standard' ? 'checked' : ''}>
      <div><strong>Standard Delivery</strong><p class="text-muted" style="font-size:.85rem;">3-5 business days</p></div>
    </label>
    <label class="option-card mt-2 ${STATE.checkout.shippingMethod === 'express' ? 'selected' : ''}" data-method="express">
      <input type="radio" name="shipmethod" ${STATE.checkout.shippingMethod === 'express' ? 'checked' : ''}>
      <div><strong>Express Delivery</strong><p class="text-muted" style="font-size:.85rem;">1-2 business days (+${formatMoney(100)})</p></div>
    </label>
    <div class="flex gap-3 mt-6">
      <button class="btn btn-outline" id="checkout-s2-back">Back</button>
      <button class="btn btn-primary" id="checkout-s2-next">Continue to Payment</button>
    </div>
  `;

  el.querySelectorAll('[data-method]').forEach(opt => opt.addEventListener('click', () => {
    setShippingMethod(opt.dataset.method);
    el.querySelectorAll('[data-method]').forEach(o => { o.classList.remove('selected'); o.querySelector('input').checked = false; });
    opt.classList.add('selected');
    opt.querySelector('input').checked = true;
    renderCheckoutSummary();
  }));

  document.getElementById('checkout-s2-back').addEventListener('click', () => { setCheckoutStep(1); renderCheckoutFlow(); });
  document.getElementById('checkout-s2-next').addEventListener('click', () => { setCheckoutStep(3); renderCheckoutFlow(); });
}

function renderCheckoutStep3(el) {
  const totals = getCheckoutTotals();
  el.innerHTML = `
    <h2>Review &amp; Payment</h2>
    <div class="card mt-4" style="padding:var(--space-5);">
      <h4>Shipping To</h4>
      <p class="mt-2">${STATE.checkout.shippingAddress ? `${STATE.checkout.shippingAddress.name}, ${STATE.checkout.shippingAddress.street}, ${STATE.checkout.shippingAddress.city}` : ''}</p>
      <p class="text-muted mt-1">${STATE.checkout.shippingAddress ? STATE.checkout.shippingAddress.phone : ''}</p>
    </div>
    <div id="checkout-payment-panel" class="mt-6">
      <div id="stripe-checkout-card" class="card" style="padding:var(--space-4);"></div>
      <p id="checkout-card-error" class="form-error mt-2"></p>
    </div>
    <div class="flex gap-3 mt-6">
      <button class="btn btn-outline" id="checkout-s3-back">Back</button>
      <button class="btn btn-primary btn-lg" id="checkout-confirm-btn">Place Order — ${formatMoney(totals.total)}</button>
    </div>
  `;

  if (typeof mountCardElement === 'function') {
    try { mountCardElement('stripe-checkout-card'); } catch (e) { console.warn('Stripe mount skipped', e); }
  }

  document.getElementById('checkout-s3-back').addEventListener('click', () => { setCheckoutStep(2); renderCheckoutFlow(); });

  document.getElementById('checkout-confirm-btn').addEventListener('click', async () => {
    const btn = document.getElementById('checkout-confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    let orderResult;
    if (typeof placeOrder === 'function') {
      orderResult = await placeOrder();
    } else {
      const payload = {
        items: STATE.cart.map(item => ({ productId: item.productId, name: item.name, variantName: item.variantName, price: item.price, quantity: item.qty })),
        shippingAddress: STATE.checkout.shippingAddress,
        shippingMethod: STATE.checkout.shippingMethod,
        couponCode: STATE.checkout.couponCode,
        ...totals
      };
      const res = await api.post('/orders', payload);
      orderResult = res.success ? { success: true, order: res.data } : { success: false, message: res.message };
    }

    if (!orderResult.success) {
      showToast(orderResult.message || 'Could not place order.', 'error');
      btn.disabled = false;
      btn.textContent = `Place Order — ${formatMoney(totals.total)}`;
      return;
    }

    if (typeof processPayment === 'function') {
      const orderId = (orderResult.order && (orderResult.order._id || orderResult.order.orderNumber)) || STATE.lastOrderNumber;
      await processPayment({ type: 'order', referenceId: orderId });
    }

    STATE.lastOrderNumber = (orderResult.order && (orderResult.order.orderNumber || orderResult.order._id)) || STATE.lastOrderNumber;
    sessionStorage.setItem('lastOrderNumber', STATE.lastOrderNumber || '');
    sessionStorage.setItem('lastOrderSummary', JSON.stringify({
      items: STATE.cart.map(i => ({ name: i.name, qty: i.qty })),
      total: totals.total
    }));

    clearCart();
    if (typeof renderHeader === 'function') renderHeader();
    location.hash = '#/order/success';
  });
}
