const mongoose = require('mongoose');

const addOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, default: 0 },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: ['Hair', 'Skin', 'Nails', 'Massage', 'Package'],
      required: true,
    },
    duration: { type: Number, required: true },
    bufferTime: { type: Number, default: 15 },
    price: { type: Number, required: true },
    memberPrice: { type: Number },
    description: { type: String },
    shortDescription: { type: String },
    image: { type: String },
    addOns: [addOnSchema],
    availableStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
    isActive: { type: Boolean, default: true },
    bookingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
