// Admin appointments: filterable list/table with status updates, plus a read-only month calendar view.

const ADMIN_APPT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
const ADMIN_APPT_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

async function renderAdminAppointments() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  let viewMode = 'list';
  const now = new Date();
  let calYear = now.getFullYear();
  let calMonth = now.getMonth();
  let allAppointments = [];

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
    viewMode = viewMode === 'list' ? 'calendar' : 'list';
    qs('#appt-view-toggle', root).textContent = viewMode === 'list' ? 'Calendar View' : 'List View';
    render();
  });

  function render() {
    if (viewMode === 'calendar') renderCalendarView();
    else renderListView();
  }

  function renderListView() {
    const wrap = qs('#appt-list-wrap', root);
    wrap.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Booking #</th><th>Customer</th><th>Services</th><th>Date/Time</th><th>Staff</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${allAppointments.map(a => `
              <tr data-id="${a._id}">
                <td>${escapeHtml(a.bookingNumber)}</td>
                <td>${escapeHtml(a.customerId ? a.customerId.name : (a.guestInfo ? a.guestInfo.name : 'Guest'))}</td>
                <td>${(a.services || []).map(s => escapeHtml(s.name)).join(', ')}</td>
                <td>${formatDate(a.date)} ${formatTime12h(a.startTime)}</td>
                <td>${escapeHtml(a.staffId ? a.staffId.name : '—')}</td>
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

  function renderCalendarView() {
    const wrap = qs('#appt-list-wrap', root);
    const days = generateCalendarDays(calYear, calMonth);

    const apptsByDate = {};
    allAppointments.forEach(a => {
      const dateStr = (a.date || '').slice(0, 10);
      if (!dateStr) return;
      if (!apptsByDate[dateStr]) apptsByDate[dateStr] = [];
      apptsByDate[dateStr].push(a);
    });

    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxPerCell = 3;

    wrap.innerHTML = `
      <div class="admin-calendar-nav">
        <button class="btn btn-outline btn-sm" id="cal-prev">‹ Prev</button>
        <h3>${ADMIN_APPT_MONTH_NAMES[calMonth]} ${calYear}</h3>
        <button class="btn btn-outline btn-sm" id="cal-next">Next ›</button>
        <button class="btn btn-outline btn-sm" id="cal-today">Today</button>
      </div>
      <div class="admin-calendar-grid">
        ${dow.map(d => `<div class="admin-calendar-dow">${d}</div>`).join('')}
        ${days.map(d => {
          const dayAppts = apptsByDate[d.dateStr] || [];
          const shown = dayAppts.slice(0, maxPerCell);
          const extra = dayAppts.length - shown.length;
          return `
            <div class="admin-calendar-cell${d.isCurrentMonth ? '' : ' is-outside'}${d.isToday ? ' is-today' : ''}">
              <div class="admin-calendar-date">${d.date}</div>
              ${shown.map(a => `<div class="admin-calendar-appt status-${a.status}" title="${escapeHtml((a.services || []).map(s => s.name).join(', ') + ' — ' + (a.customerId ? a.customerId.name : (a.guestInfo ? a.guestInfo.name : 'Guest')))}">${formatTime12h(a.startTime)} ${escapeHtml(a.customerId ? a.customerId.name : (a.guestInfo ? a.guestInfo.name : 'Guest'))}</div>`).join('')}
              ${extra > 0 ? `<div class="admin-calendar-more">+${extra} more</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    qs('#cal-prev', wrap).addEventListener('click', () => {
      calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendarView();
    });
    qs('#cal-next', wrap).addEventListener('click', () => {
      calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendarView();
    });
    qs('#cal-today', wrap).addEventListener('click', () => {
      calYear = now.getFullYear(); calMonth = now.getMonth();
      renderCalendarView();
    });
  }

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

    allAppointments = data.appointments || [];
    render();
  }

  loadAppointments();
}
