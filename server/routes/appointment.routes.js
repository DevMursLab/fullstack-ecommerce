const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const optionalAuth = require('../middleware/optionalAuth.middleware');
const {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAllAppointments,
  updateAppointmentStatus,
} = require('../controllers/appointment.controller');

router.get('/slots', getAvailableSlots);
router.post('/', optionalAuth, createAppointment);
router.get('/my', protect, getMyAppointments);
router.get('/', protect, adminOnly, getAllAppointments);
router.get('/:id', protect, getAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/reschedule', protect, rescheduleAppointment);
router.put('/:id/status', protect, adminOnly, updateAppointmentStatus);

module.exports = router;
