// Stripe Elements integration with graceful no-key fallback.

const stripeClient = (CONFIG.STRIPE_PUBLIC_KEY && CONFIG.STRIPE_PUBLIC_KEY.indexOf('placeholder') === -1 && typeof Stripe === 'function')
  ? Stripe(CONFIG.STRIPE_PUBLIC_KEY)
  : null;

let _stripeElements = null;
let _cardElement = null;

function mountCardElement(containerId) {
  if (!stripeClient) {
    console.warn('Stripe not configured — card element not mounted');
    return null;
  }
  const container = document.getElementById(containerId);
  if (!container) return null;
  _stripeElements = stripeClient.elements();
  _cardElement = _stripeElements.create('card', { style: { base: { fontSize: '16px' } } });
  _cardElement.mount('#' + containerId);
  return _cardElement;
}

async function processPayment(opts) {
  const type = opts.type;
  const referenceId = opts.referenceId;

  if (!stripeClient || !_cardElement) {
    // No Stripe configured (or "pay at venue"/COD path) — resolve success without charging.
    return { success: true, paymentIntentId: null, fallback: true };
  }

  const intentRes = await api.post('/payments/create-intent', { type, referenceId });
  if (!intentRes || !intentRes.success) {
    return { success: false, error: (intentRes && intentRes.message) || 'Could not initialize payment' };
  }

  const result = await stripeClient.confirmCardPayment(intentRes.clientSecret, {
    payment_method: { card: _cardElement }
  });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
    return { success: true, paymentIntentId: result.paymentIntent.id };
  }

  return { success: false, error: 'Payment was not completed' };
}
