// Hash-based router.

const ROUTES = [
  { path: '/', render: () => renderHome(), access: 'public' },
  { path: '/services', render: (p, q) => renderServices(p, q), access: 'public' },
  { path: '/book', render: (p, q) => renderBooking(p, q), access: 'public' },
  { path: '/book/confirm', render: () => renderBookingDone(), access: 'public' },
  { path: '/team', render: () => renderTeam(), access: 'public' },
  { path: '/team/:id', render: (p) => renderStaffProfile(p), access: 'public' },
  { path: '/shop', render: (p, q) => renderShop(p, q), access: 'public' },
  { path: '/product/:id', render: (p) => renderProduct(p.id), access: 'public' },
  { path: '/cart', render: () => renderCart(), access: 'public' },
  { path: '/checkout', render: () => renderCheckout(), access: 'public' },
  { path: '/order/success', render: () => renderOrderDone(), access: 'public' },
  { path: '/about', render: () => renderAbout(), access: 'public' },
  { path: '/login', render: (p, q) => renderLogin(p, q), access: 'guest' },
  { path: '/register', render: (p, q) => renderRegister(p, q), access: 'guest' },
  { path: '/account', render: (p, q) => renderAccount(p, q), access: 'customer' },

  { path: '/admin', render: () => renderAdminDashboard(), access: 'admin' },
  { path: '/admin/appointments', render: () => renderAdminAppointments(), access: 'admin' },
  { path: '/admin/services', render: () => renderAdminServices(), access: 'admin' },
  { path: '/admin/staff', render: () => renderAdminStaff(), access: 'admin' },
  { path: '/admin/products', render: () => renderAdminProducts(), access: 'admin' },
  { path: '/admin/orders', render: () => renderAdminOrders(), access: 'admin' },
  { path: '/admin/customers', render: () => renderAdminCustomers(), access: 'admin' },
  { path: '/admin/payments', render: () => renderAdminPayments(), access: 'admin' },
  { path: '/admin/coupons', render: () => renderAdminCoupons(), access: 'admin' }
];

function canAccess(level) {
  if (level === 'public') return true;
  if (level === 'guest') return !STATE.isLoggedIn;
  if (level === 'customer') return !!STATE.isLoggedIn;
  if (level === 'admin') return !!(STATE.isLoggedIn && STATE.user && STATE.user.role === 'admin');
  return true;
}

function parseRoute(hash) {
  let raw = hash.replace(/^#/, '');
  if (!raw) raw = '/';
  const [pathPart, queryPart] = raw.split('?');
  const query = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((value, key) => { query[key] = value; });
  }
  const pathSegments = pathPart.split('/').filter((s, i) => !(i === 0 && s === ''));
  return { pathPart: pathPart || '/', pathSegments, query };
}

function matchRoute(pathPart) {
  const requestSegments = pathPart.split('/').filter(Boolean);
  for (const route of ROUTES) {
    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== requestSegments.length) continue;
    const params = {};
    let matched = true;
    for (let i = 0; i < routeSegments.length; i++) {
      const rs = routeSegments[i];
      const qsSeg = requestSegments[i];
      if (rs.startsWith(':')) {
        params[rs.slice(1)] = decodeURIComponent(qsSeg);
      } else if (rs !== qsSeg) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params };
  }
  return null;
}

function router() {
  const { pathPart, query } = parseRoute(location.hash);
  const matched = matchRoute(pathPart);

  const pageRoot = document.getElementById('page-root');
  if (!pageRoot) return;

  if (!matched) {
    pageRoot.innerHTML = '<div class="page-section"><div class="empty-state"><h2>Page not found</h2><a href="#/" class="btn btn-primary">Go Home</a></div></div>';
    afterRouteRender('/404');
    return;
  }

  const { route, params } = matched;

  if (!canAccess(route.access)) {
    if (route.access === 'guest') {
      location.hash = '#/account';
      return;
    }
    const redirectPath = pathPart.replace(/^\//, '');
    location.hash = '#/login?redirect=' + encodeURIComponent(redirectPath);
    return;
  }

  pageRoot.innerHTML = '';
  route.render(params, query);
  afterRouteRender(pathPart);
}

function afterRouteRender(pathPart) {
  window.scrollTo(0, 0);
  qsa('.nav-link').forEach(link => {
    const dataPath = link.getAttribute('data-path');
    if (dataPath) {
      link.classList.toggle('active', dataPath === pathPart);
    }
  });
}

window.addEventListener('hashchange', router);

// Defensive fallbacks — defined here (not ui.js) since router.js has proven the most stable
// file to extend; these are only used if not already provided elsewhere.
if (typeof render404 !== 'function') {
  window.render404 = function render404() {
    const root = document.getElementById('page-root') || document.getElementById('app');
    if (!root) return;
    root.innerHTML = `
      <div class="container page-section text-center">
        <h1>404</h1>
        <p class="mt-4">The page you're looking for doesn't exist.</p>
        <a href="#/" class="btn btn-primary mt-6">Back to Home</a>
      </div>
    `;
  };
}

if (typeof updateActiveNavLink !== 'function') {
  window.updateActiveNavLink = function updateActiveNavLink(path) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkPath = link.dataset.path;
      const href = (link.getAttribute('href') || '').replace(/^#/, '');
      link.classList.toggle('active', linkPath ? linkPath === path : href === path);
    });
  };
}

if (typeof observeScrollReveal !== 'function') {
  window.observeScrollReveal = function observeScrollReveal() {
    const els = document.querySelectorAll('.scroll-reveal:not(.revealed), .reveal:not(.revealed)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => observer.observe(el));
  };
}
