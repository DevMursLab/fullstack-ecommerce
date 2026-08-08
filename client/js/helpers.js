// Pure utility functions — no side effects.

function formatMoney(amount) {
  const n = Number(amount) || 0;
  const rounded = Math.round(n);
  return CONFIG.CURRENCY_SYMBOL + rounded.toLocaleString('en-US');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function stars(rating) {
  const r = Math.round((Number(rating) || 0) * 2) / 2;
  const full = Math.floor(r);
  const half = r - full === 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  let html = '<span class="stars">';
  for (let i = 0; i < full; i++) html += '★';
  if (half) html += '★';
  for (let i = 0; i < empty; i++) html += '<span class="empty">★</span>';
  html += '</span>';
  return html;
}

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function generateCalendarDays(year, month) {
  // month is 0-indexed
  const days = [];
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toDateStr = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Leading days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    let y = year, m = month - 1;
    if (m < 0) { m = 11; y = year - 1; }
    const dateObj = new Date(y, m, d);
    days.push({ date: d, dateStr: toDateStr(y, m, d), isCurrentMonth: false, isPast: dateObj < today, isToday: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    dateObj.setHours(0, 0, 0, 0);
    days.push({
      date: d, dateStr: toDateStr(year, month, d), isCurrentMonth: true,
      isPast: dateObj < today, isToday: dateObj.getTime() === today.getTime()
    });
  }

  // Trailing days to fill grid to a multiple of 7
  const remainder = days.length % 7;
  if (remainder !== 0) {
    const trailing = 7 - remainder;
    for (let d = 1; d <= trailing; d++) {
      let y = year, m = month + 1;
      if (m > 11) { m = 0; y = year + 1; }
      const dateObj = new Date(y, m, d);
      days.push({ date: d, dateStr: toDateStr(y, m, d), isCurrentMonth: false, isPast: dateObj < today, isToday: false });
    }
  }

  return days;
}

function slugify(str) {
  return String(str).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len).trim() + '…' : str;
}

function qs(selector, root) { return (root || document).querySelector(selector); }
function qsa(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }

function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value);
  }
  (Array.isArray(children) ? children : [children]).forEach(child => {
    if (child == null) return;
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else el.appendChild(child);
  });
  return el;
}

const _escapeHtmlMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (ch) => _escapeHtmlMap[ch]);
}

function getInitials(name) {
  if (!name) return '';
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

/* Shared product card markup — used on Shop grid, Home "Best Sellers", and
   the "Related Products" section on the product detail page. Renders full
   product info (category, name, rating, price, stock, Add to Cart) visibly
   by default, no hover required. */
function productCardHTML(p, opts = {}) {
  const v = (p.variants || [])[0] || {};
  const inStock = v.stock > 0;
  const onSale = !!p.originalPrice && p.originalPrice > v.price;
  const media = p.images && p.images[0]
    ? `<img src="${p.images[0]}" alt="${escapeHtml(p.name)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'placeholder-icon',textContent:'🛍️'}))">`
    : `<div class="placeholder-icon">🛍️</div>`;
  const showQuickView = opts.quickView !== false;

  return `
    <div class="card product-card" data-id="${p._id}">
      ${p.category ? `<span class="product-badge" data-cat="${escapeHtml(p.category)}">${escapeHtml(p.category)}</span>` : ''}
      ${onSale ? `<span class="product-badge sale" style="left:auto;right:var(--space-3);">Sale</span>` : ''}
      <a href="#/product/${p._id}"><div class="card-media">${media}</div></a>
      <div class="card-body">
        ${p.brand ? `<div class="product-brand">${escapeHtml(p.brand)}</div>` : ''}
        <div class="card-title"><a href="#/product/${p._id}">${escapeHtml(p.name)}</a></div>
        <div class="product-rating-row">${stars(p.rating)} <span>${(p.rating || 0).toFixed(1)} (${p.reviewCount || 0})</span></div>
        <div class="card-price">
          ${formatMoney(v.price)}
          ${onSale ? `<span class="old-price">${formatMoney(p.originalPrice)}</span>` : ''}
        </div>
        <div class="stock-note ${inStock ? 'in' : 'out'}">${inStock ? 'In stock' : 'Out of stock'}</div>
        <div class="product-card-actions">
          ${showQuickView ? `<button class="btn btn-outline btn-sm shop-quick-view" data-id="${p._id}">Quick View</button>` : ''}
          <button class="btn btn-primary btn-sm btn-add-cart shop-add-cart" data-id="${p._id}" ${inStock ? '' : 'disabled'}>${inStock ? 'Add to Cart' : 'Out of Stock'}</button>
        </div>
      </div>
    </div>
  `;
}
