const mongoose = require('mongoose');

const dayScheduleSchema = new mongoose.Schema(
  {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' },
    isOff: { type: Boolean, default: false },
  },
  { _id: false }
);

const leaveSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const staffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    photo: { type: String },
    specialty: [{ type: String }],
    bio: { type: String },
    experience: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    workingHours: {
      monday: { type: dayScheduleSchema, default: () => ({}) },
      tuesday: { type: dayScheduleSchema, default: () => ({}) },
      wednesday: { type: dayScheduleSchema, default: () => ({}) },
      thursday: { type: dayScheduleSchema, default: () => ({}) },
      friday: { type: dayScheduleSchema, default: () => ({}) },
      saturday: { type: dayScheduleSchema, default: () => ({}) },
      sunday: { type: dayScheduleSchema, default: () => ({ isOff: true }) },
    },
    leaves: [leaveSchema],
    commissionRate: { type: Number, default: 0.3 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
