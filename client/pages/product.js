// Single product detail page.

async function renderProduct(id) {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  const allProducts = STATE.products.length ? STATE.products : MOCK_PRODUCTS;
  const p = allProducts.find(x => x._id === id);

  if (!p) {
    root.innerHTML = `
      <section class="page-section container text-center">
        <h2>Product not found</h2>
        <a href="#/shop" class="btn btn-primary mt-6">Back to Shop</a>
      </section>
    `;
    return;
  }

  let activeImage = 0;
  let activeVariant = 0;
  let qty = 1;

  const reviews = (typeof MOCK_REVIEWS !== 'undefined' ? MOCK_REVIEWS : []).filter(r => r.type === 'product' && r.referenceId === id);
  const related = allProducts.filter(x => x.category === p.category && x._id !== p._id).slice(0, 4);

  root.innerHTML = `
    <section class="page-section">
      <div class="container">
        <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-8);">
          <div>
            <div class="card-media" id="product-main-img" style="border-radius:var(--radius-lg);aspect-ratio:1;">
              <img src="${(p.images || [])[0] || ''}" alt="${p.name}" onerror="this.style.display='none'">
            </div>
            <div class="flex gap-2 mt-3" id="thumb-strip">
              ${(p.images || []).map((img, i) => `
                <div class="card-media thumb-item ${i === 0 ? 'selected' : ''}" data-idx="${i}" style="width:64px;height:64px;border-radius:var(--radius-sm);cursor:pointer;border:2px solid ${i === 0 ? 'var(--color-accent)' : 'transparent'};">
                  <img src="${img}" alt="${p.name} ${i + 1}" onerror="this.style.display='none'">
                </div>
              `).join('')}
            </div>
          </div>
          <div>
            <p class="text-muted">${p.brand}</p>
            <h1>${p.name}</h1>
            <div class="mt-2">${stars(p.rating)} <span class="text-muted">(${p.reviewCount} reviews)</span></div>
            <p class="card-price mt-3" id="product-price" style="font-size:1.4rem;"></p>

            <div class="mt-4">
              <strong>Options</strong>
              <div class="flex gap-2 mt-2" style="flex-wrap:wrap;" id="variant-selector">
                ${p.variants.map((v, i) => `
                  <label class="option-card" data-idx="${i}" style="padding:8px 14px;${v.stock <= 0 ? 'opacity:.4;' : ''}">
                    <input type="radio" name="variant" ${i === 0 ? 'checked' : ''} ${v.stock <= 0 ? 'disabled' : ''}>
                    <span>${v.name} — ${formatMoney(v.price)}${v.stock <= 0 ? ' (Out of Stock)' : ''}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="mt-4 flex items-center gap-4">
              <div class="qty-stepper">
                <button id="qty-dec">−</button>
                <span id="qty-display">1</span>
                <button id="qty-inc">+</button>
              </div>
              <button class="btn btn-primary btn-lg" id="add-to-cart-btn">Add to Cart</button>
            </div>

            <div class="tabs mt-8" id="product-tabs">
              <button class="tab-btn active" data-tab="desc">Description</button>
              <button class="tab-btn" data-tab="ingredients">Ingredients</button>
              <button class="tab-btn" data-tab="reviews">Reviews (${reviews.length})</button>
            </div>
            <div class="mt-4" id="tab-panel"></div>
          </div>
        </div>

        ${related.length ? `
        <div class="mt-16">
          <h3>You Might Also Like</h3>
          <div class="grid grid-4 gap-6 mt-4">
            ${related.map(r => relatedProductCardHTML(r)).join('')}
          </div>
        </div>` : ''}
      </div>
    </section>
  `;

  function updatePriceDisplay() {
    document.getElementById('product-price').textContent = formatMoney(p.variants[activeVariant].price);
  }
  updatePriceDisplay();

  function renderTab(tab) {
    const panel = document.getElementById('tab-panel');
    if (tab === 'desc') {
      panel.innerHTML = `<p>${p.description}</p>`;
    } else if (tab === 'ingredients') {
      panel.innerHTML = `<p>Ingredient details are curated by our beauty experts and available on the product packaging. Please consult a stylist for full ingredient lists.</p>`;
    } else if (tab === 'reviews') {
      panel.innerHTML = reviews.length
        ? reviews.map(r => `
          <div class="card mt-2" style="padding:var(--space-3);">
            <div>${stars(r.rating)}</div>
            <p class="mt-1">"${r.comment}"</p>
            <p class="text-muted mt-1" style="font-size:.8rem;">— ${r.customerName}</p>
          </div>
        `).join('')
        : `<p class="text-muted">No reviews yet for this product.</p>`;
    }
  }
  renderTab('desc');

  document.getElementById('product-tabs').querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('#product-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTab(btn.dataset.tab);
  }));

  document.getElementById('thumb-strip').querySelectorAll('.thumb-item').forEach(thumb => thumb.addEventListener('click', () => {
    activeImage = Number(thumb.dataset.idx);
    document.querySelector('#product-main-img img').src = p.images[activeImage];
    document.querySelectorAll('.thumb-item').forEach(t => t.style.borderColor = 'transparent');
    thumb.style.borderColor = 'var(--color-accent)';
  }));

  document.getElementById('variant-selector').querySelectorAll('[data-idx]').forEach(label => label.addEventListener('click', () => {
    if (p.variants[Number(label.dataset.idx)].stock <= 0) return;
    activeVariant = Number(label.dataset.idx);
    document.querySelectorAll('#variant-selector input').forEach(r => r.checked = false);
    label.querySelector('input').checked = true;
    updatePriceDisplay();
    updateAddToCartState();
  }));

  function updateAddToCartState() {
    const btn = document.getElementById('add-to-cart-btn');
    btn.disabled = p.variants[activeVariant].stock <= 0;
    btn.textContent = p.variants[activeVariant].stock <= 0 ? 'Out of Stock' : 'Add to Cart';
  }
  updateAddToCartState();

  document.getElementById('qty-dec').addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    document.getElementById('qty-display').textContent = qty;
  });
  document.getElementById('qty-inc').addEventListener('click', () => {
    qty = Math.min(p.variants[activeVariant].stock, qty + 1);
    document.getElementById('qty-display').textContent = qty;
  });

  document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    const variant = p.variants[activeVariant];
    if (variant.stock <= 0) return;
    if (typeof addProductToCart === 'function') {
      addProductToCart(p, variant.name, qty);
    } else {
      addToCart(p, variant, qty);
      renderHeader();
      if (typeof renderCartDrawer === 'function') renderCartDrawer();
      showToast(`${p.name} added to cart.`, 'success');
    }
  });
}

function relatedProductCardHTML(p) {
  const variant = p.variants[0];
  return `
    <a href="#/product/${p._id}" class="product-card">
      <div class="card-media"><img src="${(p.images || [])[0]}" alt="${p.name}" onerror="this.style.display='none'"></div>
      <div class="card-body">
        <h4 class="card-title">${p.name}</h4>
        <div class="mt-1">${stars(p.rating)}</div>
        <p class="card-price mt-1">${formatMoney(variant.price)}</p>
      </div>
    </a>
  `;
}
