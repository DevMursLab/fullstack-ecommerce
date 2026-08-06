function renderTeam() {
  const root = document.getElementById('page-root');
  const staff = STATE.staff.length ? STATE.staff : MOCK_STAFF;

  root.innerHTML = `
    <section class="page-section">
      <div class="section-heading"><h1>Meet Our Team</h1></div>
      <div class="grid-3">
        ${staff.map(s => `
          <a href="#/team/${s._id}" class="card staff-card">
            <div class="card-media"><img src="${s.photo}" alt="${s.name}" onerror="this.style.opacity=0"></div>
            <div class="card-body">
              <div class="card-title">${s.name}</div>
              ${stars(s.rating)}
              <p>${(s.specialty || []).join(', ')}</p>
            </div>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

function renderStaffProfile(params) {
  const root = document.getElementById('page-root');
  const staff = STATE.staff.length ? STATE.staff : MOCK_STAFF;
  const person = staff.find(s => s._id === params.id);

  if (!person) {
    root.innerHTML = '<div class="page-section"><div class="empty-state"><h2>Stylist not found</h2><a href="#/team" class="btn btn-primary">Back to Team</a></div></div>';
    return;
  }

  const reviews = MOCK_REVIEWS.filter(r => r.type === 'staff' && r.referenceId === person._id);

  root.innerHTML = `
    <section class="page-section">
      <div class="grid-2">
        <div class="card-media"><img src="${person.photo}" alt="${person.name}" onerror="this.style.opacity=0"></div>
        <div>
          <h1>${person.name}</h1>
          ${stars(person.rating)}
          <p>${person.bio || ''}</p>
          <div>${(person.specialty || []).map(s => `<span class="badge badge-info">${s}</span>`).join(' ')}</div>
          <button class="btn btn-primary btn-lg" id="book-with-btn" style="margin-top:1rem;">Book with ${person.name.split(' ')[0]}</button>
        </div>
      </div>
      <div class="section-heading" style="margin-top:2rem;"><h2>Client Reviews</h2></div>
      <div class="grid-3">
        ${reviews.length ? reviews.map(r => `
          <div class="card card-body">
            ${stars(r.rating)}
            <p>"${r.comment}"</p>
            <strong>${r.customerName}</strong>
          </div>
        `).join('') : '<p>No reviews yet.</p>'}
      </div>
    </section>
  `;

  qs('#book-with-btn', root).addEventListener('click', () => {
    setStaff(person._id);
    location.hash = '#/book';
  });
}
