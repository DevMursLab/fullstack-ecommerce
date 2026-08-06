// Admin services: CRUD table with create/edit modal, active toggle, delete (soft-deactivate).

async function renderAdminServices() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="admin-shell">
      ${adminSidebarHtml('services')}
      <main class="admin-main">
        <div class="admin-topbar">
          <h1 class="admin-page-title">Services</h1>
          <button class="btn btn-primary" id="svc-add-btn">Add Service</button>
        </div>
        <div class="admin-content">
          <div id="svc-table-wrap"><p>Loading services…</p></div>
        </div>
      </main>
    </div>
  `;

  bindAdminSidebar(root);

  let staffList = STATE.staff.length ? STATE.staff : MOCK_STAFF;

  async function loadServices() {
    const wrap = qs('#svc-table-wrap', root);
    wrap.innerHTML = '<p>Loading services…</p>';
    const data = await api.get('/services');
    const services = (data && data.success) ? data.services : [];
    wrap.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Category</th><th>Duration</th><th>Price</th><th>Active</th><th></th></tr></thead>
          <tbody>
            ${services.map(s => `
              <tr data-id="${s._id}">
                <td>${s.name}</td>
                <td>${s.category}</td>
                <td>${s.duration} min</td>
                <td>${formatMoney(s.price)}</td>
                <td><label class="checkbox-row"><input type="checkbox" class="svc-active-toggle" data-id="${s._id}" ${s.isActive ? 'checked' : ''}></label></td>
                <td class="row-actions">
                  <button class="btn btn-outline btn-sm svc-edit-btn" data-id="${s._id}">Edit</button>
                  <button class="btn btn-danger btn-sm svc-delete-btn" data-id="${s._id}">Delete</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="6">No services yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    qsa('.svc-active-toggle', wrap).forEach(cb => cb.addEventListener('change', async () => {
      const res = await api.put(`/services/${cb.dataset.id}`, { isActive: cb.checked });
      if (res && res.success) showToast('Service updated', 'success');
      else { showToast((res && res.message) || 'Could not update service', 'error'); loadServices(); }
    }));
    qsa('.svc-edit-btn', wrap).forEach(btn => btn.addEventListener('click', () => {
      const svc = services.find(s => s._id === btn.dataset.id);
      openServiceForm(svc);
    }));
    qsa('.svc-delete-btn', wrap).forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('Deactivate this service?')) return;
      const res = await api.del(`/services/${btn.dataset.id}`);
      if (res && res.success) { showToast('Service deactivated', 'success'); loadServices(); }
      else showToast((res && res.message) || 'Could not delete service', 'error');
    }));
  }

  function openServiceForm(svc) {
    const isEdit = !!svc;
    svc = svc || { name: '', category: 'Hair', duration: 30, price: 0, memberPrice: 0, description: '', shortDescription: '', addOns: [], availableStaff: [] };
    openModal(`
      <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Service</h2><button class="modal-close" aria-label="Close">✕</button></div>
      <div class="modal-body admin-form-grid">
        <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-control" id="sf-name" value="${svc.name}"></div>
        <div class="form-group"><label class="form-label">Category</label>
          <select class="form-control" id="sf-category">
            ${['Hair','Skin','Nails','Massage','Package'].map(c => `<option value="${c}" ${svc.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Duration (min)</label><input type="number" class="form-control" id="sf-duration" value="${svc.duration}"></div>
        <div class="form-group"><label class="form-label">Price</label><input type="number" class="form-control" id="sf-price" value="${svc.price}"></div>
        <div class="form-group"><label class="form-label">Member Price</label><input type="number" class="form-control" id="sf-member-price" value="${svc.memberPrice || 0}"></div>
        <div class="form-group"><label class="form-label">Short Description</label><input type="text" class="form-control" id="sf-short-desc" value="${svc.shortDescription || ''}"></div>
        <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="sf-desc">${svc.description || ''}</textarea></div>
        <div class="form-group">
          <label class="form-label">Available Staff</label>
          ${staffList.map(st => `<label class="checkbox-row"><input type="checkbox" class="sf-staff-cb" value="${st._id}" ${(svc.availableStaff || []).some(id => (id === st._id || id._id === st._id)) ? 'checked' : ''}> ${st.name}</label>`).join('')}
        </div>
        <div class="form-group">
          <label class="form-label">Add-Ons (name:price:duration, one per line)</label>
          <textarea class="form-control" id="sf-addons">${(svc.addOns || []).map(a => `${a.name}:${a.price}:${a.duration || 0}`).join('\n')}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-block" id="sf-save-btn">${isEdit ? 'Save Changes' : 'Create Service'}</button>
      </div>
    `);

    qs('#sf-save-btn').addEventListener('click', async () => {
      const addOns = qs('#sf-addons').value.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
        const [name, price, duration] = line.split(':');
        return { name: (name || '').trim(), price: Number(price) || 0, duration: Number(duration) || 0 };
      });
      const availableStaff = qsa('.sf-staff-cb').filter(cb => cb.checked).map(cb => cb.value);
      const body = {
        name: qs('#sf-name').value,
        category: qs('#sf-category').value,
        duration: Number(qs('#sf-duration').value),
        price: Number(qs('#sf-price').value),
        memberPrice: Number(qs('#sf-member-price').value),
        shortDescription: qs('#sf-short-desc').value,
        description: qs('#sf-desc').value,
        addOns,
        availableStaff
      };
      const res = isEdit ? await api.put(`/services/${svc._id}`, body) : await api.post('/services', body);
      if (res && res.success) {
        showToast(isEdit ? 'Service updated' : 'Service created', 'success');
        closeModal();
        loadServices();
      } else {
        showToast((res && res.message) || 'Could not save service', 'error');
      }
    });
  }

  qs('#svc-add-btn', root).addEventListener('click', () => openServiceForm(null));
  loadServices();
}
