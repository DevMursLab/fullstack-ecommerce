// Admin orders: list table with status pipeline + tracking number updates.

const ADMIN_ORDER_STATUSES = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];

async function renderAdminOrders() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="admin-shell">
      ${adminSidebarHtml('orders')}
      <main class="admin-main">
        <div class="admin-topbar"><h1 class="admin-page-title">Orders</h1></div>
        <div class="admin-content">
          <div id="orders-table-wrap"><p>Loading orders…</p></div>
        </div>
      </main>
    </div>
  `;

  bindAdminSidebar(root);

  async function loadOrders() {
    const wrap = qs('#orders-table-wrap', root);
    wrap.innerHTML = '<p>Loading orders…</p>';
    const data = await api.get('/orders');
    const orders = (data && data.success) ? data.orders : [];
    wrap.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Tracking #</th><th></th></tr></thead>
          <tbody>
            ${orders.map(o => `
              <tr data-id="${o._id}">
                <td>${escapeHtml(o.orderNumber)}</td>
                <td>${escapeHtml(o.customerId ? o.customerId.name : 'Guest')}</td>
                <td>${(o.items || []).map(it => `${escapeHtml(it.name)} × ${it.quantity}`).join(', ')}</td>
                <td>${formatMoney(o.total)}</td>
                <td>
                  <select class="form-control ord-status-select" data-id="${o._id}">
                    ${ADMIN_ORDER_STATUSES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </td>
                <td><input type="text" class="form-control ord-tracking-input" data-id="${o._id}" value="${escapeHtml(o.trackingNumber) || ''}" placeholder="tracking #"></td>
                <td class="row-actions"><button class="btn btn-outline btn-sm ord-save-btn" data-id="${o._id}">Save</button></td>
              </tr>
            `).join('') || '<tr><td colspan="7">No orders yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    qsa('.ord-save-btn', wrap).forEach(btn => btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const status = qs(`.ord-status-select[data-id="${id}"]`, wrap).value;
      const trackingNumber = qs(`.ord-tracking-input[data-id="${id}"]`, wrap).value;
      const res = await api.put(`/orders/${id}/status`, { status, trackingNumber });
      if (res && res.success) showToast('Order updated', 'success');
      else showToast((res && res.message) || 'Could not update order', 'error');
    }));
  }

  loadOrders();
}
