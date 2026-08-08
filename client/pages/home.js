function renderHome() {
  const root = document.getElementById('page-root');
  const services = (STATE.services.length ? STATE.services : MOCK_SERVICES)
    .slice().sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0)).slice(0, 6);
  const staff = (STATE.staff.length ? STATE.staff : MOCK_STAFF).slice(0, 4);
  const products = (STATE.products.length ? STATE.products : MOCK_PRODUCTS).filter(p => p.featured).slice(0, 4);
  const reviews = (STATE.reviews.length ? STATE.reviews : MOCK_REVIEWS).slice(0, 3);

  root.innerHTML = `
    <section class="page-section hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <div class="eyebrow">Welcome to ${CONFIG.APP_NAME}</div>
          <h1>Look and feel your best, every day</h1>
          <p>Premium salon &amp; spa services and curated beauty products, delivered with care.</p>
          <div class="header-actions">
            <a href="#/book" class="btn btn-primary btn-lg">Book Now</a>
            <a href="#/shop" class="btn btn-outline btn-lg">Shop Products</a>
          </div>
        </div>
        <div class="hero-media"><img src="assets/images/hero-main.svg" alt="Lumière Salon & Spa" onerror="this.style.opacity=0"></div>
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading"><h2>Popular Services</h2><a href="#/services">View all</a></div>
      <div class="grid-3">
        ${services.map(s => `
          <div class="card service-card">
            <div class="card-media"><img src="${s.image}" alt="${s.name}" onerror="this.style.opacity=0"></div>
            <div class="card-body">
              <div class="card-title">${s.name}</div>
              <p>${s.shortDescription || ''}</p>
              <div class="card-price">${formatMoney(s.price)} · ${s.duration} min</div>
              <button class="btn btn-primary btn-block btn-book-service" data-id="${s._id}">Book</button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading"><h2>How It Works</h2></div>
      <div class="grid-3">
        <div class="card card-body"><h3>1. Choose a Service</h3><p>Browse our range of hair, skin, nail, massage and package treatments.</p></div>
        <div class="card card-body"><h3>2. Pick Your Stylist &amp; Time</h3><p>Select your favorite stylist or let us match you with the next available.</p></div>
        <div class="card card-body"><h3>3. Relax &amp; Enjoy</h3><p>Arrive and let our team take care of the rest.</p></div>
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading"><h2>Meet the Team</h2><a href="#/team">View all</a></div>
      <div class="grid-4">
        ${staff.map(s => `
          <a href="#/team/${s._id}" class="card staff-card">
            <div class="card-media"><img src="${s.photo}" alt="${s.name}" onerror="this.style.opacity=0"></div>
            <div class="card-body">
              <div class="card-title">${s.name}</div>
              <p>${(s.specialty || []).slice(0, 2).join(', ')}</p>
              ${stars(s.rating)}
            </div>
          </a>
        `).join('')}
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading"><h2>Gallery</h2></div>
      <div class="grid-4">
        ${services.slice(0, 4).map(s => `<div class="card-media"><img src="${s.image}" alt="${s.name}" onerror="this.style.opacity=0"></div>`).join('')}
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading"><h2>What Our Clients Say</h2></div>
      <div class="grid-3">
        ${reviews.map(r => `
          <div class="card card-body">
            ${stars(r.rating)}
            <p>"${escapeHtml(r.comment)}"</p>
            <strong>${escapeHtml(r.customerName)}</strong>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading"><h2>Membership Plans</h2></div>
      <div class="grid-3">
        <div class="card card-body">
          <h3>Silver</h3>
          <div class="card-price">${formatMoney(1500)}/mo</div>
          <p>10% off all services, priority booking.</p>
          <button class="btn btn-outline btn-block">Join Silver</button>
        </div>
        <div class="card card-body">
          <h3>Gold</h3>
          <div class="card-price">${formatMoney(3000)}/mo</div>
          <p>20% off services, 1 free facial monthly, priority booking.</p>
          <button class="btn btn-primary btn-block">Join Gold</button>
        </div>
        <div class="card card-body">
          <h3>Platinum</h3>
          <div class="card-price">${formatMoney(5000)}/mo</div>
          <p>30% off services, monthly spa day, dedicated stylist.</p>
          <button class="btn btn-outline btn-block">Join Platinum</button>
        </div>
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading"><h2>Shop Best Sellers</h2><a href="#/shop">Shop all</a></div>
      <div class="grid-4">
        ${products.map(p => productCardHTML(p, { quickView: false })).join('')}
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading"><h2>Visit Us</h2></div>
      <div class="grid-2">
        <div class="card card-body">
          <h3>Location</h3>
          <p>House 12, Road 5, Banani<br>Dhaka 1213, Bangladesh</p>
        </div>
        <div class="card card-body">
          <h3>Hours</h3>
          <p>Everyday: 9:00 AM – 9:00 PM</p>
        </div>
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading"><h2>Stay in the Loop</h2></div>
      <form class="newsletter-form" id="newsletter-form">
        <input type="email" class="form-control" placeholder="Your email address" required>
        <button type="submit" class="btn btn-primary">Subscribe</button>
      </form>
    </section>
  `;

  qsa('.shop-add-cart', root).forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    const p = products.find(pr => pr._id === btn.dataset.id);
    if (p) {
      addToCart(p, p.variants[0], 1);
      renderHeader();
      if (typeof renderCartDrawer === 'function') renderCartDrawer();
      showToast('Added to cart', 'success');
    }
  }));

  qsa('.btn-book-service', root).forEach(btn => btn.addEventListener('click', () => {
    const svc = services.find(s => s._id === btn.dataset.id);
    if (svc) selectService(svc);
    try { sessionStorage.setItem('lumiere_booking_session_active', '1'); } catch (err) { /* ignore */ }
    location.hash = '#/book';
  }));

  const newsletterForm = qs('#newsletter-form', root);
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Thanks for subscribing!', 'success');
      newsletterForm.reset();
    });
  }
}
