// Admin dashboard: KPIs, revenue chart, today's schedule, activity feed, low-stock alerts.
// Also hosts the shared admin sidebar helper used by every admin page (loaded first).

let _adminRevenueChartInstance = null;

function adminSidebarHtml(active) {
  const links = [
    ['dashboard', '/admin', 'Dashboard'],
    ['appointments', '/admin/appointments', 'Appointments'],
    ['services', '/admin/services', 'Services'],
    ['staff', '/admin/staff', 'Staff'],
    ['products', '/admin/products', 'Products'],
    ['orders', '/admin/orders', 'Orders'],
    ['customers', '/admin/customers', 'Customers'],
    ['payments', '/admin/payments', 'Payments'],
    ['coupons', '/admin/coupons', 'Coupons']
  ];
  return `
    <aside class="admin-sidebar">
      <div class="logo">${CONFIG.APP_NAME}</div>
      <nav class="admin-nav-section">
        ${links.map(([key, href, label]) => `<a href="#${href}" class="admin-nav-link${key === active ? ' active' : ''}">${label}</a>`).join('')}
      </nav>
      <a href="#/" class="admin-nav-link">← Back to Site</a>
    </aside>
  `;
}

function bindAdminSidebar(root) {
  // Links are plain <a href="#/admin/..."> — router.js hashchange listener handles navigation.
  // Nothing extra to bind; kept as a hook in case future sidebar behavior needs it.
}

async function renderAdminDashboard() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="admin-shell">
      ${adminSidebarHtml('dashboard')}
      <main class="admin-main">
        <div class="admin-topbar"><h1 class="admin-page-title">Dashboard</h1></div>
        <div class="admin-content">
          <div class="kpi-grid" id="admin-kpi-grid"><p>Loading stats…</p></div>
          <div class="chart-row">
            <div class="chart-container"><canvas id="admin-revenue-chart"></canvas></div>
          </div>
          <div class="grid-2">
            <div>
              <h3>Today's Schedule</h3>
              <div id="admin-today-schedule"><p>Loading…</p></div>
            </div>
            <div>
              <h3>Recent Activity</h3>
              <div id="admin-activity"><p>Loading…</p></div>
            </div>
          </div>
          <h3 style="margin-top:1.5rem;">Low Stock Alerts</h3>
          <div id="admin-low-stock"><p>Loading…</p></div>
        </div>
      </main>
    </div>
  `;

  bindAdminSidebar(root);

  loadKpis();
  loadRevenueChart();
  loadTodaySchedule();
  loadActivity();
  loadLowStock();
}

async function loadKpis() {
  const el = qs('#admin-kpi-grid');
  try {
    const data = await api.get('/admin/stats');
    if (!data || !data.success) throw new Error('failed');
    const s = data.stats;
    const changeCls = s.revenueChangePercent >= 0 ? 'up' : 'down';
    el.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">Today's Bookings</div>
        <div class="kpi-value">${s.todaysBookingsCount}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Month Revenue</div>
        <div class="kpi-value">${formatMoney(s.monthRevenue)}</div>
        <div class="kpi-delta ${changeCls}">${s.revenueChangePercent >= 0 ? '+' : ''}${s.revenueChangePercent}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">New Customers</div>
        <div class="kpi-value">${s.newCustomersCount}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Avg Ticket</div>
        <div class="kpi-value">${formatMoney(s.avgTicket)}</div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = '<p>Could not load dashboard stats.</p>';
  }
}

async function loadRevenueChart() {
  try {
    const data = await api.get('/admin/revenue');
    if (!data || !data.success) throw new Error('failed');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const labels = data.chart.map(c => monthNames[c.month - 1] + ' ' + String(c.year).slice(2));
    const values = data.chart.map(c => c.revenue);
    const ctx = document.getElementById('admin-revenue-chart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (_adminRevenueChartInstance) _adminRevenueChartInstance.destroy();
    _adminRevenueChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Revenue', data: values, borderColor: '#a67c52', backgroundColor: 'rgba(166,124,82,0.15)', fill: true, tension: 0.3 }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  } catch (err) {
    // silently skip the chart on failure
  }
}

async function loadTodaySchedule() {
  const el = qs('#admin-today-schedule');
  try {
    const data = await api.get('/admin/schedule-today');
    if (!data || !data.success) throw new Error('failed');
    el.innerHTML = data.appointments.length ? data.appointments.map(a => `
      <div class="card card-body" style="margin-bottom:.5rem;">
        <strong>${formatTime12h(a.startTime)}</strong> — ${(a.services || []).map(s => escapeHtml(s.name)).join(', ')}
        <br><small>${escapeHtml(a.customerId ? a.customerId.name : (a.guestInfo ? a.guestInfo.name : 'Guest'))} with ${escapeHtml(a.staffId ? a.staffId.name : '—')}</small>
        <span class="status-pill status-${a.status}">${a.status}</span>
      </div>
    `).join('') : '<p>No appointments today.</p>';
  } catch (err) {
    el.innerHTML = '<p>Could not load today\'s schedule.</p>';
  }
}

async function loadActivity() {
  const el = qs('#admin-activity');
  try {
    const data = await api.get('/admin/activity');
    if (!data || !data.success) throw new Error('failed');
    el.innerHTML = data.activity.length ? data.activity.map(a => `
      <div class="card card-body" style="margin-bottom:.5rem;">
        <strong>${escapeHtml(a.label)}</strong> <span class="status-pill status-${a.status}">${a.status}</span>
        <br><small>${formatDate(a.createdAt)}</small>
      </div>
    `).join('') : '<p>No recent activity.</p>';
  } catch (err) {
    el.innerHTML = '<p>Could not load activity.</p>';
  }
}

async function loadLowStock() {
  const el = qs('#admin-low-stock');
  try {
    const data = await api.get('/admin/low-stock');
    if (!data || !data.success) throw new Error('failed');
    el.innerHTML = data.products.length ? `
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Product</th><th>Stock</th></tr></thead>
        <tbody>${data.products.map(p => `<tr><td>${escapeHtml(p.name)}</td><td><span class="badge badge-warning">${p.stock}</span></td></tr>`).join('')}</tbody>
      </table></div>
    ` : '<p>No low-stock products.</p>';
  } catch (err) {
    el.innerHTML = '<p>Could not load low-stock products.</p>';
  }
}
