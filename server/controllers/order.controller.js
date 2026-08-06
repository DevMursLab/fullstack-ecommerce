const Product = require('../models/Product');
const Order = require('../models/Order');
const { generateOrderNumber } = require('../utils/slotGenerator');

const FREE_SHIPPING_THRESHOLD = 2000;
const STANDARD_SHIPPING_COST = 60;
const DEFAULT_TAX_RATE = 0; // configurable, kept at 0 per spec example

async function validateStock(items) {
  const problems = [];
  const resolvedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      problems.push({ productId: item.productId, message: 'Product not found or unavailable' });
      continue;
    }

    let availableStock = product.stock;
    let unitPrice = product.price;
    let variant = null;

    if (item.variantId) {
      const v = product.variants.id(item.variantId);
      if (!v) {
        problems.push({ productId: item.productId, message: `Variant not found for ${product.name}` });
        continue;
      }
      availableStock = v.stock;
      unitPrice = v.price;
      variant = v.name;
    }

    if (availableStock < item.quantity) {
      problems.push({
        productId: item.productId,
        message: `Insufficient stock for ${product.name}${variant ? ' (' + variant + ')' : ''}. Available: ${availableStock}, requested: ${item.quantity}`,
      });
      continue;
    }

    resolvedItems.push({
      productId: product._id,
      name: product.name,
      variant,
      price: unitPrice,
      quantity: item.quantity,
      variantId: item.variantId || null,
    });
  }

  return { problems, resolvedItems };
}

// @route POST /api/orders
async function createOrder(req, res, next) {
  try {
    const { items, shippingAddress, discount, couponCode, tax } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'A valid shipping address is required' });
    }

    const { problems, resolvedItems } = await validateStock(items);
    if (problems.length) {
      return res.status(400).json({ success: false, message: 'Some items are unavailable', problems });
    }

    const subtotal = resolvedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const appliedDiscount = Math.min(discount || 0, subtotal);
    const afterDiscount = subtotal - appliedDiscount;
    const shippingCost = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
    const taxAmount = tax !== undefined ? tax : DEFAULT_TAX_RATE;
    const total = afterDiscount + shippingCost + taxAmount;

    const customerId = req.user ? req.user.id : null;

    let orderNumber;
    let attempts = 0;
    while (attempts < 5) {
      orderNumber = generateOrderNumber();
      const exists = await Order.findOne({ orderNumber });
      if (!exists) break;
      attempts += 1;
    }

    const order = await Order.create({
      orderNumber,
      customerId,
      items: resolvedItems.map(({ productId, name, variant, price, quantity }) => ({
        productId,
        name,
        variant,
        price,
        quantity,
      })),
      shippingAddress,
      subtotal,
      shippingCost,
      discount: appliedDiscount,
      tax: taxAmount,
      total,
      couponCode,
      status: 'pending',
      paymentStatus: 'pending',
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/orders/my
async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/orders
async function getAllOrders(req, res, next) {
  try {
    const { status, paymentStatus, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(filter).populate('customerId', 'name email phone').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/orders/:id/status
async function updateOrderStatus(req, res, next) {
  try {
    const { status, trackingNumber } = req.body;
    const validStatuses = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateStock,
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
