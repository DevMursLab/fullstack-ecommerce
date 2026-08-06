// Shell rendering: header, footer, cart drawer, menu drawer, toasts, modal.

function showToast(message, type) {
  type = type || 'success';
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = createEl('div', { class: 'toast toast-' + type, html: message });
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function showLoader() { setLoading(true); }
function hideLoader() { setLoading(false); }

function openModal(content) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = '';
  const overlay = createEl('div', { class: 'modal-overlay', onclick: (e) => { if (e.target === overlay) closeModal(); } });
  const modal = createEl('div', { class: 'modal' });
  if (typeof content === 'string') modal.innerHTML = content;
  else if (content instanceof Node) modal.appendChild(content);
  overlay.appendChild(modal);
  root.appendChild(overlay);
  const closeBtns = qsa('.modal-close', modal);
  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
  STATE.ui.modalContent = true;
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  STATE.ui.modalContent = null;
}

function renderHeader() {
  let header = qs('.site-header');
  const isNew = !header;
  if (isNew) {
    header = createEl('header', { class: 'site-header' });
  }

  const cartCount = getCartItemCount();
  const loggedIn = STATE.isLoggedIn;
  const isAdmin = loggedIn && STATE.user && STATE.user.role === 'admin';

  header.innerHTML = `
    <div class="header-inner">
      <a href="#/" class="logo">${CONFIG.APP_NAME}</a>
      <nav class="main-nav">
        <a href="#/" class="nav-link" data-path="/">Home</a>
        <a href="#/services" class="nav-link" data-path="/services">Services</a>
        <a href="#/team" class="nav-link" data-path="/team">Team</a>
        <a href="#/shop" class="nav-link" data-path="/shop">Shop</a>
        <a href="#/about" class="nav-link" data-path="/about">About</a>
      </nav>
      <div class="header-actions">
        <button class="icon-btn" id="btn-cart" aria-label="Cart">
          🛍️ <span class="cart-badge">${cartCount}</span>
        </button>
        ${loggedIn
          ? `<a href="#/account" class="nav-link">${STATE.user && STATE.user.name ? STATE.user.name.split(' ')[0] : 'Account'}</a>`
          : `<a href="#/login" class="nav-link">Login</a>`}
        ${isAdmin ? `<a href="#/admin" class="btn btn-sm btn-outline">Admin</a>` : ''}
        <a href="#/book" class="btn btn-sm btn-primary">Book Now</a>
        <button class="icon-btn" id="btn-menu-toggle" aria-label="Menu">☰</button>
      </div>
    </div>
  `;

  if (isNew) {
    const app = document.getElementById('app');
    app.insertBefore(header, app.firstChild);
  }

  const cartBtn = qs('#btn-cart', header);
  if (cartBtn) cartBtn.addEventListener('click', () => openCartDrawer());
  const menuBtn = qs('#btn-menu-toggle', header);
  if (menuBtn) menuBtn.addEventListener('click', () => toggleMenuDrawer());
}

