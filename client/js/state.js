// Global application state and mutation functions.
// Every mutation goes through a named function here; each ends with persistState().

const STATE = {
  user: null, token: null, isLoggedIn: false,
  booking: {
    step: 1, selectedServices: [], selectedAddOns: [], staffId: null,
    date: null, time: null,
    customerInfo: { name: '', email: '', phone: '', note: '' },
    couponCode: null, discount: 0, paymentOption: 'deposit'
  },
  availableSlots: [], slotsLoading: false,
  cart: [], wishlist: [],
  shopFilters: { categories: [], maxPrice: 5000, minRating: 0, inStockOnly: false, query: '', sort: 'featured' },
  shopPage: 1,
  checkout: { step: 1, shippingAddress: null, shippingMethod: 'standard', couponCode: null },
  ui: { cartDrawerOpen: false, menuDrawerOpen: false, modalContent: null, theme: 'light', isLoading: false },
  admin: { activeModule: 'dashboard', calendarView: 'week', dateRange: { from: null, to: null }, appointmentFilter: 'all' },
  services: [], staff: [], products: [], reviews: [],
  lastBookingNumber: null, lastOrderNumber: null
};

/* ---------------- Booking ---------------- */
function selectService(service) {
  const idx = STATE.booking.selectedServices.findIndex(s => s._id === service._id);
  if (idx >= 0) STATE.booking.selectedServices.splice(idx, 1);
  else STATE.booking.selectedServices.push(service);
  persistState();
}

function toggleAddOn(addOn) {
  const idx = STATE.booking.selectedAddOns.findIndex(a => a.name === addOn.name);
  if (idx >= 0) STATE.booking.selectedAddOns.splice(idx, 1);
  else STATE.booking.selectedAddOns.push(addOn);
  persistState();
}

function setStaff(staffId) {
  STATE.booking.staffId = staffId;
  persistState();
}

function setBookingDate(dateStr) {
  STATE.booking.date = dateStr;
  STATE.booking.time = null;
  persistState();
}

function setBookingTime(time) {
  STATE.booking.time = time;
  persistState();
}

function setCustomerInfo(fields) {
  STATE.booking.customerInfo = { ...STATE.booking.customerInfo, ...fields };
  persistState();
}

function setBookingStep(n) {
  STATE.booking.step = n;
  persistState();
}

function applyBookingCoupon(code, discount) {
  STATE.booking.couponCode = code;
  STATE.booking.discount = discount;
  persistState();
}

function setPaymentOption(option) {
  STATE.booking.paymentOption = option;
  persistState();
}

function getBookingDuration() {
  const svcDuration = STATE.booking.selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
  const addOnDuration = STATE.booking.selectedAddOns.reduce((sum, a) => sum + (a.duration || 0), 0);
  return svcDuration + addOnDuration;
}

function getBookingSubtotal() {
  const svcTotal = STATE.booking.selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const addOnTotal = STATE.booking.selectedAddOns.reduce((sum, a) => sum + (a.price || 0), 0);
  return svcTotal + addOnTotal;
}

function getBookingTotal() {
  return Math.max(0, getBookingSubtotal() - (STATE.booking.discount || 0));
}

function getDepositAmount() {
  return Math.round(getBookingTotal() * CONFIG.DEPOSIT_PERCENT);
}

function resetBooking() {
  STATE.booking = {
    step: 1, selectedServices: [], selectedAddOns: [], staffId: null,
    date: null, time: null,
    customerInfo: { name: '', email: '', phone: '', note: '' },
    couponCode: null, discount: 0, paymentOption: 'deposit'
  };
  STATE.availableSlots = [];
  try { sessionStorage.removeItem('lumiere_booking_customer_info'); } catch (err) { /* ignore */ }
  persistState();
}

/* ---------------- Cart ---------------- */
function cartKey(productId, variantName) { return `${productId}-${variantName}`; }

function addToCart(product, variant, qty = 1) {
  const key = cartKey(product._id, variant.name);
  const existing = STATE.cart.find(item => item.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    STATE.cart.push({
      key, productId: product._id, name: product.name, image: (product.images && product.images[0]) || '',
      variantName: variant.name, price: variant.price, qty, stock: variant.stock
    });
  }
  persistState();
}

function removeFromCart(key) {
  STATE.cart = STATE.cart.filter(item => item.key !== key);
  persistState();
}

function updateCartQty(key, qty) {
  if (qty <= 0) { removeFromCart(key); return; }
  const item = STATE.cart.find(i => i.key === key);
  if (item) item.qty = qty;
  persistState();
}

function clearCart() {
  STATE.cart = [];
  persistState();
}

