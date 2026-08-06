// Customer account page: bookings, orders, points, profile — tab-based via ?tab= query param.

async function renderAccount() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  if (!STATE.isLoggedIn) {
    root.innerHTML = `
      <section class="page-section">
        <div class="empty-state">
          <h2>Please log in to view your account</h2>
          <a href="#/login?redirect=account" class="btn btn-primary mt-4">Log In</a>
        </div>
      </section>
    `;
    return;
  }

  const hashQuery = (location.hash.split('?')[1]) || '';
  const params = new URLSearchParams(hashQuery);
  const tab = params.get('tab') || 'bookings';

  root.innerHTML = `
    <section class="page-section">
      <div class="section-heading"><h1>My Account</h1></div>
      <div class="tabs" id="account-tabs">
        <button class="tab-btn${tab === 'bookings' ? ' active' : ''}" data-tab="bookings">Bookings</button>
        <button class="tab-btn${tab === 'orders' ? ' active' : ''}" data-tab="orders">Orders</button>
        <button class="tab-btn${tab === 'points' ? ' active' : ''}" data-tab="points">Points</button>
        <button class="tab-btn${tab === 'profile' ? ' active' : ''}" data-tab="profile">Profile</button>
        <button class="btn btn-outline btn-sm" id="account-logout-btn" style="margin-left:auto;">Log Out</button>
      </div>
      <div id="account-tab-content" style="margin-top:1.5rem;"></div>
    </section>
  `;

  qsa('#account-tabs .tab-btn', root).forEach(btn => btn.addEventListener('click', () => {
    location.hash = '#/account?tab=' + btn.dataset.tab;
  }));
  qs('#account-logout-btn', root).addEventListener('click', () => logout());

  const content = qs('#account-tab-content', root);
  if (tab === 'bookings') await renderBookingsTab(content);
  else if (tab === 'orders') await renderOrdersTab(content);
  else if (tab === 'points') renderPointsTab(content);
  else renderProfileTab(content);
}

/* ---------------- Bookings tab ---------------- */
async function renderBookingsTab(content) {
  content.innerHTML = '<p>Loading your bookings…</p>';
  const data = await api.get('/appointments/my');
  const appointments = (data && data.success) ? data.appointments : [];

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a => a.date >= todayStr && a.status !== 'cancelled');
  const past = appointments.filter(a => a.date < todayStr || a.status === 'cancelled');

  function appointmentCard(a) {
    const staffName = a.staffId && a.staffId.name ? a.staffId.name : 'Any Stylist';
    return `
      <div class="card card-body" data-id="${a._id}" style="margin-bottom:1rem;">
        <div class="header-actions" style="justify-content:space-between;">
          <strong>${a.bookingNumber}</strong>
          <span class="status-pill status-${a.status}">${a.status}</span>
        </div>
        <p>${(a.services || []).map(s => s.name).join(', ')}</p>
        <p>${formatDate(a.date)} at ${formatTime12h(a.startTime)} with ${staffName}</p>
        <p><strong>Total:</strong> ${formatMoney(a.total)}</p>
        ${a.status !== 'cancelled' && a.status !== 'completed' ? `
          <div class="header-actions">
            <button class="btn btn-outline btn-sm acct-cancel-btn" data-id="${a._id}">Cancel</button>
            <button class="btn btn-outline btn-sm acct-reschedule-btn" data-id="${a._id}">Reschedule</button>
          </div>
        ` : `<button class="btn btn-outline btn-sm acct-again-btn" data-id="${a._id}">Book Again</button>`}
      </div>
    `;
  }

  content.innerHTML = `
    <h3>Upcoming</h3>
    ${upcoming.length ? upcoming.map(appointmentCard).join('') : '<p>No upcoming bookings.</p>'}
    <h3 style="margin-top:2rem;">Past</h3>
    ${past.length ? past.map(appointmentCard).join('') : '<p>No past bookings.</p>'}
  `;

  qsa('.acct-cancel-btn', content).forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Cancel this booking?')) return;
    const res = await api.put(`/appointments/${btn.dataset.id}/cancel`);
    if (res && res.success) { showToast('Booking cancelled', 'success'); renderBookingsTab(content); }
    else showToast((res && res.message) || 'Could not cancel booking', 'error');
  }));

  qsa('.acct-reschedule-btn', content).forEach(btn => btn.addEventListener('click', () => {
    openRescheduleModal(btn.dataset.id, appointments.find(a => a._id === btn.dataset.id), content);
  }));

  qsa('.acct-again-btn', content).forEach(btn => btn.addEventListener('click', () => {
    const appt = appointments.find(a => a._id === btn.dataset.id);
    if (!appt) return;
    resetBooking();
    const allServices = STATE.services.length ? STATE.services : MOCK_SERVICES;
    (appt.services || []).forEach(s => {
      const svc = allServices.find(sv => sv._id === s.serviceId || sv._id === s.serviceId?._id);
      if (svc) selectService(svc);
    });
    location.hash = '#/book';
  }));
}

