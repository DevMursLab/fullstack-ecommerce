const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');

// @route POST /api/coupons/validate
async function validateCoupon(req, res, next) {
  try {
    const { code, appliesTo, subtotal, userId } = req.body;

    if (!code || !appliesTo || subtotal === undefined) {
      return res.status(400).json({ success: false, message: 'code, appliesTo and subtotal are required' });
    }

    // 1. exists
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    // 2. isActive
    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'This coupon is no longer active' });
    }

    // 3. date range
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return res.status(400).json({ success: false, message: 'This coupon is not yet valid' });
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return res.status(400).json({ success: false, message: 'This coupon has expired' });
    }

    // 4. usageLimit vs usedCount
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
    }

    // 5. appliesTo match
    if (coupon.appliesTo !== 'both' && coupon.appliesTo !== appliesTo) {
      return res.status(400).json({ success: false, message: `This coupon only applies to ${coupon.appliesTo}s` });
    }

    // 6. minPurchase
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `A minimum purchase of ${coupon.minPurchase} is required for this coupon`,
      });
    }

    // 7. perUserLimit via CouponUsage
    if (userId) {
      const usageCount = await CouponUsage.countDocuments({ couponId: coupon._id, userId });
      if (usageCount >= coupon.perUserLimit) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon the maximum number of times' });
      }
    }

    // 8. discount calc
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }
    discount = Math.min(discount, subtotal);

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      discount,
    });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/coupons
async function getCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/coupons
async function createCoupon(req, res, next) {
  try {
    const body = { ...req.body };
    if (body.code) body.code = body.code.toUpperCase().trim();
    const coupon = await Coupon.create(body);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/coupons/:id
async function updateCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    const body = { ...req.body };
    if (body.code) body.code = body.code.toUpperCase().trim();
    Object.assign(coupon, body);
    await coupon.save();
    res.status(200).json({ success: true, coupon });
  } catch (err) {
    next(err);
  }
}

// @route DELETE /api/coupons/:id
async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    await coupon.deleteOne();
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
