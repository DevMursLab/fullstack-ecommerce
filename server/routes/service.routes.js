const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} = require('../controllers/service.controller');

router.get('/', getServices);
router.get('/:id', getService);
router.post('/', protect, adminOnly, createService);
router.put('/:id', protect, adminOnly, updateService);
router.delete('/:id', protect, adminOnly, deleteService);

module.exports = router;
