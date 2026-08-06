// Admin: Payments + refund management

async function renderAdminPayments() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;
  root.innerHTML = `
    <div class="admin-shell">
      ${adminSidebarHtml('payments')}
      <main class="admin-main">
        <div class="admin-topbar"><h1 class="admin-page-title">Payments</h1></div>
        <div class="admin-content">
          <div class="admin-toolbar">
            <div class="filters">
              <select id="payment-status-filter">
                <option value="">All statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select id="payment-type-filter">
                <option value="">All types</option>
                <option value="appointment">Appointment</option>
                <option value="order">Order</option>
              </select>
            </div>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Customer</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody id="payment-table-body"><tr><td colspan="7">Loading…</td></tr></tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;
  bindAdminSidebar(root);

  qs('#payment-status-filter').addEventListener('change', loadAdminPayments);
  qs('#payment-type-filter').addEventListener('change', loadAdminPayments);

  await loadAdminPayments();
}

async function loadAdminPayments() {
  const tbody = qs('#payment-table-body');
  const status = qs('#payment-status-filter').value;
  const type = qs('#payment-type-filter').value;
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (type) params.set('type', type);

  const res = await api.get(`/admin/payments${params.toString() ? '?' + params.toString() : ''}`);
  const payments = (res && res.success) ? res.payments : [];

  tbody.innerHTML = payments.length ? payments.map(p => `
    <tr>
      <td>${formatDate(p.createdAt)}</td>
      <td>${p.type}</td>
      <td>${p.referenceId}</td>
      <td>${p.customerId ? p.customerId.name : 'Guest'}</td>
      <td>${formatMoney(p.amount)}</td>
      <td><span class="status-badge status-${p.status === 'succeeded' ? 'confirmed' : p.status === 'failed' ? 'cancelled' : 'pending'}">${p.status}</span></td>
      <td class="row-actions">
        ${p.status === 'succeeded' ? `<button class="btn btn-outline btn-sm refund-btn" data-id="${p._id}">Refund</button>` : ''}
      </td>
    </tr>`).join('') : '<tr><td colspan="7" class="empty-state">No payments found.</td></tr>';

  qsa('.refund-btn').forEach(btn => btn.addEventListener('click', async () => {
    const reason = prompt('Reason for refund (optional):') || '';
    if (!confirm('Process this refund?')) return;
    const r = await api.post(`/payments/${btn.dataset.id}/refund`, { reason });
    if (r && r.success) { showToast('Refund processed.', 'success'); loadAdminPayments(); }
    else showToast((r && r.message) || 'Could not process refund.', 'error');
  }));
}
