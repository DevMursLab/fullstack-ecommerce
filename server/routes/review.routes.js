const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getReviews,
  createReview,
  approveReview,
  deleteReview,
} = require('../controllers/review.controller');

router.get('/', getReviews);
router.post('/', protect, createReview);
router.put('/:id/approve', protect, adminOnly, approveReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
