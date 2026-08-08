const SHOP_PAGE_SIZE = 9;

function renderShop() {
  const root = document.getElementById('page-root');
  const allProducts = STATE.products.length ? STATE.products : MOCK_PRODUCTS;
  const categories = [...new Set(allProducts.map(p => p.category))];

  root.innerHTML = `
    <section class="page-section">
      <div class="section-heading"><h1>Shop</h1></div>
      <div class="grid-2 shop-layout">
        <aside class="shop-sidebar">
          <div class="form-group">
            <label class="form-label">Search</label>
            <input type="text" class="form-control" id="shop-search" value="${STATE.shopFilters.query || ''}" placeholder="Search products...">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            ${categories.map(c => `
              <label class="checkbox-row">
                <input type="checkbox" class="shop-cat-cb" value="${c}" ${STATE.shopFilters.categories.includes(c) ? 'checked' : ''}> ${c}
              </label>
            `).join('')}
          </div>
          <div class="form-group">
            <label class="form-label">Max Price: <span id="shop-max-price-label">${formatMoney(STATE.shopFilters.maxPrice)}</span></label>
            <input type="range" min="0" max="5000" step="50" id="shop-max-price" value="${STATE.shopFilters.maxPrice}">
          </div>
          <div class="form-group">
            <label class="form-label">Minimum Rating</label>
            <select class="form-control" id="shop-min-rating">
              <option value="0" ${STATE.shopFilters.minRating === 0 ? 'selected' : ''}>Any</option>
              <option value="3" ${STATE.shopFilters.minRating === 3 ? 'selected' : ''}>3+</option>
              <option value="4" ${STATE.shopFilters.minRating === 4 ? 'selected' : ''}>4+</option>
              <option value="4.5" ${STATE.shopFilters.minRating === 4.5 ? 'selected' : ''}>4.5+</option>
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-row"><input type="checkbox" id="shop-in-stock" ${STATE.shopFilters.inStockOnly ? 'checked' : ''}> In stock only</label>
          </div>
        </aside>
        <div>
          <div class="header-actions shop-toolbar">
            <span id="shop-result-count"></span>
            <select class="form-control shop-sort-select" id="shop-sort">
              <option value="featured" ${STATE.shopFilters.sort === 'featured' ? 'selected' : ''}>Featured</option>
              <option value="price-asc" ${STATE.shopFilters.sort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price-desc" ${STATE.shopFilters.sort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
              <option value="rating" ${STATE.shopFilters.sort === 'rating' ? 'selected' : ''}>Top Rated</option>
              <option value="newest" ${STATE.shopFilters.sort === 'newest' ? 'selected' : ''}>Newest</option>
            </select>
          </div>
          <div class="grid-3" id="shop-grid"></div>
          <div class="pagination" id="shop-pagination"></div>
        </div>
      </div>
    </section>
  `;

  function getFiltered() {
    let list = allProducts.slice();
    const f = STATE.shopFilters;
    if (f.query) {
      const q = f.query.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
    }
    if (f.categories.length) list = list.filter(p => f.categories.includes(p.category));
    list = list.filter(p => p.variants[0].price <= f.maxPrice);
    list = list.filter(p => (p.rating || 0) >= f.minRating);
    if (f.inStockOnly) list = list.filter(p => p.variants.some(v => v.stock > 0));

    if (f.sort === 'price-asc') list.sort((a, b) => a.variants[0].price - b.variants[0].price);
    else if (f.sort === 'price-desc') list.sort((a, b) => b.variants[0].price - a.variants[0].price);
    else if (f.sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (f.sort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return list;
  }

  function renderGrid() {
    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / SHOP_PAGE_SIZE));
    if (STATE.shopPage > totalPages) STATE.shopPage = totalPages;
    const start = (STATE.shopPage - 1) * SHOP_PAGE_SIZE;
    const pageItems = filtered.slice(start, start + SHOP_PAGE_SIZE);

    qs('#shop-result-count', root).textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

    const grid = qs('#shop-grid', root);
    grid.innerHTML = pageItems.map(p => productCardHTML(p)).join('') || '<div class="empty-state"><p>No products match your filters.</p></div>';

    const pagEl = qs('#shop-pagination', root);
    let pagHtml = '';
    for (let i = 1; i <= totalPages; i++) {
      pagHtml += `<button class="btn btn-sm ${i === STATE.shopPage ? 'btn-primary' : 'btn-outline'}" data-page="${i}">${i}</button>`;
    }
    pagEl.innerHTML = pagHtml;

    qsa('[data-page]', pagEl).forEach(btn => btn.addEventListener('click', () => {
      STATE.shopPage = Number(btn.dataset.page);
      renderGrid();
      window.scrollTo(0, 0);
    }));

    qsa('.shop-add-cart', grid).forEach(btn => btn.addEventListener('click', () => {
      const p = allProducts.find(pr => pr._id === btn.dataset.id);
      if (p) {
        addToCart(p, p.variants[0], 1);
        renderHeader();
        renderCartDrawer();
        showToast('Added to cart', 'success');
      }
    }));
    qsa('.shop-quick-view', grid).forEach(btn => btn.addEventListener('click', () => {
      const p = allProducts.find(pr => pr._id === btn.dataset.id);
      if (p) openQuickView(p);
    }));
  }

  function openQuickView(p) {
    openModal(`
      <div class="modal-header"><h2>${p.name}</h2><button class="modal-close" aria-label="Close">✕</button></div>
      <div class="modal-body">
        <img src="${p.images[0]}" alt="${p.name}" style="width:100%;border-radius:8px;margin-bottom:1rem;" onerror="this.style.display='none'">
        <p>${p.description}</p>
        ${stars(p.rating)} <span>(${p.reviewCount} reviews)</span>
        <div class="form-group">
          <label class="form-label">Variant</label>
          <select class="form-control" id="qv-variant">
            ${p.variants.map((v, i) => `<option value="${i}">${v.name} — ${formatMoney(v.price)} ${v.stock <= 0 ? '(Out of Stock)' : ''}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-block" id="qv-add-btn">Add to Cart</button>
      </div>
    `);
    qs('#qv-add-btn').addEventListener('click', () => {
      const idx = Number(qs('#qv-variant').value);
      const variant = p.variants[idx];
      if (variant.stock <= 0) { showToast('This variant is out of stock', 'error'); return; }
      addToCart(p, variant, 1);
      renderHeader();
      renderCartDrawer();
      showToast('Added to cart', 'success');
      closeModal();
    });
  }

  const debouncedSearch = debounce((val) => {
    STATE.shopFilters.query = val;
    STATE.shopPage = 1;
    renderGrid();
  }, 300);

  qs('#shop-search', root).addEventListener('input', (e) => debouncedSearch(e.target.value));
  qsa('.shop-cat-cb', root).forEach(cb => cb.addEventListener('change', () => {
    const cats = qsa('.shop-cat-cb:checked', root).map(c => c.value);
    STATE.shopFilters.categories = cats;
    STATE.shopPage = 1;
    renderGrid();
  }));
  qs('#shop-max-price', root).addEventListener('input', (e) => {
    STATE.shopFilters.maxPrice = Number(e.target.value);
    qs('#shop-max-price-label', root).textContent = formatMoney(STATE.shopFilters.maxPrice);
    renderGrid();
  });
  qs('#shop-min-rating', root).addEventListener('change', (e) => {
    STATE.shopFilters.minRating = Number(e.target.value);
    renderGrid();
  });
  qs('#shop-in-stock', root).addEventListener('change', (e) => {
    STATE.shopFilters.inStockOnly = e.target.checked;
    renderGrid();
  });
  qs('#shop-sort', root).addEventListener('change', (e) => {
    STATE.shopFilters.sort = e.target.value;
    renderGrid();
  });

  renderGrid();
}
