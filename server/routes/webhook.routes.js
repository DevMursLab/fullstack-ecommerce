const express = require('express');
const router = express.Router();
const { stripeWebhook } = require('../controllers/webhook.controller');

// Must use raw body for Stripe signature verification.
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
