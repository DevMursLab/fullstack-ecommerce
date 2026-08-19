// API client — talks to the backend, degrades gracefully when unreachable.
// Every call resolves to { success, ...payload } or { success:false, message } — callers never need try/catch.

const API_BASE = CONFIG.API_URL;

async function request(method, endpoint, body = null, timeoutMs = 15000) {
  const headers = { 'Content-Type': 'application/json' };
  if (STATE.token) headers['Authorization'] = `Bearer ${STATE.token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    if (res.status === 401 && endpoint !== '/auth/login') {
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
    if (err.name === 'AbortError') {
      console.error('Request timed out', method, endpoint);
      return { success: false, message: 'Request timed out' };
    }
    console.error('Network error', method, endpoint, err);
    return { success: false, message: 'Network error' };
  } finally {
    clearTimeout(timer);
  }
}

const api = {
  get: (endpoint, timeoutMs) => request('GET', endpoint, null, timeoutMs),
  post: (endpoint, body) => request('POST', endpoint, body),
  put: (endpoint, body) => request('PUT', endpoint, body),
  delete: (endpoint) => request('DELETE', endpoint),
  del: (endpoint) => request('DELETE', endpoint)
};

async function preloadData() {
  // Short timeout on the initial boot fetch — a cold backend (e.g. Render free-tier
  // spin-up) can take a minute or more, but the app must render with mock data well
  // before that so a visitor is never stuck looking at a blank page. Pages that need
  // fresher data can always re-fetch after the first render.
  const BOOT_TIMEOUT_MS = 20000;
  const [svcRes, staffRes, prodRes, reviewRes] = await Promise.all([
    api.get('/services', BOOT_TIMEOUT_MS),
    api.get('/staff', BOOT_TIMEOUT_MS),
    api.get('/products', BOOT_TIMEOUT_MS),
    api.get('/reviews', BOOT_TIMEOUT_MS)
  ]);

  const usedMockServices = !(svcRes && svcRes.success);
  const usedMockStaff = !(staffRes && staffRes.success);

  setServices(svcRes && svcRes.success ? svcRes.services : (typeof MOCK_SERVICES !== 'undefined' ? MOCK_SERVICES : []));
  setStaffList(staffRes && staffRes.success ? staffRes.staff : (typeof MOCK_STAFF !== 'undefined' ? MOCK_STAFF : []));
  setProducts(prodRes && prodRes.success ? prodRes.products : (typeof MOCK_PRODUCTS !== 'undefined' ? MOCK_PRODUCTS : []));
  setReviews(reviewRes && reviewRes.success ? reviewRes.reviews : (typeof MOCK_REVIEWS !== 'undefined' ? MOCK_REVIEWS : []));

  // Mock services/staff use placeholder ids (e.g. "svc1", "stf1") that the real backend
  // doesn't recognize — if the boot fetch timed out on a cold backend and we fell back to
  // mock data, those fake ids would later 404 against real endpoints like /appointments/slots.
  // Track it so booking can swap in real data before it depends on staff/service ids.
  STATE.usingMockServices = usedMockServices;
  STATE.usingMockStaff = usedMockStaff;
}

// Retries fetching real services/staff (with a longer timeout for a cold backend) and
// swaps them into STATE if the boot preload had fallen back to mock data. Safe to call
// repeatedly — it's a no-op once real data is loaded.
async function ensureLiveBookingData() {
  if (!STATE.usingMockServices && !STATE.usingMockStaff) return true;
  const RETRY_TIMEOUT_MS = 45000;
  const [svcRes, staffRes] = await Promise.all([
    STATE.usingMockServices ? api.get('/services', RETRY_TIMEOUT_MS) : Promise.resolve(null),
    STATE.usingMockStaff ? api.get('/staff', RETRY_TIMEOUT_MS) : Promise.resolve(null)
  ]);

  if (svcRes && svcRes.success) {
    setServices(svcRes.services);
    STATE.usingMockServices = false;
    // The user may have already selected services (in step 1) while mock data with fake
    // ids like "svc1" was loaded — remap those selections onto the real records (matched
    // by name, which mock and seeded data share) so the real ids flow into slot/booking calls.
    STATE.booking.selectedServices = STATE.booking.selectedServices
      .map(sel => STATE.services.find(s => s.name === sel.name) || sel);
  }
  if (staffRes && staffRes.success) {
    setStaffList(staffRes.staff);
    STATE.usingMockStaff = false;
    if (STATE.booking.staffId) {
      const prevMock = (typeof MOCK_STAFF !== 'undefined' ? MOCK_STAFF : []).find(s => s._id === STATE.booking.staffId);
      if (prevMock) {
        const realMatch = STATE.staff.find(s => s.name === prevMock.name);
        STATE.booking.staffId = realMatch ? realMatch._id : null;
      }
    }
  }
  return !STATE.usingMockServices && !STATE.usingMockStaff;
}
