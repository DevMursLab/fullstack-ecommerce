const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['appointment', 'order'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    method: { type: String, enum: ['card', 'cash', 'wallet'], default: 'card' },
    stripePaymentIntentId: { type: String },
    stripeChargeId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    refundAmount: { type: Number, default: 0 },
    failureReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
