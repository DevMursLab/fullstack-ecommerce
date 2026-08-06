const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const User = require('../models/User');

// @route GET /api/reviews?type=service&referenceId=...
async function getReviews(req, res, next) {
  try {
    const { type, referenceId, page, limit } = req.query;
    const filter = { isApproved: true };
    if (type) filter.type = type;
    if (referenceId) filter.referenceId = referenceId;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Review.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      reviews,
    });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/reviews
async function createReview(req, res, next) {
  try {
    const { type, referenceId, rating, title, comment, images } = req.body;

    if (!['service', 'product', 'staff'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid review type' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // A review only counts as verified if the customer actually booked this
    // service/staff or ordered this product — never trust the client for this.
    let isVerified = false;
    if (type === 'product') {
      isVerified = await Order.exists({
        customerId: req.user.id,
        'items.productId': referenceId,
      });
    } else {
      const field = type === 'service' ? 'services.serviceId' : 'staffId';
      isVerified = await Appointment.exists({
        customerId: req.user.id,
        [field]: referenceId,
        status: 'completed',
      });
    }

    const user = await User.findById(req.user.id).select('name');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const review = await Review.create({
      type,
      referenceId,
      customerId: req.user.id,
      customerName: user.name,
      rating,
      title,
      comment,
      images: images || [],
      isVerified: Boolean(isVerified),
      isApproved: true,
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/reviews/:id/approve
async function approveReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    review.isApproved = req.body.isApproved !== undefined ? req.body.isApproved : true;
    await review.save();
    res.status(200).json({ success: true, review });
  } catch (err) {
    next(err);
  }
}

// @route DELETE /api/reviews/:id
async function deleteReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isOwner = String(review.customerId) === String(req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getReviews, createReview, approveReview, deleteReview };
