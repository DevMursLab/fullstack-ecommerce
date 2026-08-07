let _bookingCalYear, _bookingCalMonth, _bookingActiveCategory = 'All';

function renderBooking() {
  const root = document.getElementById('page-root');
  const today = new Date();

  // Guard against stale booking state leaking to a new visitor on a shared device:
  // `lumiere_booking_session_active` is a sessionStorage flag (tab/browser-session scoped).
  // If it isn't set, this is a genuinely fresh visit to /book in this tab (first load,
  // or a new tab/session after a previous one ended) — clear any leftover wizard state
  // (including selected services/step, which live in localStorage and could otherwise
  // survive across different users on the same machine). If it IS set, the user is
  // simply refreshing or re-navigating mid-flow within the same tab, so we preserve it.
  try {
    if (!sessionStorage.getItem('lumiere_booking_session_active')) {
      resetBooking();
      sessionStorage.setItem('lumiere_booking_session_active', '1');
    }
  } catch (err) { /* sessionStorage unavailable — proceed without the guard */ }
  if (_bookingCalYear === undefined) {
    _bookingCalYear = today.getFullYear();
    _bookingCalMonth = today.getMonth();
  }

  root.innerHTML = `
    <section class="page-section">
      <div class="step-indicator" id="step-indicator"></div>
      <div class="wizard-layout">
        <div class="wizard-content" id="wizard-content"></div>
        <aside class="wizard-summary" id="wizard-summary"></aside>
      </div>
    </section>
  `;

  renderStepIndicator();
  renderWizardStep();
  renderWizardSummary();
}

function renderStepIndicator() {
  const labels = ['Services', 'Stylist', 'Date & Time', 'Your Info', 'Payment'];
  const el = qs('#step-indicator');
  const step = STATE.booking.step;
  el.innerHTML = labels.map((l, i) => {
    const n = i + 1;
    const cls = n < step ? 'done' : n === step ? 'active' : '';
    return `
      <div class="step-dot ${cls}">
        <div class="step-circle">${n}</div>
        <span>${l}</span>
      </div>
      ${n < labels.length ? '<div class="step-line"></div>' : ''}
    `;
  }).join('');
}

function renderWizardSummary() {
  const el = qs('#wizard-summary');
  if (!el) return;
  const b = STATE.booking;
  el.innerHTML = `
    <h3>Your Booking</h3>
    ${b.selectedServices.length ? b.selectedServices.map(s => `<div class="summary-line"><span>${s.name}</span><span>${formatMoney(s.price)}</span></div>`).join('') : '<p>No services selected yet.</p>'}
    ${b.selectedAddOns.map(a => `<div class="summary-line"><span>+ ${a.name}</span><span>${formatMoney(a.price)}</span></div>`).join('')}
    <div class="summary-line"><span>Duration</span><span>${getBookingDuration()} min</span></div>
    <div class="summary-line"><span>Subtotal</span><span>${formatMoney(getBookingSubtotal())}</span></div>
    ${b.discount ? `<div class="summary-line"><span>Discount</span><span>-${formatMoney(b.discount)}</span></div>` : ''}
    <div class="summary-line total"><span>Total</span><span>${formatMoney(getBookingTotal())}</span></div>
  `;
}

function goToStep(n) {
  setBookingStep(n);
  renderStepIndicator();
  renderWizardStep();
  renderWizardSummary();
}

function renderWizardStep() {
  const step = STATE.booking.step;
  if (step === 1) return renderStep1();
  if (step === 2) return renderStep2();
  if (step === 3) return renderStep3();
  if (step === 4) return renderStep4();
  if (step === 5) return renderStep5();
}

