// Admin products: inventory table, create/edit, inline stock updates.

const ADMIN_LOW_STOCK_THRESHOLD = 10; // Product model has no explicit lowStockThreshold on variants; using a reasonable default.

async function renderAdminProducts() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="admin-shell">
      ${adminSidebarHtml('products')}
      <main class="admin-main">
        <div class="admin-topbar">
          <h1 class="admin-page-title">Products</h1>
          <button class="btn btn-primary" id="prod-add-btn">Add Product</button>
        </div>
        <div class="admin-content">
          <div id="prod-table-wrap"><p>Loading products…</p></div>
        </div>
      </main>
    </div>
  `;

  bindAdminSidebar(root);

  async function loadProducts() {
    const wrap = qs('#prod-table-wrap', root);
    wrap.innerHTML = '<p>Loading products…</p>';
    const data = await api.get('/products?limit=100');
    const products = (data && data.success) ? data.products : [];
    wrap.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Brand</th><th>Category</th><th>Variant Stock</th><th></th></tr></thead>
          <tbody>
            ${products.map(p => `
              <tr data-id="${p._id}">
                <td>${p.name}</td>
                <td>${p.brand}</td>
                <td>${p.category}</td>
                <td>
                  ${p.variants.map(v => {
                    const cls = v.stock === 0 ? 'badge-error' : (v.stock <= ADMIN_LOW_STOCK_THRESHOLD ? 'badge-warning' : 'badge-success');
                    return `<div>${v.name}: <span class="badge ${cls}">${v.stock}</span> <input type="number" class="form-control prod-stock-input" style="width:70px;display:inline-block;" data-id="${p._id}" data-variant="${v._id || ''}" data-variant-name="${v.name}" placeholder="new"></div>`;
                  }).join('')}
                </td>
                <td class="row-actions">
                  <button class="btn btn-outline btn-sm prod-edit-btn" data-id="${p._id}">Edit</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="5">No products yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    qsa('.prod-stock-input', wrap).forEach(input => input.addEventListener('change', async () => {
      const val = Number(input.value);
      if (isNaN(val)) return;
      const body = input.dataset.variant ? { variantId: input.dataset.variant, variantStock: val } : { stock: val };
      const res = await api.put(`/products/${input.dataset.id}/stock`, body);
      if (res && res.success) { showToast('Stock updated', 'success'); loadProducts(); }
      else showToast((res && res.message) || 'Could not update stock', 'error');
    }));
    qsa('.prod-edit-btn', wrap).forEach(btn => btn.addEventListener('click', () => {
      openProductForm(products.find(p => p._id === btn.dataset.id));
    }));
  }

  function openProductForm(product) {
    const isEdit = !!product;
    product = product || { name: '', brand: '', category: 'Hair Care', description: '', images: [''], variants: [{ name: 'Standard', price: 0, stock: 0 }] };
    openModal(`
      <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Product</h2><button class="modal-close" aria-label="Close">✕</button></div>
      <div class="modal-body admin-form-grid">
        <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-control" id="pf-name" value="${product.name}"></div>
        <div class="form-group"><label class="form-label">Brand</label><input type="text" class="form-control" id="pf-brand" value="${product.brand}"></div>
        <div class="form-group"><label class="form-label">Category</label>
          <select class="form-control" id="pf-category">
            ${['Hair Care','Skin Care','Nail Care','Tools'].map(c => `<option value="${c}" ${product.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Image Path</label><input type="text" class="form-control" id="pf-image" value="${(product.images && product.images[0]) || ''}"></div>
        <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="pf-desc">${product.description || ''}</textarea></div>
        <div class="form-group">
          <label class="form-label">Variants (name:price:stock, one per line)</label>
          <textarea class="form-control" id="pf-variants">${(product.variants || []).map(v => `${v.name}:${v.price}:${v.stock}`).join('\n')}</textarea>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-primary btn-block" id="pf-save-btn">${isEdit ? 'Save Changes' : 'Create Product'}</button></div>
    `);
    qs('#pf-save-btn').addEventListener('click', async () => {
      const variants = qs('#pf-variants').value.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
        const [name, price, stock] = line.split(':');
        return { name: (name || '').trim(), price: Number(price) || 0, stock: Number(stock) || 0 };
      });
      const body = {
        name: qs('#pf-name').value,
        brand: qs('#pf-brand').value,
        category: qs('#pf-category').value,
        description: qs('#pf-desc').value,
        images: [qs('#pf-image').value],
        variants
      };
      const res = isEdit ? await api.put(`/products/${product._id}`, body) : await api.post('/products', body);
      if (res && res.success) { showToast(isEdit ? 'Product updated' : 'Product created', 'success'); closeModal(); loadProducts(); }
      else showToast((res && res.message) || 'Could not save product', 'error');
    });
  }

  qs('#prod-add-btn', root).addEventListener('click', () => openProductForm(null));
  loadProducts();
}