function getCartSubtotal() {
  return STATE.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartItemCount() {
  return STATE.cart.reduce((sum, item) => sum + item.qty, 0);
}

function getShippingCost(discount = 0) {
  if (STATE.cart.length === 0) return 0;
  const afterDiscount = Math.max(0, getCartSubtotal() - (discount || 0));
  return afterDiscount >= CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : CONFIG.SHIPPING_COST;
}

function getCartDiscount(code) {
  const applied = STATE.checkout.couponCode;
  if (!applied || (code && code !== applied)) return 0;
  const coupon = (typeof MOCK_COUPONS !== 'undefined' ? MOCK_COUPONS : []).find(c => c.code === applied);
  if (!coupon) return 0;
  const subtotal = getCartSubtotal();
  if (coupon.minSpend && subtotal < coupon.minSpend) return 0;
  return coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : coupon.value;
}

function toggleWishlist(productId) {
  const idx = STATE.wishlist.indexOf(productId);
  if (idx >= 0) STATE.wishlist.splice(idx, 1);
  else STATE.wishlist.push(productId);
  persistState();
}

/* ---------------- Checkout ---------------- */
function setCheckoutStep(n) {
  STATE.checkout.step = n;
  persistState();
}

function setShippingAddress(addr) {
  STATE.checkout.shippingAddress = addr;
  persistState();
}

function setShippingMethod(method) {
  STATE.checkout.shippingMethod = method;
  persistState();
}

function applyCheckoutCoupon(code, discount) {
  STATE.checkout.couponCode = code;
  STATE.checkout._discountAmount = discount;
  persistState();
}

function getCheckoutTotals() {
  const subtotal = getCartSubtotal();
  let discount = 0;
  if (STATE.checkout.couponCode) {
    discount = typeof STATE.checkout._discountAmount === 'number'
      ? STATE.checkout._discountAmount
      : getCartDiscount(STATE.checkout.couponCode);
  }
  discount = Math.min(discount, subtotal);
  const afterDiscount = Math.max(0, subtotal - discount);
  let shipping = STATE.cart.length === 0 ? 0 : (afterDiscount >= CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : CONFIG.SHIPPING_COST);
  if (STATE.checkout.shippingMethod === 'express' && shipping === 0 && STATE.cart.length > 0) shipping = 150;
  else if (STATE.checkout.shippingMethod === 'express' && STATE.cart.length > 0) shipping += 100;
  const tax = 0; // no tax configured for this market
  const total = afterDiscount + shipping + tax;
  return { subtotal, discount, shipping, tax, total };
}

/* ---------------- UI ---------------- */
function openCartDrawer() {
  STATE.ui.cartDrawerOpen = true;
  if (typeof renderCartDrawer === 'function') renderCartDrawer();
}

function closeCartDrawer() {
  STATE.ui.cartDrawerOpen = false;
  if (typeof renderCartDrawer === 'function') renderCartDrawer();
}

function toggleMenuDrawer() {
  STATE.ui.menuDrawerOpen = !STATE.ui.menuDrawerOpen;
  const drawer = document.querySelector('.menu-drawer');
  const overlay = document.querySelector('.menu-drawer-overlay');
  if (drawer) drawer.classList.toggle('open', STATE.ui.menuDrawerOpen);
  if (overlay) overlay.classList.toggle('open', STATE.ui.menuDrawerOpen);
}

function setLoading(bool) {
  STATE.ui.isLoading = bool;
  const loader = document.getElementById('loader');
  if (loader) loader.classList.toggle('hidden', !bool);
}

/* ---------------- Data cache ---------------- */
function setServices(arr) { STATE.services = arr || []; }
function setStaffList(arr) { STATE.staff = arr || []; }
function setProducts(arr) { STATE.products = arr || []; }
function setReviews(arr) { STATE.reviews = arr || []; }

/* ---------------- Persistence ---------------- */
// Guest PII (booking.customerInfo: name/email/phone/note) is kept in sessionStorage,
// not localStorage — it must not survive across browser sessions or leak to the next
// person who opens the site on a shared/demo device. Everything else in `booking`
// (selected services, staff, date/time, step) is low-sensitivity wizard progress and
// stays in localStorage so an accidental refresh doesn't lose it.
function persistState() {
  try {
    const { customerInfo, ...bookingRest } = STATE.booking;
    const toSave = {
      cart: STATE.cart,
      wishlist: STATE.wishlist,
      booking: bookingRest,
      token: STATE.token,
      user: STATE.user,
      theme: STATE.ui.theme,
      checkout: STATE.checkout
    };
    localStorage.setItem('lumiere_v1', JSON.stringify(toSave));
    sessionStorage.setItem('lumiere_booking_customer_info', JSON.stringify(customerInfo));
  } catch (err) {
    console.error('persistState failed', err);
  }
}

function restoreState() {
  try {
    const raw = localStorage.getItem('lumiere_v1');
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.cart) STATE.cart = saved.cart;
      if (saved.wishlist) STATE.wishlist = saved.wishlist;
      if (saved.booking) STATE.booking = { ...STATE.booking, ...saved.booking };
      if (saved.token) STATE.token = saved.token;
      if (saved.user) STATE.user = saved.user;
      if (saved.token) STATE.isLoggedIn = true;
      if (saved.theme) STATE.ui.theme = saved.theme;
      if (saved.checkout) STATE.checkout = saved.checkout;
    }
    // customerInfo is tab/session-scoped only — never restored from localStorage.
    const rawCustomerInfo = sessionStorage.getItem('lumiere_booking_customer_info');
    if (rawCustomerInfo) {
      STATE.booking.customerInfo = { ...STATE.booking.customerInfo, ...JSON.parse(rawCustomerInfo) };
    }
  } catch (err) {
    console.error('restoreState failed, clearing corrupt state', err);
    localStorage.removeItem('lumiere_v1');
    sessionStorage.removeItem('lumiere_booking_customer_info');
  }
}