/* ---------------- Step 1: Services ---------------- */
function renderStep1() {
  const el = qs('#wizard-content');
  const allServices = STATE.services.length ? STATE.services : MOCK_SERVICES;
  const categories = ['All', 'Hair', 'Skin', 'Nails', 'Massage', 'Package'];

  el.innerHTML = `
    <h2>Choose Your Services</h2>
    <div class="tabs" id="bk-tabs">
      ${categories.map(c => `<button class="tab-btn${c === _bookingActiveCategory ? ' active' : ''}" data-cat="${c}">${c}</button>`).join('')}
    </div>
    <div id="bk-service-list"></div>
    <div class="header-actions" style="margin-top:1.5rem;">
      <button class="btn btn-primary" id="bk-next-1">Next: Choose Stylist</button>
    </div>
  `;

  function renderList() {
    const filtered = _bookingActiveCategory === 'All' ? allServices : allServices.filter(s => s.category === _bookingActiveCategory);
    const listEl = qs('#bk-service-list', el);
    listEl.innerHTML = filtered.map(s => {
      const selected = STATE.booking.selectedServices.some(sel => sel._id === s._id);
      const addOnsHtml = (s.addOns || []).length && selected ? `
        <div class="checkbox-row" style="margin-top:.5rem;flex-direction:column;align-items:flex-start;">
          ${s.addOns.map(a => {
            const checked = STATE.booking.selectedAddOns.some(sel => sel.name === a.name);
            return `<label class="checkbox-row"><input type="checkbox" class="bk-addon" data-name="${a.name}" data-price="${a.price}" data-duration="${a.duration || 0}" ${checked ? 'checked' : ''}> ${a.name} (+${formatMoney(a.price)})</label>`;
          }).join('')}
        </div>
      ` : '';
      return `
        <div class="card option-card${selected ? ' selected' : ''}" style="margin-bottom:.75rem;">
          <label class="checkbox-row">
            <input type="checkbox" class="bk-service" data-id="${s._id}" ${selected ? 'checked' : ''}>
            <div>
              <strong>${s.name}</strong> — ${formatMoney(s.price)} · ${s.duration} min
              <p>${s.shortDescription || ''}</p>
            </div>
          </label>
          ${addOnsHtml}
        </div>
      `;
    }).join('') || '<p>No services in this category.</p>';

    qsa('.bk-service', listEl).forEach(cb => cb.addEventListener('change', () => {
      const svc = allServices.find(s => s._id === cb.dataset.id);
      if (svc) selectService(svc);
      renderList();
      renderWizardSummary();
      updateNextEnabled();
    }));
    qsa('.bk-addon', listEl).forEach(cb => cb.addEventListener('change', () => {
      toggleAddOn({ name: cb.dataset.name, price: Number(cb.dataset.price), duration: Number(cb.dataset.duration) });
      renderWizardSummary();
    }));
  }

  function updateNextEnabled() {
    const btn = qs('#bk-next-1', el);
    btn.disabled = !canProceedToStep1();
  }

  qsa('#bk-tabs .tab-btn', el).forEach(btn => btn.addEventListener('click', () => {
    _bookingActiveCategory = btn.dataset.cat;
    qsa('#bk-tabs .tab-btn', el).forEach(b => b.classList.toggle('active', b === btn));
    renderList();
  }));

  qs('#bk-next-1', el).addEventListener('click', () => {
    if (!canProceedToStep1()) { showToast('Select at least one service', 'error'); return; }
    goToStep(2);
  });

  renderList();
  updateNextEnabled();
}

