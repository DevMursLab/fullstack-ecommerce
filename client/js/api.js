// API client — talks to the backend, degrades gracefully when unreachable.
// Every call resolves to { success, ...payload } or { success:false, message } — callers never need try/catch.

const API_BASE = CONFIG.API_URL;

async function request(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (STATE.token) headers['Authorization'] = `Bearer ${STATE.token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (res.status === 401) {
      STATE.token = null;
      STATE.user = null;
      STATE.isLoggedIn = false;
      persistState();
      if (typeof showToast === 'function') showToast('Session expired, please log in again.', 'error');
      if (location.hash !== '#/login') location.hash = '#/login';
      return { success: false, message: 'Unauthorized' };
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = { success: false, message: 'Invalid server response' };
    }
    return data;
  } catch (err) {
    console.error('Network error', method, endpoint, err);
    return { success: false, message: 'Network error' };
  }
}

const api = {
  get: (endpoint) => request('GET', endpoint),
  post: (endpoint, body) => request('POST', endpoint, body),
  put: (endpoint, body) => request('PUT', endpoint, body),
  delete: (endpoint) => request('DELETE', endpoint),
  del: (endpoint) => request('DELETE', endpoint)
};

async function preloadData() {
  const [svcRes, staffRes, prodRes, reviewRes] = await Promise.all([
    api.get('/services'),
    api.get('/staff'),
    api.get('/products'),
    api.get('/reviews')
  ]);

  setServices(svcRes && svcRes.success ? svcRes.services : (typeof MOCK_SERVICES !== 'undefined' ? MOCK_SERVICES : []));
  setStaffList(staffRes && staffRes.success ? staffRes.staff : (typeof MOCK_STAFF !== 'undefined' ? MOCK_STAFF : []));
  setProducts(prodRes && prodRes.success ? prodRes.products : (typeof MOCK_PRODUCTS !== 'undefined' ? MOCK_PRODUCTS : []));
  setReviews(reviewRes && reviewRes.success ? reviewRes.reviews : (typeof MOCK_REVIEWS !== 'undefined' ? MOCK_REVIEWS : []));
}
