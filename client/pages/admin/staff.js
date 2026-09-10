// Admin staff: profile cards, add/edit, working-hours editor, leave management.

const ADMIN_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

async function renderAdminStaff() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="admin-shell">
      ${adminSidebarHtml('staff')}
      <main class="admin-main">
        <div class="admin-topbar">
          <h1 class="admin-page-title">Staff</h1>
          <button class="btn btn-primary" id="staff-add-btn">Add Staff</button>
        </div>
        <div class="admin-content">
          <div class="grid-3" id="staff-grid"><p>Loading staff…</p></div>
        </div>
      </main>
    </div>
  `;

  bindAdminSidebar(root);

  async function loadStaff() {
    const grid = qs('#staff-grid', root);
    grid.innerHTML = '<p>Loading staff…</p>';
    const data = await api.get('/staff');
    const staffList = (data && data.success) ? data.staff : [];
    grid.innerHTML = staffList.map(s => `
      <div class="card staff-card" data-id="${s._id}">
        <div class="card-media"><img src="${s.photo}" alt="${s.name}" onerror="this.style.opacity=0"></div>
        <div class="card-body">
          <div class="card-title">${s.name}</div>
          <p>${(s.specialty || []).join(', ')}</p>
          <p>Commission: ${Math.round((s.commissionRate || 0) * 100)}%</p>
          <div class="header-actions">
            <button class="btn btn-outline btn-sm staff-edit-btn" data-id="${s._id}">Edit</button>
            <button class="btn btn-outline btn-sm staff-hours-btn" data-id="${s._id}">Hours</button>
            <button class="btn btn-outline btn-sm staff-leave-btn" data-id="${s._id}">Leave</button>
          </div>
        </div>
      </div>
    `).join('') || '<p>No staff yet.</p>';

    qsa('.staff-edit-btn', grid).forEach(btn => btn.addEventListener('click', () => {
      openStaffForm(staffList.find(s => s._id === btn.dataset.id));
    }));
    qsa('.staff-hours-btn', grid).forEach(btn => btn.addEventListener('click', () => {
      openHoursForm(staffList.find(s => s._id === btn.dataset.id));
    }));
    qsa('.staff-leave-btn', grid).forEach(btn => btn.addEventListener('click', () => {
      openLeaveForm(staffList.find(s => s._id === btn.dataset.id));
    }));
  }

  function openStaffForm(staff) {
    const isEdit = !!staff;
    staff = staff || { name: '', bio: '', specialty: [], commissionRate: 0.3, photo: 'assets/images/staff-placeholder.jpg' };
    openModal(`
      <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Staff</h2><button class="modal-close" aria-label="Close">✕</button></div>
      <div class="modal-body admin-form-grid">
        <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-control" id="stf-name" value="${staff.name}"></div>
        <div class="form-group"><label class="form-label">Photo Path</label><input type="text" class="form-control" id="stf-photo" value="${staff.photo || ''}"></div>
        <div class="form-group"><label class="form-label">Specialty (comma separated)</label><input type="text" class="form-control" id="stf-specialty" value="${(staff.specialty || []).join(', ')}"></div>
        <div class="form-group"><label class="form-label">Commission Rate (0-1)</label><input type="number" step="0.01" class="form-control" id="stf-commission" value="${staff.commissionRate}"></div>
        <div class="form-group"><label class="form-label">Bio</label><textarea class="form-control" id="stf-bio">${staff.bio || ''}</textarea></div>
      </div>
      <div class="modal-footer"><button class="btn btn-primary btn-block" id="stf-save-btn">${isEdit ? 'Save Changes' : 'Create Staff'}</button></div>
    `);
    qs('#stf-save-btn').addEventListener('click', async () => {
      const body = {
        name: qs('#stf-name').value,
        photo: qs('#stf-photo').value,
        specialty: qs('#stf-specialty').value.split(',').map(s => s.trim()).filter(Boolean),
        commissionRate: Number(qs('#stf-commission').value),
        bio: qs('#stf-bio').value
      };
      const res = isEdit ? await api.put(`/staff/${staff._id}`, body) : await api.post('/staff', body);
      if (res && res.success) { showToast(isEdit ? 'Staff updated' : 'Staff created', 'success'); closeModal(); loadStaff(); }
      else showToast((res && res.message) || 'Could not save staff', 'error');
    });
  }

  function openHoursForm(staff) {
    if (!staff) return;
    const wh = staff.workingHours || {};
    openModal(`
      <div class="modal-header"><h2>Working Hours — ${staff.name}</h2><button class="modal-close" aria-label="Close">✕</button></div>
      <div class="modal-body">
        ${ADMIN_DAYS.map(day => {
          const d = wh[day] || { start: '09:00', end: '18:00', isOff: false };
          return `
            <div class="form-row" style="align-items:center;">
              <label style="width:100px;text-transform:capitalize;">${day}</label>
              <input type="time" class="form-control wh-start" data-day="${day}" value="${d.start}">
              <input type="time" class="form-control wh-end" data-day="${day}" value="${d.end}">
              <label class="checkbox-row"><input type="checkbox" class="wh-off" data-day="${day}" ${d.isOff ? 'checked' : ''}> Off</label>
            </div>
          `;
        }).join('')}
      </div>
      <div class="modal-footer"><button class="btn btn-primary btn-block" id="wh-save-btn">Save Hours</button></div>
    `);
    qs('#wh-save-btn').addEventListener('click', async () => {
      const workingHours = {};
      ADMIN_DAYS.forEach(day => {
        workingHours[day] = {
          start: qs(`.wh-start[data-day="${day}"]`).value,
          end: qs(`.wh-end[data-day="${day}"]`).value,
          isOff: qs(`.wh-off[data-day="${day}"]`).checked
        };
      });
      const res = await api.put(`/staff/${staff._id}/schedule`, { workingHours });
      if (res && res.success) { showToast('Working hours updated', 'success'); closeModal(); loadStaff(); }
      else showToast((res && res.message) || 'Could not update schedule', 'error');
    });
  }

  function openLeaveForm(staff) {
    if (!staff) return;
    const leaveChips = (leaves) => (leaves || []).length
      ? leaves.map(l => {
          const d = l.date || l;
          return `<span class="badge badge-info lv-chip" data-date="${d}">${d}${l.reason ? ' — ' + escapeHtml(l.reason) : ''} <button type="button" class="lv-remove" data-date="${d}" aria-label="Remove leave" title="Remove">✕</button></span>`;
        }).join(' ')
      : '<span class="text-muted">No leave days yet.</span>';

    openModal(`
      <div class="modal-header"><h2>Leave — ${staff.name}</h2><button class="modal-close" aria-label="Close">✕</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-control" id="lv-date"></div>
        <div class="form-group"><label class="form-label">Reason (optional)</label><input type="text" class="form-control" id="lv-reason"></div>
        <div class="form-group"><label class="form-label">Existing leave days</label><div id="lv-list">${leaveChips(staff.leaves)}</div></div>
      </div>
      <div class="modal-footer"><button class="btn btn-primary btn-block" id="lv-save-btn">Add Leave</button></div>
    `);

    function bindRemoveButtons() {
      qsa('#lv-list .lv-remove').forEach(btn => btn.addEventListener('click', async () => {
        const date = btn.dataset.date;
        btn.disabled = true;
        const res = await api.del(`/staff/${staff._id}/leave?date=${encodeURIComponent(date)}`);
        if (res && res.success) {
          showToast('Leave removed', 'success');
          staff.leaves = res.staff && res.staff.leaves ? res.staff.leaves : (staff.leaves || []).filter(l => (l.date || l) !== date);
          qs('#lv-list').innerHTML = leaveChips(staff.leaves);
          bindRemoveButtons();
          loadStaff();
        } else {
          btn.disabled = false;
          showToast((res && res.message) || 'Could not remove leave', 'error');
        }
      }));
    }
    bindRemoveButtons();

    qs('#lv-save-btn').addEventListener('click', async () => {
      const date = qs('#lv-date').value;
      if (!date) { showToast('Please choose a date', 'error'); return; }
      const res = await api.post(`/staff/${staff._id}/leave`, { date, reason: qs('#lv-reason').value });
      if (res && res.success) {
        showToast('Leave added', 'success');
        staff.leaves = res.staff && res.staff.leaves ? res.staff.leaves : [...(staff.leaves || []), { date, reason: qs('#lv-reason').value }];
        qs('#lv-date').value = '';
        qs('#lv-reason').value = '';
        qs('#lv-list').innerHTML = leaveChips(staff.leaves);
        bindRemoveButtons();
        loadStaff();
      } else {
        showToast((res && res.message) || 'Could not add leave', 'error');
      }
    });
  }

  qs('#staff-add-btn', root).addEventListener('click', () => openStaffForm(null));
  loadStaff();
}