/* ---------------- Step 2: Stylist ---------------- */
function renderStep2() {
  const el = qs('#wizard-content');
  const allStaff = STATE.staff.length ? STATE.staff : MOCK_STAFF;
  const selectedServiceIds = new Set(STATE.booking.selectedServices.map(s => s._id));
  const eligibleStaffIds = new Set();
  STATE.booking.selectedServices.forEach(s => (s.availableStaff || []).forEach(id => {
    eligibleStaffIds.add(typeof id === 'string' ? id : id._id);
  }));
  const eligibleStaff = allStaff.filter(st => eligibleStaffIds.has(st._id));
  const displayStaff = eligibleStaff.length ? eligibleStaff : allStaff;

  el.innerHTML = `
    <h2>Choose Your Stylist</h2>
    <div class="grid-3">
      <div class="card option-card${STATE.booking.staffId === null ? ' selected' : ''}" id="bk-staff-any">
        <div class="card-body"><strong>Any Available</strong><p>We'll match you with the next available stylist.</p></div>
      </div>
      ${displayStaff.map(s => `
        <div class="card option-card staff-card${STATE.booking.staffId === s._id ? ' selected' : ''}" data-id="${s._id}">
          <div class="card-media"><img src="${s.photo}" alt="${s.name}" onerror="this.style.opacity=0"></div>
          <div class="card-body">
            <div class="card-title">${s.name}</div>
            ${stars(s.rating)}
            <p>${(s.specialty || []).join(', ')}</p>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="header-actions" style="margin-top:1.5rem;">
      <button class="btn btn-outline" id="bk-back-2">Back</button>
      <button class="btn btn-primary" id="bk-next-2">Next: Date &amp; Time</button>
    </div>
  `;

  let staffChosen = STATE.booking.staffId !== null || _bookingHasChosenStaff;

  function markSelected() {
    qsa('.option-card', el).forEach(c => c.classList.remove('selected'));
    if (STATE.booking.staffId === null) qs('#bk-staff-any', el).classList.add('selected');
    else {
      const card = qs(`.staff-card[data-id="${STATE.booking.staffId}"]`, el);
      if (card) card.classList.add('selected');
    }
  }

  qs('#bk-staff-any', el).addEventListener('click', () => {
    setStaff(null);
    _bookingHasChosenStaff = true;
    markSelected();
  });
  qsa('.staff-card', el).forEach(card => card.addEventListener('click', () => {
    setStaff(card.dataset.id);
    _bookingHasChosenStaff = true;
    markSelected();
  }));

  qs('#bk-back-2', el).addEventListener('click', () => goToStep(1));
  qs('#bk-next-2', el).addEventListener('click', () => {
    if (!_bookingHasChosenStaff) { showToast('Please choose a stylist option', 'error'); return; }
    goToStep(3);
  });
}
let _bookingHasChosenStaff = false;

/* ---------------- Step 3: Date & Time ---------------- */
function renderStep3() {
  const el = qs('#wizard-content');
  el.innerHTML = `
    <h2>Choose Date &amp; Time</h2>
    <div class="calendar-header">
      <button class="btn-icon" id="bk-cal-prev">‹</button>
      <span id="bk-cal-label"></span>
      <button class="btn-icon" id="bk-cal-next">›</button>
    </div>
    <div class="calendar-grid" id="bk-cal-dow">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="calendar-dow">${d}</div>`).join('')}
    </div>
    <div class="calendar-grid" id="bk-cal-days"></div>
    <div id="bk-slots-wrap" style="margin-top:1.5rem;"></div>
    <div class="header-actions" style="margin-top:1.5rem;">
      <button class="btn btn-outline" id="bk-back-3">Back</button>
      <button class="btn btn-primary" id="bk-next-3">Next: Your Info</button>
    </div>
  `;

  function renderCalendar() {
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    qs('#bk-cal-label', el).textContent = `${monthNames[_bookingCalMonth]} ${_bookingCalYear}`;
    const days = generateCalendarDays(_bookingCalYear, _bookingCalMonth);
    const daysEl = qs('#bk-cal-days', el);
    daysEl.innerHTML = days.map(d => {
      const classes = ['calendar-day'];
      if (!d.isCurrentMonth) classes.push('other-month');
      if (d.isPast) classes.push('past', 'disabled');
      if (d.isToday) classes.push('today');
      if (STATE.booking.date === d.dateStr) classes.push('selected');
      return `<button class="${classes.join(' ')}" data-date="${d.dateStr}" ${d.isPast ? 'disabled' : ''}>${d.date}</button>`;
    }).join('');

    qsa('.calendar-day:not(.disabled)', daysEl).forEach(btn => btn.addEventListener('click', async () => {
      setBookingDate(btn.dataset.date);
      renderCalendar();
      await loadSlots();
    }));
  }

  async function loadSlots() {
    const wrap = qs('#bk-slots-wrap', el);
    if (!STATE.booking.date) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = '<p>Loading available times…</p>';
    const duration = getBookingDuration();
    const { slots } = await fetchAvailableSlots(STATE.booking.staffId, STATE.booking.date, duration);

    if (!slots.length) {
      wrap.innerHTML = '<p>No available slots for this date. Please choose another day.</p>';
      return;
    }

    const groups = { morning: [], afternoon: [], evening: [] };
    slots.forEach(s => {
      const period = s.period || (parseInt(s.time.split(':')[0], 10) < 12 ? 'morning' : parseInt(s.time.split(':')[0], 10) < 17 ? 'afternoon' : 'evening');
      groups[period].push(s);
    });

    wrap.innerHTML = ['morning', 'afternoon', 'evening'].map(period => {
      if (!groups[period].length) return '';
      const label = period.charAt(0).toUpperCase() + period.slice(1);
      return `
        <div class="slot-period">
          <h4>${label}</h4>
          <div class="slot-grid">
            ${groups[period].map(s => `<button class="slot-btn${STATE.booking.time === s.time ? ' selected' : ''}" data-time="${s.time}">${formatTime12h(s.time)}</button>`).join('')}
          </div>
        </div>
      `;
    }).join('');

    qsa('.slot-btn', wrap).forEach(btn => btn.addEventListener('click', () => {
      setBookingTime(btn.dataset.time);
      qsa('.slot-btn', wrap).forEach(b => b.classList.toggle('selected', b === btn));
    }));
  }

  qs('#bk-cal-prev', el).addEventListener('click', () => {
    _bookingCalMonth--;
    if (_bookingCalMonth < 0) { _bookingCalMonth = 11; _bookingCalYear--; }
    renderCalendar();
  });
  qs('#bk-cal-next', el).addEventListener('click', () => {
    _bookingCalMonth++;
    if (_bookingCalMonth > 11) { _bookingCalMonth = 0; _bookingCalYear++; }
    renderCalendar();
  });
  qs('#bk-back-3', el).addEventListener('click', () => goToStep(2));
  qs('#bk-next-3', el).addEventListener('click', () => {
    if (!canProceedToStep3()) { showToast('Please choose a date and time', 'error'); return; }
    goToStep(4);
  });

  renderCalendar();
  if (STATE.booking.date) loadSlots();
}

