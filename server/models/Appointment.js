const mongoose = require('mongoose');

const guestInfoSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
  },
  { _id: false }
);

const serviceSnapshotSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
  },
  { _id: false }
);

const addOnSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, default: 0 },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestInfo: { type: guestInfoSchema, default: null },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    services: [serviceSnapshotSchema],
    addOns: [addOnSnapshotSchema],
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startTimeMinutes: { type: Number, required: true },
    endTimeMinutes: { type: Number, required: true },
    totalDuration: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    total: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    paymentOption: {
      type: String,
      enum: ['deposit', 'full', 'at_venue'],
      default: 'deposit',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'deposit_paid', 'fully_paid', 'refunded'],
      default: 'unpaid',
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    customerNote: { type: String },
    internalNote: { type: String },
  },
  { timestamps: true }
);

appointmentSchema.index({ date: 1, staffId: 1 });
appointmentSchema.index({ customerId: 1, createdAt: -1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
