function renderHome() {
  const root = document.getElementById('page-root');
  const services = (STATE.services.length ? STATE.services : MOCK_SERVICES)
    .slice().sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0)).slice(0, 6);
  const staff = (STATE.staff.length ? STATE.staff : MOCK_STAFF).slice(0, 4);
  const products = (STATE.products.length ? STATE.products : MOCK_PRODUCTS).filter(p => p.featured).slice(0, 4);
  const reviews = (STATE.reviews.length ? STATE.reviews : MOCK_REVIEWS).slice(0, 3);

  root.innerHTML = `
    <section class="page-section hero hero-killer">
      <span class="hero-blob hero-blob-1"></span>
      <span class="hero-blob hero-blob-2"></span>
      <span class="hero-blob hero-blob-3"></span>
      <span class="hero-sparkle hero-sparkle-1">&#10022;</span>
      <span class="hero-sparkle hero-sparkle-2">&#10023;</span>
      <span class="hero-sparkle hero-sparkle-3">&#10022;</span>
      <div class="hero-inner">
        <div class="hero-copy reveal-up">
          <div class="eyebrow eyebrow-shimmer">Welcome to ${CONFIG.APP_NAME}</div>
          <h1 class="hero-title">Look and feel your <span class="hero-title-glow">best</span>, every day</h1>
          <p>Premium salon &amp; spa services and curated beauty products, delivered with care.</p>
          <div class="header-actions">
            <a href="#/book" class="btn btn-primary btn-lg btn-pulse">Book Now</a>
            <a href="#/shop" class="btn btn-outline btn-lg">Shop Products</a>
          </div>
          <div class="hero-stats hero-stats-row">
            <div><strong data-count="4200">0</strong><p>Happy Clients</p></div>
            <div><strong data-count="15">0</strong><p>Signature Services</p></div>
            <div><strong data-count="98">0</strong><p>% Satisfaction</p></div>
          </div>
        </div>
        <div class="hero-media hero-media-float">
          <img src="assets/images/hero-main.svg" alt="Lumiere Salon &amp; Spa" onerror="this.style.opacity=0">
          <span class="hero-badge hero-badge-1">Fresh Look Daily</span>
          <span class="hero-badge hero-badge-2">4.9 Rated</span>
        </div>
      </div>
    </section>

    <section class="page-section reveal-up">
      <div class="section-heading"><h2>Popular Services</h2><a href="#/services">View all</a></div>
      <div class="grid-3">
        ${services.map((s, i) => `
          <div class="card service-card reveal-up" style="transition-delay:${i * 60}ms">
            <div class="card-media"><img src="${s.image}" alt="${s.name}" onerror="this.style.opacity=0"></div>
            <div class="card-body">
              <div class="card-title">${s.name}</div>
              <p>${s.shortDescription || ''}</p>
              <div class="card-price">${formatMoney(s.price)} &middot; ${s.duration} min</div>
              <button class="btn btn-primary btn-block btn-book-service" data-id="${s._id}">Book</button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="page-section reveal-up">
      <div class="section-heading"><h2>How It Works</h2></div>
      <div class="grid-3">
        <div class="card card-body reveal-up how-it-works-card"><span class="step-num">1</span><h3>Choose a Service</h3><p>Browse our range of hair, skin, nail, massage and package treatments.</p></div>
        <div class="card card-body reveal-up how-it-works-card" style="transition-delay:100ms"><span class="step-num">2</span><h3>Pick Your Stylist &amp; Time</h3><p>Select your favorite stylist or let us match you with the next available.</p></div>
        <div class="card card-body reveal-up how-it-works-card" style="transition-delay:200ms"><span class="step-num">3</span><h3>Relax &amp; Enjoy</h3><p>Arrive and let our team take care of the rest.</p></div>
      </div>
    </section>

    <section class="page-section reveal-up">
      <div class="section-heading"><h2>Meet the Team</h2><a href="#/team">View all</a></div>
      <div class="grid-4">
        ${staff.map((s, i) => `
          <a href="#/team/${s._id}" class="card staff-card reveal-up" style="transition-delay:${i * 60}ms">
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

    <section class="page-section reveal-up">
      <div class="section-heading"><h2>Gallery</h2></div>
      <div class="grid-4">
        ${services.slice(0, 4).map((s, i) => `<div class="card-media reveal-up" style="transition-delay:${i * 60}ms"><img src="${s.image}" alt="${s.name}" onerror="this.style.opacity=0"></div>`).join('')}
      </div>
    </section>

    <section class="page-section reveal-up">
      <div class="section-heading"><h2>What Our Clients Say</h2></div>
      <div class="grid-3">
        ${reviews.map((r, i) => `
          <div class="card card-body reveal-up" style="transition-delay:${i * 60}ms">
            ${stars(r.rating)}
            <p>"${escapeHtml(r.comment)}"</p>
            <strong>${escapeHtml(r.customerName)}</strong>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="page-section reveal-up">
      <div class="section-heading"><h2>Membership Plans</h2></div>
      <div class="grid-3">
        <div class="card card-body reveal-up">
          <h3>Silver</h3>
          <div class="card-price">${formatMoney(1500)}/mo</div>
          <p>10% off all services, priority booking.</p>
          <button class="btn btn-outline btn-block">Join Silver</button>
        </div>
        <div class="card card-body reveal-up membership-highlight" style="transition-delay:100ms">
          <h3>Gold</h3>
          <div class="card-price">${formatMoney(3000)}/mo</div>
          <p>20% off services, 1 free facial monthly, priority booking.</p>
          <button class="btn btn-primary btn-block">Join Gold</button>
        </div>
        <div class="card card-body reveal-up" style="transition-delay:200ms">
          <h3>Platinum</h3>
          <div class="card-price">${formatMoney(5000)}/mo</div>
          <p>30% off services, monthly spa day, dedicated stylist.</p>
          <button class="btn btn-outline btn-block">Join Platinum</button>
        </div>
      </div>
    </section>

    <section class="page-section reveal-up">
      <div class="section-heading"><h2>Shop Best Sellers</h2><a href="#/shop">Shop all</a></div>
      <div class="grid-4">
        ${products.map(p => productCardHTML(p, { quickView: false })).join('')}
      </div>
    </section>

    <section class="page-section reveal-up">
      <div class="section-heading"><h2>Visit Us</h2></div>
      <div class="grid-2">
        <div class="card card-body">
          <h3>Location</h3>
          <p>House 12, Road 5, Banani<br>Dhaka 1213, Bangladesh</p>
        </div>
        <div class="card card-body">
          <h3>Hours</h3>
          <p>Everyday: 9:00 AM &ndash; 9:00 PM</p>
        </div>
      </div>
    </section>

    <section class="page-section reveal-up">
      <div class="section-heading"><h2>Stay in the Loop</h2></div>
      <form class="newsletter-form" id="newsletter-form">
        <input type="email" class="form-control" placeholder="Your email address" required>
        <button type="submit" class="btn btn-primary">Subscribe</button>
      </form>
    </section>
  `;

  initScrollReveal(root);
  animateHeroStats(root);

  qsa('.shop-add-cart', root).forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    const p = products.find(pr => pr._id === btn.dataset.id);
    if (p) {
      addToCart(p, p.variants[0], 1);
      renderHeader();
      if (typeof openCartDrawer === 'function') openCartDrawer();
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

function initScrollReveal(root) {
  const els = qsa('.reveal-up', root);
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

function animateHeroStats(root) {
  const counters = qsa('[data-count]', root);
  counters.forEach(el => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