/* ---------------- Step 4: Your Info ---------------- */
function renderStep4() {
  const el = qs('#wizard-content');
  const prefill = STATE.isLoggedIn && STATE.user ? STATE.user : null;

  // If a logged-in user's profile fills in fields the customer hasn't touched yet,
  // sync that into booking state now — the browser sets the input's `value` attribute
  // without firing an `input` event, so without this the fields look filled on screen
  // but STATE.booking.customerInfo stays empty and the "Next" validation below fails.
  // setCustomerInfo() reassigns STATE.booking.customerInfo to a new object, so we must
  // re-read it afterwards rather than reuse a `const` captured before the call — the
  // old reference would otherwise still be visible in stale closures below.
  if (prefill) {
    const current = STATE.booking.customerInfo;
    setCustomerInfo({
      name: current.name || prefill.name || '',
      email: current.email || prefill.email || '',
      phone: current.phone || prefill.phone || ''
    });
  }

  const info = STATE.booking.customerInfo;

  el.innerHTML = `
    <h2>Your Information</h2>
    <div class="form-group">
      <label class="form-label">Full Name</label>
      <input type="text" class="form-control" id="bk-name" value="${info.name || (prefill ? prefill.name : '') || ''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" id="bk-email" value="${info.email || (prefill ? prefill.email : '') || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input type="tel" class="form-control" id="bk-phone" value="${info.phone || (prefill ? prefill.phone : '') || ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Note for your stylist (optional)</label>
      <textarea class="form-control" id="bk-note">${info.note || ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Coupon Code</label>
      <div class="form-row">
        <input type="text" class="form-control" id="bk-coupon" value="${STATE.booking.couponCode || ''}" placeholder="Enter code">
        <button class="btn btn-outline" id="bk-apply-coupon">Apply</button>
      </div>
    </div>
    <div class="header-actions" style="margin-top:1.5rem;">
      <button class="btn btn-outline" id="bk-back-4">Back</button>
      <button class="btn btn-primary" id="bk-next-4">Next: Payment</button>
    </div>
  `;

  ['name', 'email', 'phone', 'note'].forEach(field => {
    const input = qs('#bk-' + field, el);
    input.addEventListener('input', () => setCustomerInfo({ [field]: input.value }));
  });

  qs('#bk-apply-coupon', el).addEventListener('click', async () => {
    const code = qs('#bk-coupon', el).value.trim();
    if (!code) return;
    const data = await api.post('/coupons/validate', { code, appliesTo: 'appointment', subtotal: getBookingSubtotal() });
    if (data && data.success) {
      applyBookingCoupon(data.coupon.code, data.discount);
      showToast('Coupon applied!', 'success');
      renderWizardSummary();
    } else {
      showToast((data && data.message) || 'Invalid coupon', 'error');
    }
  });

  qs('#bk-back-4', el).addEventListener('click', () => goToStep(3));
  qs('#bk-next-4', el).addEventListener('click', () => {
    if (!canProceedToStep4()) { showToast('Please fill in your name, email and phone', 'error'); return; }
    goToStep(5);
  });
}