function openRescheduleModal(id, appt, contentToRefresh) {
  if (!appt) return;
  openModal(`
    <div class="modal-header"><h2>Reschedule Booking</h2><button class="modal-close" aria-label="Close">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">New Date</label><input type="date" class="form-control" id="rs-date" min="${new Date().toISOString().split('T')[0]}"></div>
      <div id="rs-slots"></div>
    </div>
  `);
  const dateInput = qs('#rs-date');
  dateInput.addEventListener('change', async () => {
    const wrap = qs('#rs-slots');
    wrap.innerHTML = 'Loading slots…';
    const staffId = appt.staffId && appt.staffId._id ? appt.staffId._id : appt.staffId;
    const { slots } = await fetchAvailableSlots(staffId, dateInput.value, appt.totalDuration);
    if (!slots.length) { wrap.innerHTML = '<p>No slots available for this date.</p>'; return; }
    wrap.innerHTML = `<div class="slot-grid">${slots.map(s => `<button class="slot-btn" data-time="${s.time}">${formatTime12h(s.time)}</button>`).join('')}</div>`;
    qsa('.slot-btn', wrap).forEach(btn => btn.addEventListener('click', async () => {
      const res = await api.put(`/appointments/${id}/reschedule`, { date: dateInput.value, startTime: btn.dataset.time });
      if (res && res.success) {
        showToast('Booking rescheduled', 'success');
        closeModal();
        if (contentToRefresh) renderBookingsTab(contentToRefresh);
      } else {
        showToast((res && res.message) || 'Could not reschedule', 'error');
      }
    }));
  });
}

/* ---------------- Orders tab ---------------- */
async function renderOrdersTab(content) {
  content.innerHTML = '<p>Loading your orders…</p>';
  const data = await api.get('/orders/my');
  const orders = (data && data.success) ? data.orders : [];

  content.innerHTML = orders.length ? orders.map(o => `
    <div class="card card-body" style="margin-bottom:1rem;">
      <div class="header-actions" style="justify-content:space-between;">
        <strong>${o.orderNumber}</strong>
        <span class="status-pill status-${o.status}">${o.status}</span>
      </div>
      <p>${(o.items || []).map(it => `${it.name} × ${it.quantity}`).join(', ')}</p>
      <p><strong>Total:</strong> ${formatMoney(o.total)}</p>
      <p><small>Placed ${formatDate(o.createdAt)}</small></p>
    </div>
  `).join('') : '<p>No orders yet.</p>';
}

/* ---------------- Points tab ---------------- */
function renderPointsTab(content) {
  const points = (STATE.user && STATE.user.loyaltyPoints) || 0;
  content.innerHTML = `
    <div class="card card-body">
      <h3>Loyalty Points</h3>
      <p class="card-price">${points} pts</p>
      <p>Earn 1 point for every ৳100 spent on services or products. Redeem 100 points for ৳50 off your next visit.</p>
    </div>
  `;
}

/* ---------------- Profile tab ---------------- */
function renderProfileTab(content) {
  const user = STATE.user || {};
  content.innerHTML = `
    <div class="grid-2">
      <div class="card card-body">
        <h3>Edit Profile</h3>
        <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-control" id="pf-name" value="${user.name || ''}"></div>
        <div class="form-group"><label class="form-label">Phone</label><input type="tel" class="form-control" id="pf-phone" value="${user.phone || ''}"></div>
        <button class="btn btn-primary" id="pf-save-btn">Save Changes</button>
      </div>
      <div class="card card-body">
        <h3>Change Password</h3>
        <div class="form-group"><label class="form-label">Current Password</label><input type="password" class="form-control" id="pf-current-pw"></div>
        <div class="form-group"><label class="form-label">New Password</label><input type="password" class="form-control" id="pf-new-pw"></div>
        <button class="btn btn-outline" id="pf-pw-btn">Change Password</button>
      </div>
    </div>
  `;

  qs('#pf-save-btn', content).addEventListener('click', async () => {
    const name = qs('#pf-name', content).value.trim();
    const phone = qs('#pf-phone', content).value.trim();
    const res = await api.put('/auth/profile', { name, phone });
    if (res && res.success) {
      STATE.user = res.user;
      persistState();
      renderHeader();
      showToast('Profile updated', 'success');
    } else {
      showToast((res && res.message) || 'Could not update profile', 'error');
    }
  });

  qs('#pf-pw-btn', content).addEventListener('click', async () => {
    const currentPassword = qs('#pf-current-pw', content).value;
    const newPassword = qs('#pf-new-pw', content).value;
    if (!currentPassword || !newPassword) { showToast('Please fill in both password fields', 'error'); return; }
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    if (res && res.success) {
      showToast('Password changed successfully', 'success');
      qs('#pf-current-pw', content).value = '';
      qs('#pf-new-pw', content).value = '';
    } else {
      showToast((res && res.message) || 'Could not change password', 'error');
    }
  });
}
