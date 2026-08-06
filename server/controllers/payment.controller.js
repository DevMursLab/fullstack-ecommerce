const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');

// @route POST /api/payments/create-intent
// CRITICAL: never trust client-sent amount — always re-derive server-side.
async function createPaymentIntent(req, res, next) {
  try {
    const { type, referenceId } = req.body;

    if (!type || !referenceId || !['appointment', 'order'].includes(type)) {
      return res.status(400).json({ success: false, message: 'A valid type (appointment|order) and referenceId are required' });
    }

    let verifiedAmount;
    let customerId = null;

    if (type === 'appointment') {
      const appointment = await Appointment.findById(referenceId);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
      verifiedAmount = appointment.paymentOption === 'full' ? appointment.total : appointment.depositAmount;
      customerId = appointment.customerId;
    } else {
      const order = await Order.findById(referenceId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      verifiedAmount = order.total;
      customerId = order.customerId;
    }

    if (!verifiedAmount || verifiedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Nothing to charge for this reference' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(verifiedAmount * 100),
      currency: 'usd',
      metadata: {
        type,
        referenceId: String(referenceId),
        customerId: customerId ? String(customerId) : '',
      },
    });

    await Payment.create({
      type,
      referenceId,
      customerId,
      amount: verifiedAmount,
      currency: 'usd',
      method: 'card',
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending',
    });

    res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret, amount: verifiedAmount });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/payments/:id/refund
async function refundPayment(req, res, next) {
  try {
    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (payment.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Only succeeded payments can be refunded' });
    }

    const refundParams = {};
    if (payment.stripeChargeId) {
      refundParams.charge = payment.stripeChargeId;
    } else if (payment.stripePaymentIntentId) {
      refundParams.payment_intent = payment.stripePaymentIntentId;
    } else {
      return res.status(400).json({ success: false, message: 'No Stripe charge/payment intent recorded for this payment' });
    }
    if (amount) refundParams.amount = Math.round(amount * 100);
    if (reason) refundParams.reason = reason;

    const refund = await stripe.refunds.create(refundParams);

    payment.status = 'refunded';
    payment.refundAmount = amount || payment.amount;
    await payment.save();

    res.status(200).json({ success: true, refund, payment });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPaymentIntent,
  refundPayment,
};
