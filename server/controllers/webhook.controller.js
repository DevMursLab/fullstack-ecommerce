const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function handlePaymentIntentSucceeded(paymentIntent) {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
  if (!payment) return;

  payment.status = 'succeeded';
  if (paymentIntent.latest_charge) {
    payment.stripeChargeId =
      typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : paymentIntent.latest_charge.id;
  }
  await payment.save();

  if (payment.type === 'appointment') {
    const appointment = await Appointment.findById(payment.referenceId);
    if (appointment) {
      appointment.status = 'confirmed';
      appointment.paymentStatus = appointment.paymentOption === 'full' ? 'fully_paid' : 'deposit_paid';
      appointment.paymentId = payment._id;
      await appointment.save();
    }
  } else if (payment.type === 'order') {
    const order = await Order.findById(payment.referenceId);
    if (order) {
      order.paymentStatus = 'paid';
      order.status = 'pending';
      order.paymentId = payment._id;
      await order.save();

      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        if (item.variant) {
          const variant = product.variants.find((v) => v.name === item.variant);
          if (variant) variant.stock = Math.max(0, variant.stock - item.quantity);
        } else {
          product.stock = Math.max(0, product.stock - item.quantity);
        }
        product.soldCount = (product.soldCount || 0) + item.quantity;
        await product.save();
      }
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
  if (payment) {
    payment.status = 'failed';
    payment.failureReason = paymentIntent.last_payment_error
      ? paymentIntent.last_payment_error.message
      : 'Payment failed';
    await payment.save();
  } else {
    const metadata = paymentIntent.metadata || {};
    await Payment.create({
      type: metadata.type || 'order',
      referenceId: metadata.referenceId,
      customerId: metadata.customerId || null,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      stripePaymentIntentId: paymentIntent.id,
      status: 'failed',
      failureReason: paymentIntent.last_payment_error ? paymentIntent.last_payment_error.message : 'Payment failed',
    });
  }
}

async function handleChargeRefunded(charge) {
  const payment = await Payment.findOne({
    $or: [{ stripeChargeId: charge.id }, { stripePaymentIntentId: charge.payment_intent }],
  });
  if (!payment) return;
  payment.status = 'refunded';
  payment.refundAmount = charge.amount_refunded / 100;
  await payment.save();
}

// @route POST /api/webhook/stripe
async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
      default:
        break;
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[Webhook] Handler error: ${err.message}`);
    res.status(500).json({ received: false });
  }
}

module.exports = { stripeWebhook };
