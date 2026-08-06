// Admin: Coupon manager

async function renderAdminCoupons() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;
  root.innerHTML = `
    <div class="admin-shell">
      ${adminSidebarHtml('coupons')}
      <main class="admin-main">
        <div class="admin-topbar">
          <h1 class="admin-page-title">Coupons</h1>
          <button class="btn btn-primary" id="add-coupon-btn">+ Add Coupon</button>
        </div>
        <div class="admin-content">
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Purchase</th><th>Used</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody id="coupon-table-body"><tr><td colspan="7">Loading…</td></tr></tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;
  bindAdminSidebar(root);
  qs('#add-coupon-btn').addEventListener('click', () => openCouponForm());
  await loadAdminCoupons();
}

async function loadAdminCoupons() {
  const tbody = qs('#coupon-table-body');
  const res = await api.get('/coupons');
  const coupons = (res && res.success) ? res.coupons : [];

  tbody.innerHTML = coupons.length ? coupons.map(c => `
    <tr>
      <td>${c.code}</td>
      <td>${c.type}</td>
      <td>${c.type === 'percentage' ? c.value + '%' : formatMoney(c.value)}</td>
      <td>${c.minPurchase ? formatMoney(c.minPurchase) : '—'}</td>
      <td>${c.usedCount || 0}${c.usageLimit ? ' / ' + c.usageLimit : ''}</td>
      <td><span class="status-badge status-${c.isActive ? 'confirmed' : 'cancelled'}">${c.isActive ? 'Active' : 'Inactive'}</span></td>
      <td class="row-actions">
        <button class="btn btn-outline btn-sm edit-coupon-btn" data-id="${c._id}">Edit</button>
        <button class="btn btn-outline btn-sm delete-coupon-btn" data-id="${c._id}">Delete</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="7" class="empty-state">No coupons yet.</td></tr>';

  qsa('.edit-coupon-btn').forEach(btn => btn.addEventListener('click', () => {
    const coupon = coupons.find(c => c._id === btn.dataset.id);
    openCouponForm(coupon);
  }));
  qsa('.delete-coupon-btn').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete this coupon?')) return;
    const r = await api.delete(`/coupons/${btn.dataset.id}`);
    if (r && r.success) { showToast('Coupon deleted.', 'success'); loadAdminCoupons(); }
    else showToast((r && r.message) || 'Could not delete coupon.', 'error');
  }));
}

function openCouponForm(coupon) {
  const isEdit = !!coupon;
  openModal(`
    <h2>${isEdit ? 'Edit' : 'Add'} Coupon</h2>
    <form id="coupon-form" class="admin-form-grid">
      <label>Code<input type="text" name="code" value="${coupon ? coupon.code : ''}" required></label>
      <label>Type
        <select name="type">
          <option value="percentage" ${coupon && coupon.type === 'percentage' ? 'selected' : ''}>Percentage</option>
          <option value="fixed" ${coupon && coupon.type === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
        </select>
      </label>
      <label>Value<input type="number" name="value" value="${coupon ? coupon.value : ''}" required></label>
      <label>Min Purchase<input type="number" name="minPurchase" value="${coupon ? (coupon.minPurchase || 0) : 0}"></label>
      <label>Max Discount<input type="number" name="maxDiscount" value="${coupon ? (coupon.maxDiscount || '') : ''}"></label>
      <label>Applies To
        <select name="appliesTo">
          <option value="both" ${!coupon || coupon.appliesTo === 'both' ? 'selected' : ''}>Both</option>
          <option value="appointment" ${coupon && coupon.appliesTo === 'appointment' ? 'selected' : ''}>Appointment</option>
          <option value="order" ${coupon && coupon.appliesTo === 'order' ? 'selected' : ''}>Order</option>
        </select>
      </label>
      <label>Usage Limit (total)<input type="number" name="usageLimit" value="${coupon ? (coupon.usageLimit || '') : ''}"></label>
      <label>Per-User Limit<input type="number" name="perUserLimit" value="${coupon ? (coupon.perUserLimit || 1) : 1}"></label>
      <label class="full-width"><input type="checkbox" name="isActive" ${!coupon || coupon.isActive ? 'checked' : ''}> Active</label>
      <button type="submit" class="btn btn-primary full-width">${isEdit ? 'Save Changes' : 'Create Coupon'}</button>
    </form>
  `);

  qs('#coupon-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      code: form.code.value.toUpperCase(),
      type: form.type.value,
      value: Number(form.value.value),
      minPurchase: Number(form.minPurchase.value) || 0,
      maxDiscount: form.maxDiscount.value ? Number(form.maxDiscount.value) : undefined,
      appliesTo: form.appliesTo.value,
      usageLimit: form.usageLimit.value ? Number(form.usageLimit.value) : undefined,
      perUserLimit: Number(form.perUserLimit.value) || 1,
      isActive: form.isActive.checked
    };
    const res = isEdit ? await api.put(`/coupons/${coupon._id}`, payload) : await api.post('/coupons', payload);
    if (res && res.success) {
      showToast(`Coupon ${isEdit ? 'updated' : 'created'}.`, 'success');
      closeModal();
      loadAdminCoupons();
    } else {
      showToast((res && res.message) || 'Could not save coupon.', 'error');
    }
  });
}
