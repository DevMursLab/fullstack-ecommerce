// Admin customers: searchable list + detail drawer (appointments + orders history).

async function renderAdminCustomers() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="admin-shell">
      ${adminSidebarHtml('customers')}
      <main class="admin-main">
        <div class="admin-topbar"><h1 class="admin-page-title">Customers</h1></div>
        <div class="admin-content">
          <div class="admin-toolbar filters">
            <input type="text" class="form-control" id="cust-search" placeholder="Search by name, email, or phone…">
          </div>
          <div id="cust-table-wrap"><p>Loading customers…</p></div>
        </div>
      </main>
    </div>
  `;

  bindAdminSidebar(root);

  async function loadCustomers(q) {
    const wrap = qs('#cust-table-wrap', root);
    wrap.innerHTML = '<p>Loading customers…</p>';
    const data = await api.get('/admin/customers' + (q ? '?q=' + encodeURIComponent(q) : ''));
    const customers = (data && data.success) ? data.customers : [];
    wrap.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            ${customers.map(c => `
              <tr data-id="${c._id}">
                <td>${c.name}</td>
                <td>${c.email}</td>
                <td>${c.phone || '—'}</td>
                <td>${formatDate(c.createdAt)}</td>
                <td class="row-actions"><button class="btn btn-outline btn-sm cust-view-btn" data-id="${c._id}">View</button></td>
              </tr>
            `).join('') || '<tr><td colspan="5">No customers found.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    qsa('.cust-view-btn', wrap).forEach(btn => btn.addEventListener('click', () => openCustomerDetail(btn.dataset.id)));
  }

  async function openCustomerDetail(id) {
    openModal('<div class="modal-body"><p>Loading customer…</p></div>');
    const data = await api.get(`/admin/customers/${id}`);
    if (!data || !data.success) {
      openModal('<div class="modal-body"><p>Could not load customer.</p></div>');
      return;
    }
    const c = data.customer;
    openModal(`
      <div class="modal-header"><h2>${c.name}</h2><button class="modal-close" aria-label="Close">✕</button></div>
      <div class="modal-body">
        <p><strong>Email:</strong> ${c.email}</p>
        <p><strong>Phone:</strong> ${c.phone || '—'}</p>
        <p><strong>Joined:</strong> ${formatDate(c.createdAt)}</p>
        <h4>Appointments (${data.appointments.length})</h4>
        ${data.appointments.length ? data.appointments.map(a => `<div class="summary-line"><span>${a.bookingNumber} — ${(a.services||[]).map(s=>s.name).join(', ')}</span><span>${formatMoney(a.total)}</span></div>`).join('') : '<p>None yet.</p>'}
        <h4>Orders (${data.orders.length})</h4>
        ${data.orders.length ? data.orders.map(o => `<div class="summary-line"><span>${o.orderNumber}</span><span>${formatMoney(o.total)}</span></div>`).join('') : '<p>None yet.</p>'}
      </div>
    `);
  }

  const debouncedSearch = debounce((val) => loadCustomers(val), 300);
  qs('#cust-search', root).addEventListener('input', (e) => debouncedSearch(e.target.value));

  loadCustomers('');
}
