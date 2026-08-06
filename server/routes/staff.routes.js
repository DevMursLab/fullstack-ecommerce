const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getStaffList,
  getStaffProfile,
  createStaff,
  updateStaff,
  setSchedule,
  addLeave,
} = require('../controllers/staff.controller');

router.get('/', getStaffList);
router.get('/:id', getStaffProfile);
router.post('/', protect, adminOnly, createStaff);
router.put('/:id', protect, adminOnly, updateStaff);
router.put('/:id/schedule', protect, adminOnly, setSchedule);
router.post('/:id/leave', protect, adminOnly, addLeave);

module.exports = router;