function renderFooter() {
  let footer = qs('.site-footer');
  if (footer) return; // static, render once
  footer = createEl('footer', { class: 'site-footer' });
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-col">
        <div class="logo">${CONFIG.APP_NAME}</div>
        <p>Premium salon &amp; spa experiences, curated beauty products, and a team that cares.</p>
      </div>
      <div class="footer-col">
        <h4>Explore</h4>
        <a href="#/services">Services</a>
        <a href="#/team">Our Team</a>
        <a href="#/shop">Shop</a>
        <a href="#/about">About Us</a>
      </div>
      <div class="footer-col">
        <h4>Account</h4>
        <a href="#/account">My Account</a>
        <a href="#/book">Book an Appointment</a>
        <a href="#/cart">Cart</a>
      </div>
      <div class="footer-col">
        <h4>Visit Us</h4>
        <p>House 12, Road 5, Banani<br>Dhaka 1213, Bangladesh</p>
        <p>Open Daily 9:00 AM – 9:00 PM</p>
        <div class="social-links">
          <a href="#" aria-label="Facebook">FB</a>
          <a href="#" aria-label="Instagram">IG</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      &copy; ${new Date().getFullYear()} ${CONFIG.APP_NAME}. All rights reserved.
    </div>
  `;
  document.getElementById('app').appendChild(footer);
}

function cartDrawerItemHtml(item) {
  return `
    <div class="cart-drawer-item" data-key="${item.key}">
      <img src="${item.image}" alt="${item.name}" onerror="this.style.opacity=0">
      <div class="cart-drawer-item-info">
        <div class="name">${item.name}</div>
        <div class="variant">${item.variantName}</div>
        <div class="qty-control">
          <button class="btn-icon qty-dec" data-key="${item.key}">−</button>
          <span>${item.qty}</span>
          <button class="btn-icon qty-inc" data-key="${item.key}">+</button>
        </div>
      </div>
      <div class="cart-drawer-item-price">${formatMoney(item.price * item.qty)}</div>
      <button class="remove-item" data-key="${item.key}" aria-label="Remove">✕</button>
    </div>
  `;
}

function renderCartDrawer() {
  let drawer = qs('.cart-drawer');
  let overlay = qs('.cart-drawer-overlay');
  if (!drawer) {
    drawer = createEl('div', { class: 'cart-drawer' });
    document.body.appendChild(drawer);
  }
  if (!overlay) {
    overlay = createEl('div', { class: 'cart-drawer-overlay', onclick: () => closeCartDrawer() });
    document.body.appendChild(overlay);
  }

  const items = STATE.cart;
  const subtotal = getCartSubtotal();
  const threshold = CONFIG.FREE_SHIPPING_THRESHOLD;
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
  const remaining = Math.max(0, threshold - subtotal);

  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <h3>Your Cart (${getCartItemCount()})</h3>
      <button class="modal-close" id="cart-drawer-close" aria-label="Close">✕</button>
    </div>
    <div class="free-ship-bar">
      <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
      <p>${remaining > 0 ? `Add ${formatMoney(remaining)} more for free shipping!` : 'You qualify for free shipping!'}</p>
    </div>
    <div class="cart-drawer-items">
      ${items.length ? items.map(cartDrawerItemHtml).join('') : '<div class="empty-state"><p>Your cart is empty.</p></div>'}
    </div>
    <div class="cart-drawer-footer">
      <div class="cart-subtotal-row">
        <span>Subtotal</span>
        <span>${formatMoney(subtotal)}</span>
      </div>
      <a href="#/cart" class="btn btn-outline btn-block" id="cart-drawer-view">View Cart</a>
      <a href="#/checkout" class="btn btn-primary btn-block" id="cart-drawer-checkout">Checkout</a>
    </div>
  `;

  drawer.classList.toggle('open', STATE.ui.cartDrawerOpen);
  overlay.classList.toggle('open', STATE.ui.cartDrawerOpen);

  const closeBtn = qs('#cart-drawer-close', drawer);
  if (closeBtn) closeBtn.addEventListener('click', () => closeCartDrawer());
  qsa('.qty-inc', drawer).forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.key;
    const item = STATE.cart.find(i => i.key === key);
    if (item) updateCartQty(key, item.qty + 1);
    renderCartDrawer();
    renderHeader();
  }));
  qsa('.qty-dec', drawer).forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.key;
    const item = STATE.cart.find(i => i.key === key);
    if (item) updateCartQty(key, item.qty - 1);
    renderCartDrawer();
    renderHeader();
  }));
  qsa('.remove-item', drawer).forEach(btn => btn.addEventListener('click', () => {
    removeFromCart(btn.dataset.key);
    renderCartDrawer();
    renderHeader();
  }));
  const viewBtn = qs('#cart-drawer-view', drawer);
  if (viewBtn) viewBtn.addEventListener('click', () => closeCartDrawer());
  const checkoutBtn = qs('#cart-drawer-checkout', drawer);
  if (checkoutBtn) checkoutBtn.addEventListener('click', () => closeCartDrawer());
}

function renderMenuDrawer() {
  let drawer = qs('.menu-drawer');
  let overlay = qs('.menu-drawer-overlay');
  if (!drawer) {
    drawer = createEl('div', { class: 'menu-drawer' });
    document.body.appendChild(drawer);
  }
  if (!overlay) {
    overlay = createEl('div', { class: 'menu-drawer-overlay', onclick: () => toggleMenuDrawer() });
    document.body.appendChild(overlay);
  }
  drawer.innerHTML = `
    <div class="header-inner">
      <div class="logo">${CONFIG.APP_NAME}</div>
      <button class="modal-close" id="menu-drawer-close" aria-label="Close">✕</button>
    </div>
    <nav class="main-nav" style="flex-direction:column;align-items:flex-start;gap:1rem;padding:1rem;">
      <a href="#/" class="nav-link">Home</a>
      <a href="#/services" class="nav-link">Services</a>
      <a href="#/team" class="nav-link">Team</a>
      <a href="#/shop" class="nav-link">Shop</a>
      <a href="#/about" class="nav-link">About</a>
      <a href="#/account" class="nav-link">Account</a>
      <a href="#/book" class="btn btn-primary btn-block">Book Now</a>
    </nav>
  `;
  const closeBtn = qs('#menu-drawer-close', drawer);
  if (closeBtn) closeBtn.addEventListener('click', () => toggleMenuDrawer());
  qsa('a', drawer).forEach(a => a.addEventListener('click', () => {
    if (STATE.ui.menuDrawerOpen) toggleMenuDrawer();
  }));
}

function _pageRoot() {
  return document.getElementById('page-root');
}

function renderShell() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  renderHeader();
  const main = createEl('main', { id: 'page-root' });
  app.appendChild(main);
  renderFooter();
  renderMenuDrawer();
  renderCartDrawer();
}