/* ---------------- Step 5: Payment ---------------- */
function renderStep5() {
  const el = qs('#wizard-content');
  const b = STATE.booking;

  el.innerHTML = `
    <h2>Payment</h2>
    <div class="card card-body" style="margin-bottom:1rem;">
      <h4>Summary</h4>
      <p><strong>Services:</strong> ${b.selectedServices.map(s => escapeHtml(s.name)).join(', ')}</p>
      <p><strong>Date:</strong> ${formatDate(b.date)} at ${formatTime12h(b.time)}</p>
      <p><strong>Total:</strong> ${formatMoney(getBookingTotal())}</p>
    </div>
    <div class="form-group">
      <label class="radio-row"><input type="radio" name="pay-opt" value="deposit" ${b.paymentOption === 'deposit' ? 'checked' : ''}> Pay Deposit Now (${formatMoney(getDepositAmount())})</label>
      <label class="radio-row"><input type="radio" name="pay-opt" value="full" ${b.paymentOption === 'full' ? 'checked' : ''}> Pay Full Amount Now (${formatMoney(getBookingTotal())})</label>
      <label class="radio-row"><input type="radio" name="pay-opt" value="at_venue" ${b.paymentOption === 'at_venue' ? 'checked' : ''}> Pay at Venue</label>
    </div>
    <div id="bk-card-wrap"></div>
    <div class="header-actions" style="margin-top:1.5rem;">
      <button class="btn btn-outline" id="bk-back-5">Back</button>
      <button class="btn btn-primary" id="bk-confirm-btn">Confirm &amp; Book</button>
    </div>
  `;

  function renderCardArea() {
    const wrap = qs('#bk-card-wrap', el);
    if (b.paymentOption === 'at_venue') {
      wrap.innerHTML = '<p>You will pay the full amount at the salon.</p>';
      return;
    }
    if (!stripeClient) {
      wrap.innerHTML = '<p>Card payments are not configured in this demo — you may still confirm and pay at venue instead.</p>';
      return;
    }
    wrap.innerHTML = '<div class="form-group"><label class="form-label">Card Details</label><div id="bk-card-element" style="padding:.75rem;border:1px solid var(--border-color,#ccc);border-radius:6px;"></div></div>';
    mountCardElement('bk-card-element');
  }

  qsa('input[name="pay-opt"]', el).forEach(r => r.addEventListener('change', () => {
    setPaymentOption(r.value);
    renderWizardSummary();
    renderCardArea();
  }));

  qs('#bk-back-5', el).addEventListener('click', () => goToStep(4));
  qs('#bk-confirm-btn', el).addEventListener('click', async () => {
    const confirmBtn = qs('#bk-confirm-btn', el);
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Booking…';

    const result = await submitBooking();
    if (!result.success) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm & Book';
      return;
    }

    if (b.paymentOption !== 'at_venue') {
      const payResult = await processPayment({ type: 'appointment', referenceId: result.appointment._id });
      if (!payResult.success) {
        showToast(payResult.error || 'Payment failed, but your booking is held as pending.', 'error');
      }
    }

    STATE.lastBookingNumber = result.appointment.bookingNumber || result.appointment._id;
    sessionStorage.setItem('lastBookingNumber', STATE.lastBookingNumber);
    sessionStorage.setItem('lastBookingSummary', JSON.stringify({
      services: b.selectedServices.map(s => s.name),
      date: b.date, time: b.time, total: getBookingTotal()
    }));
    resetBooking();
    try { sessionStorage.removeItem('lumiere_booking_session_active'); } catch (err) { /* ignore */ }
    location.hash = '#/book/confirm';
  });

  renderCardArea();
}

/* ---------------- Confirmation page ---------------- */
function renderBookingDone() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  const bookingNumber = sessionStorage.getItem('lastBookingNumber') || STATE.lastBookingNumber || '—';
  let summary = {};
  try { summary = JSON.parse(sessionStorage.getItem('lastBookingSummary') || '{}'); } catch { summary = {}; }

  root.innerHTML = `
    <section class="page-section">
      <div class="container text-center" style="max-width:560px;margin:0 auto;">
        <div style="font-size:3rem;">✅</div>
        <h1 class="mt-4">Booking Confirmed!</h1>
        <p class="mt-2">Your booking number is</p>
        <h2 class="text-accent mt-2">${bookingNumber}</h2>

        <div class="card mt-8" style="padding:var(--space-5);text-align:left;">
          ${summary.services ? `<div class="summary-line"><span>Services</span><span>${summary.services.join(', ')}</span></div>` : ''}
          ${summary.date ? `<div class="summary-line"><span>Date</span><span>${formatDate(summary.date)}</span></div>` : ''}
          ${summary.time ? `<div class="summary-line"><span>Time</span><span>${formatTime12h(summary.time)}</span></div>` : ''}
          ${summary.total ? `<div class="summary-line total"><span>Total</span><span>${formatMoney(summary.total)}</span></div>` : ''}
        </div>

        <div class="flex gap-3 justify-center mt-8" style="flex-wrap:wrap;">
          <button class="btn btn-outline" id="add-calendar-btn">Add to Calendar</button>
          <a href="#/account?tab=bookings" class="btn btn-outline">View My Bookings</a>
          <a href="#/" class="btn btn-primary">Back to Home</a>
        </div>
      </div>
    </section>
  `;

  const calBtn = document.getElementById('add-calendar-btn');
  if (calBtn) calBtn.addEventListener('click', () => showToast('Calendar file would download here.', 'info'));
}
