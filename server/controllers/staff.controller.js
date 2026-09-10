const Staff = require('../models/Staff');

// @route GET /api/staff
async function getStaffList(req, res, next) {
  try {
    const { specialty, isActive } = req.query;
    const filter = {};
    if (specialty) filter.specialty = specialty;
    filter.isActive = isActive !== undefined ? isActive === 'true' : true;

    const staff = await Staff.find(filter);
    res.status(200).json({ success: true, count: staff.length, staff });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/staff/:id
async function getStaffProfile(req, res, next) {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    res.status(200).json({ success: true, staff });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/staff
async function createStaff(req, res, next) {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json({ success: true, staff });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/staff/:id
async function updateStaff(req, res, next) {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    Object.assign(staff, req.body);
    await staff.save();
    res.status(200).json({ success: true, staff });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/staff/:id/schedule
async function setSchedule(req, res, next) {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    const { workingHours } = req.body;
    if (!workingHours) {
      return res.status(400).json({ success: false, message: 'workingHours is required' });
    }
    staff.workingHours = { ...staff.workingHours.toObject(), ...workingHours };
    await staff.save();
    res.status(200).json({ success: true, staff });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/staff/:id/leave
async function addLeave(req, res, next) {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    const { date, reason } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' });
    }
    staff.leaves.push({ date, reason: reason || '' });
    await staff.save();
    res.status(200).json({ success: true, staff });
  } catch (err) {
    next(err);
  }
}

// @route DELETE /api/staff/:id/leave
// Removes a leave day by its date (leave subdocs have no _id).
async function removeLeave(req, res, next) {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    const date = req.body.date || req.query.date;
    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' });
    }
    const before = staff.leaves.length;
    staff.leaves = staff.leaves.filter((lv) => lv.date !== date);
    if (staff.leaves.length === before) {
      return res.status(404).json({ success: false, message: 'No leave found for that date' });
    }
    await staff.save();
    res.status(200).json({ success: true, staff });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStaffList,
  getStaffProfile,
  createStaff,
  updateStaff,
  setSchedule,
  addLeave,
  removeLeave,
};
