let _servicesActiveCategory = 'All';

function renderServices() {
  const root = document.getElementById('page-root');
  const allServices = STATE.services.length ? STATE.services : MOCK_SERVICES;
  const categories = ['All', 'Hair', 'Skin', 'Nails', 'Massage', 'Package'];

  root.innerHTML = `
    <section class="page-section">
      <div class="section-heading"><h1>Our Services</h1></div>
      <div class="tabs" id="service-tabs">
        ${categories.map(c => `<button class="tab-btn${c === _servicesActiveCategory ? ' active' : ''}" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="grid-3" id="service-grid"></div>
    </section>
  `;

  function renderGrid() {
    const filtered = _servicesActiveCategory === 'All'
      ? allServices
      : allServices.filter(s => s.category === _servicesActiveCategory);
    const grid = qs('#service-grid', root);
    grid.innerHTML = filtered.map(s => `
      <div class="card service-card" data-id="${s._id}">
        <div class="card-media"><img src="${s.image}" alt="${s.name}" onerror="this.style.opacity=0"></div>
        <div class="card-body">
          <div class="card-title">${s.name}</div>
          <p>${s.shortDescription || ''}</p>
          <div class="card-price">${formatMoney(s.price)} · ${s.duration} min</div>
          <div class="header-actions">
            <button class="btn btn-outline btn-sm btn-view-service" data-id="${s._id}">Details</button>
            <button class="btn btn-primary btn-sm btn-book-service" data-id="${s._id}">Book</button>
          </div>
        </div>
      </div>
    `).join('') || '<div class="empty-state"><p>No services in this category yet.</p></div>';

    qsa('.btn-book-service', grid).forEach(btn => btn.addEventListener('click', () => {
      const svc = allServices.find(s => s._id === btn.dataset.id);
      if (svc) selectService(svc);
      try { sessionStorage.setItem('lumiere_booking_session_active', '1'); } catch (err) { /* ignore */ }
      location.hash = '#/book';
    }));
    qsa('.btn-view-service', grid).forEach(btn => btn.addEventListener('click', () => {
      const svc = allServices.find(s => s._id === btn.dataset.id);
      if (svc) openServiceModal(svc);
    }));
  }

  function openServiceModal(svc) {
    const staffList = STATE.staff.length ? STATE.staff : MOCK_STAFF;
    const availableNames = (svc.availableStaff || [])
      .map(id => {
        const found = staffList.find(st => st._id === id || st._id === (id && id._id));
        return found ? found.name : null;
      })
      .filter(Boolean);

    openModal(`
      <div class="modal-header">
        <h2>${svc.name}</h2>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        <img src="${svc.image}" alt="${svc.name}" style="width:100%;border-radius:8px;margin-bottom:1rem;" onerror="this.style.display='none'">
        <p>${svc.description}</p>
        <p><strong>Duration:</strong> ${svc.duration} min &nbsp; <strong>Price:</strong> ${formatMoney(svc.price)}</p>
        ${svc.addOns && svc.addOns.length ? `
          <h4>Add-Ons</h4>
          <ul>${svc.addOns.map(a => `<li>${a.name} — ${formatMoney(a.price)}</li>`).join('')}</ul>
        ` : ''}
        ${availableNames.length ? `<h4>Available Stylists</h4><p>${availableNames.join(', ')}</p>` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-block" id="modal-book-btn">Book This Service</button>
      </div>
    `);
    const bookBtn = qs('#modal-book-btn');
    if (bookBtn) bookBtn.addEventListener('click', () => {
      selectService(svc);
      try { sessionStorage.setItem('lumiere_booking_session_active', '1'); } catch (err) { /* ignore */ }
      closeModal();
      location.hash = '#/book';
    });
  }

  qsa('#service-tabs .tab-btn', root).forEach(btn => btn.addEventListener('click', () => {
    _servicesActiveCategory = btn.dataset.cat;
    qsa('#service-tabs .tab-btn', root).forEach(b => b.classList.toggle('active', b === btn));
    renderGrid();
  }));

  renderGrid();
}
