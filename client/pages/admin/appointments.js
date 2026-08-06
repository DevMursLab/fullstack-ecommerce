// Admin appointments: filterable list/table with status updates. Calendar view is a placeholder.

const ADMIN_APPT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

async function renderAdminAppointments() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="admin-shell">
      ${adminSidebarHtml('appointments')}
      <main class="admin-main">
        <div class="admin-topbar"><h1 class="admin-page-title">Appointments</h1></div>
        <div class="admin-content">
          <div class="admin-toolbar filters">
            <select class="form-control" id="appt-status-filter">
              <option value="">All statuses</option>
              ${ADMIN_APPT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <input type="date" class="form-control" id="appt-date-from" placeholder="From">
            <input type="date" class="form-control" id="appt-date-to" placeholder="To">
            <button class="btn btn-outline btn-sm" id="appt-filter-btn">Filter</button>
            <button class="btn btn-outline btn-sm" id="appt-view-toggle" style="margin-left:auto;">Calendar View</button>
          </div>
          <div id="appt-list-wrap"><p>Loading appointments…</p></div>
        </div>
      </main>
    </div>
  `;

  bindAdminSidebar(root);

  qs('#appt-filter-btn', root).addEventListener('click', () => loadAppointments());
  qs('#appt-view-toggle', root).addEventListener('click', () => {
    showToast('Calendar/week view is a placeholder in this build — list view below is fully functional.', 'info');
  });

  async function loadAppointments() {
    const wrap = qs('#appt-list-wrap', root);
    wrap.innerHTML = '<p>Loading appointments…</p>';
    const status = qs('#appt-status-filter', root).value;
    const dateFrom = qs('#appt-date-from', root).value;
    const dateTo = qs('#appt-date-to', root).value;
    let qsParams = [];
    if (status) qsParams.push('status=' + status);
    if (dateFrom) qsParams.push('dateFrom=' + dateFrom);
    if (dateTo) qsParams.push('dateTo=' + dateTo);
    const data = await api.get('/appointments' + (qsParams.length ? '?' + qsParams.join('&') : ''));
    if (!data || !data.success) { wrap.innerHTML = '<p>Could not load appointments.</p>'; return; }

    const appointments = data.appointments;
    wrap.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Booking #</th><th>Customer</th><th>Services</th><th>Date/Time</th><th>Staff</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${appointments.map(a => `
              <tr data-id="${a._id}">
                <td>${a.bookingNumber}</td>
                <td>${a.customerId ? a.customerId.name : (a.guestInfo ? a.guestInfo.name : 'Guest')}</td>
                <td>${(a.services || []).map(s => s.name).join(', ')}</td>
                <td>${formatDate(a.date)} ${formatTime12h(a.startTime)}</td>
                <td>${a.staffId ? a.staffId.name : '—'}</td>
                <td>${formatMoney(a.total)}</td>
                <td>
                  <select class="form-control appt-status-select" data-id="${a._id}">
                    ${ADMIN_APPT_STATUSES.map(s => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </td>
                <td class="row-actions"></td>
              </tr>
            `).join('') || '<tr><td colspan="8">No appointments found.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    qsa('.appt-status-select', wrap).forEach(sel => sel.addEventListener('change', async () => {
      const res = await api.put(`/appointments/${sel.dataset.id}/status`, { status: sel.value });
      if (res && res.success) showToast('Status updated', 'success');
      else showToast((res && res.message) || 'Could not update status', 'error');
    }));
  }

  loadAppointments();
}
