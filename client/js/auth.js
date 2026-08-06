// Authentication actions: login, register, logout, fetchMe, route guards.
// api.js never throws — every call resolves to {success,...} or {success:false,message}.

async function login(email, password) {
  const data = await api.post('/auth/login', { email, password });
  if (!data || !data.success) {
    showToast((data && data.message) || 'Login failed', 'error');
    return false;
  }
  STATE.token = data.token;
  STATE.user = data.user;
  STATE.isLoggedIn = true;
  persistState();
  renderHeader();
  showToast('Welcome back, ' + (data.user.name || '') + '!', 'success');

  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const redirect = params.get('redirect');
  if (redirect) {
    location.hash = '#/' + redirect.replace(/^\//, '');
  } else if (data.user.role === 'admin') {
    location.hash = '#/admin';
  } else {
    location.hash = '#/account';
  }
  return true;
}

async function register(fields) {
  const data = await api.post('/auth/register', fields);
  if (!data || !data.success) {
    showToast((data && data.message) || 'Registration failed', 'error');
    return false;
  }
  STATE.token = data.token;
  STATE.user = data.user;
  STATE.isLoggedIn = true;
  persistState();
  renderHeader();
  showToast('Account created! Welcome, ' + (data.user.name || '') + '.', 'success');

  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const redirect = params.get('redirect');
  location.hash = redirect ? '#/' + redirect.replace(/^\//, '') : '#/account';
  return true;
}

function logout() {
  STATE.token = null;
  STATE.user = null;
  STATE.isLoggedIn = false;
  persistState();
  renderHeader();
  showToast('You have been logged out', 'info');
  location.hash = '#/';
}

async function fetchMe() {
  if (!STATE.token) return null;
  const data = await api.get('/auth/me');
  if (data && data.success) {
    STATE.user = data.user;
    STATE.isLoggedIn = true;
    persistState();
    renderHeader();
    return data.user;
  }
  return null;
}

function requireAuth() {
  return !!STATE.isLoggedIn;
}

function requireAdmin() {
  return !!(STATE.isLoggedIn && STATE.user && STATE.user.role === 'admin');
}
