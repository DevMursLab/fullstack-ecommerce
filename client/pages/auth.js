// Login / register pages

async function renderLogin() {
  const app = _pageRoot();
  if (!app) return;
  app.innerHTML = `
    <section class="auth-page">
      <div class="auth-card">
        <h1>Welcome Back</h1>
        <p>Log in to manage your bookings and orders.</p>
        <form id="login-form" class="form-grid">
          <label class="full-width">Email<input type="email" name="email" required></label>
          <label class="full-width">Password<input type="password" name="password" required></label>
        </form>
        <div id="login-error" class="form-error"></div>
        <button class="btn btn-primary btn-block" id="login-submit-btn">Log In</button>
        <p class="auth-switch">Don't have an account? <a href="#/register">Register</a></p>
      </div>
    </section>
  `;

  const form = qs('#login-form');
  const submit = async () => {
    const errorEl = qs('#login-error');
    errorEl.textContent = '';
    if (!form.email.value || !form.password.value) {
      errorEl.textContent = 'Please enter your email and password.';
      return;
    }
    const btn = qs('#login-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Logging in…';
    const ok = await login(form.email.value, form.password.value);
    if (!ok) {
      btn.disabled = false;
      btn.textContent = 'Log In';
    }
  };
  qs('#login-submit-btn').addEventListener('click', submit);
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
}

async function renderRegister() {
  const app = _pageRoot();
  if (!app) return;
  app.innerHTML = `
    <section class="auth-page">
      <div class="auth-card">
        <h1>Create Your Account</h1>
        <p>Join Lumière for faster booking and exclusive offers.</p>
        <form id="register-form" class="form-grid">
          <label class="full-width">Full Name<input type="text" name="name" required></label>
          <label class="full-width">Email<input type="email" name="email" required></label>
          <label class="full-width">Phone<input type="tel" name="phone" required></label>
          <label class="full-width">Password<input type="password" name="password" minlength="6" required></label>
        </form>
        <div id="register-error" class="form-error"></div>
        <button class="btn btn-primary btn-block" id="register-submit-btn">Create Account</button>
        <p class="auth-switch">Already have an account? <a href="#/login">Log in</a></p>
      </div>
    </section>
  `;

  const form = qs('#register-form');
  const submit = async () => {
    const errorEl = qs('#register-error');
    errorEl.textContent = '';
    if (!form.name.value || !form.email.value || !form.phone.value || !form.password.value) {
      errorEl.textContent = 'Please fill in all fields.';
      return;
    }
    const btn = qs('#register-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Creating account…';
    const ok = await register({
      name: form.name.value, email: form.email.value, phone: form.phone.value, password: form.password.value
    });
    if (!ok) {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  };
  qs('#register-submit-btn').addEventListener('click', submit);
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
}
