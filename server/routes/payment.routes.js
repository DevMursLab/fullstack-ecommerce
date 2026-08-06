const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { createPaymentIntent, refundPayment } = require('../controllers/payment.controller');

router.post('/create-intent', createPaymentIntent);
router.post('/:id/refund', protect, adminOnly, refundPayment);

module.exports = router;
