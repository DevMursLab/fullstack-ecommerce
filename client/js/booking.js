// Booking-flow logic: slot fetching, submission, step validation.

async function fetchAvailableSlots(staffId, date, duration) {
  STATE.slotsLoading = true;
  STATE.availableSlots = [];
  let qs = `date=${encodeURIComponent(date)}&duration=${encodeURIComponent(duration)}`;
  if (staffId) qs += `&staffId=${encodeURIComponent(staffId)}`;
  const data = await api.get(`/appointments/slots?${qs}`);
  STATE.slotsLoading = false;
  if (data && data.success) {
    STATE.availableSlots = data.slots || [];
    return { mode: data.mode, slots: data.slots || [] };
  }
  STATE.availableSlots = [];
  return { mode: staffId ? 'single' : 'any', slots: [] };
}

// A real MongoDB ObjectId is 24 hex chars. Mock/offline fallback data uses ids like
// "svc1" / "stf1" — sending those to the backend triggers a CastError that surfaces
// to the user as "Resource not found".
function isRealObjectId(id) {
  return typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);
}

async function submitBooking() {
  const b = STATE.booking;
  if (!b.selectedServices.length || !b.date || !b.time) {
    showToast('Please complete all booking steps first', 'error');
    return { success: false };
  }

  // If any selected service still carries a mock id (the boot fetch fell back to offline
  // data), pull the real records now and remap by name before we send anything.
  const hasMockService = b.selectedServices.some(s => !isRealObjectId(s._id));
  if (hasMockService && typeof ensureLiveBookingData === 'function') {
    await ensureLiveBookingData();
  }
  if (b.selectedServices.some(s => !isRealObjectId(s._id))) {
    showToast('Could not reach the booking server. Please refresh and try again.', 'error');
    return { success: false };
  }

  const body = {
    staffId: b.staffId,
    serviceIds: b.selectedServices.map(s => s._id),
    addOns: b.selectedAddOns,
    date: b.date,
    startTime: b.time,
    couponCode: b.couponCode || undefined,
    discount: b.discount || 0,
    depositAmount: getDepositAmount(),
    paymentOption: b.paymentOption,
    customerNote: b.customerInfo.note || ''
  };

  if (!STATE.isLoggedIn) {
    body.guestInfo = {
      name: b.customerInfo.name,
      email: b.customerInfo.email,
      phone: b.customerInfo.phone
    };
  }

  if (!body.staffId) {
    // "Any available" — pick the first staff offering the first slot for this date, from availableSlots
    const anySlot = STATE.availableSlots.find(s => s.time === b.time);
    if (anySlot && anySlot.availableStaff && anySlot.availableStaff.length) {
      body.staffId = anySlot.availableStaff[0];
    } else if (b.selectedServices[0] && b.selectedServices[0].availableStaff && b.selectedServices[0].availableStaff.length) {
      body.staffId = b.selectedServices[0].availableStaff[0];
    }
  }

  if (!body.staffId) {
    showToast('No stylist available for this booking. Please pick a different time.', 'error');
    return { success: false };
  }

  if (!isRealObjectId(body.staffId)) {
    // A mock stylist id slipped through (offline data). Refresh slots for this date so we
    // resolve a real stylist id, then retry once.
    if (typeof fetchAvailableSlots === 'function') {
      await fetchAvailableSlots(STATE.booking.staffId, b.date, getBookingDuration());
      const freshSlot = STATE.availableSlots.find(s => s.time === b.time);
      if (freshSlot && freshSlot.availableStaff && isRealObjectId(freshSlot.availableStaff[0])) {
        body.staffId = freshSlot.availableStaff[0];
      }
    }
    if (!isRealObjectId(body.staffId)) {
      showToast('Could not reach the booking server. Please refresh and try again.', 'error');
      return { success: false };
    }
  }

  const data = await api.post('/appointments', body);
  if (!data || !data.success) {
    showToast((data && data.message) || 'Could not complete booking', 'error');
    return { success: false, message: data && data.message };
  }

  showToast('Booking confirmed!', 'success');
  return { success: true, appointment: data.appointment };
}

function canProceedToStep1() {
  return STATE.booking.selectedServices.length > 0;
}

function canProceedToStep2() {
  return !!STATE.booking.staffId || STATE.booking.staffId === null; // staffId null means "any"
}

function canProceedToStep3() {
  return !!STATE.booking.date && !!STATE.booking.time;
}

function canProceedToStep4() {
  const c = STATE.booking.customerInfo;
  return !!(c.name && c.email && c.phone);
}

async function validateBookingCoupon(code) {
  if (!code) return { success: false };
  const subtotal = getBookingSubtotal();
  const res = await api.post('/coupons/validate', { code, appliesTo: 'appointment', subtotal, userId: STATE.user && STATE.user._id });
  if (res && res.success) {
    const discount = res.discount || 0;
    applyBookingCoupon(code, discount);
    return { success: true, discount };
  }
  const coupon = (typeof MOCK_COUPONS !== 'undefined' ? MOCK_COUPONS : []).find(c => c.code === code && c.isActive);
  if (coupon && (!coupon.minSpend || subtotal >= coupon.minSpend)) {
    const discount = coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : coupon.value;
    applyBookingCoupon(code, discount);
    return { success: true, discount };
  }
  return { success: false, message: (res && res.message) || 'Invalid coupon' };
}
