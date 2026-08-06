const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const {
  generateAvailableSlots,
  generateSlotsForAnyStaff,
  timeToMinutes,
  minutesToTime,
  generateBookingNumber,
} = require('../utils/slotGenerator');

// @route GET /api/appointments/slots
async function getAvailableSlots(req, res, next) {
  try {
    const { staffId, date, duration } = req.query;
    if (!date || !duration) {
      return res.status(400).json({ success: false, message: 'date and duration are required' });
    }
    const requiredDuration = Number(duration);

    if (!staffId || staffId === 'any') {
      const allStaff = await Staff.find({ isActive: true });
      const staffIds = allStaff.map((s) => s._id);
      const allAppointments = await Appointment.find({
        date,
        staffId: { $in: staffIds },
        status: { $ne: 'cancelled' },
      });
      const slots = generateSlotsForAnyStaff({ allStaff, date, requiredDuration, allAppointments });
      return res.status(200).json({ success: true, mode: 'any', slots });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    const existingAppointments = await Appointment.find({
      staffId,
      date,
      status: { $ne: 'cancelled' },
    });
    const slots = generateAvailableSlots({ staff, date, requiredDuration, existingAppointments });
    res.status(200).json({ success: true, mode: 'single', staffId, slots });
  } catch (err) {
    next(err);
  }
}

function computeTotals(services, addOns, discount = 0) {
  const serviceTotal = services.reduce((sum, s) => sum + s.price, 0);
  const addOnTotal = (addOns || []).reduce((sum, a) => sum + a.price, 0);
  const subtotal = serviceTotal + addOnTotal;
  const total = Math.max(0, subtotal - (discount || 0));
  const totalDuration =
    services.reduce((sum, s) => sum + s.duration, 0) + (addOns || []).reduce((sum, a) => sum + (a.duration || 0), 0);
  return { subtotal, total, totalDuration };
}

// @route POST /api/appointments
async function createAppointment(req, res, next) {
  try {
    const {
      staffId,
      serviceIds,
      addOns,
      date,
      startTime,
      guestInfo,
      couponCode,
      discount,
      depositAmount,
      paymentOption,
      customerNote,
    } = req.body;

    if (!staffId || !serviceIds || !serviceIds.length || !date || !startTime) {
      return res.status(400).json({ success: false, message: 'staffId, serviceIds, date and startTime are required' });
    }

    const staff = await Staff.findById(staffId);
    if (!staff || !staff.isActive) {
      return res.status(404).json({ success: false, message: 'Staff not found or inactive' });
    }

    const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });
    if (services.length !== serviceIds.length) {
      return res.status(400).json({ success: false, message: 'One or more services are invalid or unavailable' });
    }

    const serviceSnapshots = services.map((s) => ({
      serviceId: s._id,
      name: s.name,
      price: s.price,
      duration: s.duration,
    }));

    const addOnSnapshots = (addOns || []).map((a) => ({
      name: a.name,
      price: a.price,
      duration: a.duration || 0,
    }));

    const { subtotal, total, totalDuration } = computeTotals(serviceSnapshots, addOnSnapshots, discount);

    const startTimeMinutes = timeToMinutes(startTime);
    const endTimeMinutes = startTimeMinutes + totalDuration;
    const endTime = minutesToTime(endTimeMinutes);

    // Race-condition-safe final overlap check
    const conflict = await Appointment.findOne({
      staffId,
      date,
      status: { $nin: ['cancelled', 'no_show'] },
      $expr: {
        $and: [
          { $lt: ['$startTimeMinutes', endTimeMinutes] },
          { $gt: ['$endTimeMinutes', startTimeMinutes] },
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({ success: false, message: 'This time slot is no longer available. Please choose another slot.' });
    }

    const customerId = req.user ? req.user.id : null;

    if (!customerId && (!guestInfo || !guestInfo.name || !guestInfo.email || !guestInfo.phone)) {
      return res.status(400).json({ success: false, message: 'guestInfo (name, email, phone) is required for guest bookings' });
    }

    let bookingNumber;
    let attempts = 0;
    while (attempts < 5) {
      bookingNumber = generateBookingNumber();
      const exists = await Appointment.findOne({ bookingNumber });
      if (!exists) break;
      attempts += 1;
    }

    const appointment = await Appointment.create({
      bookingNumber,
      customerId,
      guestInfo: customerId ? null : guestInfo,
      staffId,
      services: serviceSnapshots,
      addOns: addOnSnapshots,
      date,
      startTime,
      endTime,
      startTimeMinutes,
      endTimeMinutes,
      totalDuration,
      subtotal,
      discount: discount || 0,
      couponCode,
      total,
      depositAmount: depositAmount || Math.round(total * 0.2),
      paymentOption: paymentOption || 'deposit',
      status: 'pending',
      customerNote,
    });

    // bump booking counts
    await Service.updateMany({ _id: { $in: serviceIds } }, { $inc: { bookingCount: 1 } });

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/appointments/my
async function getMyAppointments(req, res, next) {
  try {
    const appointments = await Appointment.find({ customerId: req.user.id })
      .populate('staffId', 'name photo')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/appointments/:id
async function getAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('staffId', 'name photo');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (
      req.user.role !== 'admin' &&
      (!appointment.customerId || String(appointment.customerId) !== String(req.user.id))
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.status(200).json({ success: true, appointment });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/appointments/:id/cancel
async function cancelAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (
      req.user.role !== 'admin' &&
      (!appointment.customerId || String(appointment.customerId) !== String(req.user.id))
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel an appointment that is already ${appointment.status}` });
    }
    appointment.status = 'cancelled';
    await appointment.save();
    res.status(200).json({ success: true, appointment });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/appointments/:id/reschedule
async function rescheduleAppointment(req, res, next) {
  try {
    const { date, startTime } = req.body;
    if (!date || !startTime) {
      return res.status(400).json({ success: false, message: 'date and startTime are required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (
      req.user.role !== 'admin' &&
      (!appointment.customerId || String(appointment.customerId) !== String(req.user.id))
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: `Cannot reschedule an appointment that is ${appointment.status}` });
    }

    const startTimeMinutes = timeToMinutes(startTime);
    const endTimeMinutes = startTimeMinutes + appointment.totalDuration;
    const endTime = minutesToTime(endTimeMinutes);

    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      staffId: appointment.staffId,
      date,
      status: { $nin: ['cancelled', 'no_show'] },
      $expr: {
        $and: [
          { $lt: ['$startTimeMinutes', endTimeMinutes] },
          { $gt: ['$endTimeMinutes', startTimeMinutes] },
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({ success: false, message: 'This time slot is no longer available. Please choose another slot.' });
    }

    appointment.date = date;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.startTimeMinutes = startTimeMinutes;
    appointment.endTimeMinutes = endTimeMinutes;
    appointment.status = 'pending';
    await appointment.save();

    res.status(200).json({ success: true, appointment });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/appointments
async function getAllAppointments(req, res, next) {
  try {
    const { status, staffId, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (staffId) filter.staffId = staffId;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    const appointments = await Appointment.find(filter)
      .populate('staffId', 'name photo')
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/appointments/:id/status
async function updateAppointmentStatus(req, res, next) {
  try {
    const { status, internalNote } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = status;
    if (internalNote !== undefined) appointment.internalNote = internalNote;
    await appointment.save();

    res.status(200).json({ success: true, appointment });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAllAppointments,
  updateAppointmentStatus,
};
