const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const User = require('../models/User');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// @route GET /api/admin/stats
async function getDashboardStats(req, res, next) {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
    const lastMonthEnd = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todaysBookingsCount, monthRevenueAgg, lastMonthRevenueAgg, newCustomersCount, avgTicketAgg] =
      await Promise.all([
        Appointment.countDocuments({ date: now.toISOString().split('T')[0] }),
        Payment.aggregate([
          { $match: { status: 'succeeded', createdAt: { $gte: monthStart, $lte: monthEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.aggregate([
          { $match: { status: 'succeeded', createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        User.countDocuments({ role: 'customer', createdAt: { $gte: monthStart, $lte: monthEnd } }),
        Payment.aggregate([
          { $match: { status: 'succeeded', createdAt: { $gte: monthStart, $lte: monthEnd } } },
          { $group: { _id: null, avg: { $avg: '$amount' }, count: { $sum: 1 } } },
        ]),
      ]);

    const monthRevenue = monthRevenueAgg[0] ? monthRevenueAgg[0].total : 0;
    const lastMonthRevenue = lastMonthRevenueAgg[0] ? lastMonthRevenueAgg[0].total : 0;
    const revenueChangePercent =
      lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : monthRevenue > 0 ? 100 : 0;
    const avgTicket = avgTicketAgg[0] ? avgTicketAgg[0].avg : 0;

    res.status(200).json({
      success: true,
      stats: {
        todaysBookingsCount,
        monthRevenue,
        lastMonthRevenue,
        revenueChangePercent: Math.round(revenueChangePercent * 100) / 100,
        newCustomersCount,
        avgTicket: Math.round(avgTicket * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/revenue
async function getRevenueChart(req, res, next) {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const revenueData = await Payment.aggregate([
      { $match: { status: 'succeeded', createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const chart = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = revenueData.find((r) => r._id.year === year && r._id.month === month);
      chart.push({ year, month, revenue: found ? found.total : 0 });
    }

    res.status(200).json({ success: true, chart });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/schedule-today
async function getTodaySchedule(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const appointments = await Appointment.find({ date: today, status: { $ne: 'cancelled' } })
      .populate('staffId', 'name photo')
      .populate('customerId', 'name email phone')
      .sort({ startTimeMinutes: 1 });
    res.status(200).json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/activity
async function getRecentActivity(req, res, next) {
  try {
    const [recentAppointments, recentOrders] = await Promise.all([
      Appointment.find().populate('staffId', 'name').sort({ createdAt: -1 }).limit(10),
      Order.find().sort({ createdAt: -1 }).limit(10),
    ]);

    const activity = [
      ...recentAppointments.map((a) => ({
        type: 'appointment',
        id: a._id,
        label: `Booking ${a.bookingNumber}`,
        status: a.status,
        createdAt: a.createdAt,
      })),
      ...recentOrders.map((o) => ({
        type: 'order',
        id: o._id,
        label: `Order ${o.orderNumber}`,
        status: o.status,
        createdAt: o.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.status(200).json({ success: true, activity });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/low-stock
async function getLowStockProducts(req, res, next) {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/customers
async function getCustomerList(req, res, next) {
  try {
    const { q } = req.query;
    const filter = { role: 'customer' };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }
    const customers = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: customers.length, customers });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/customers/:id
async function getCustomerDetail(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const [appointments, orders] = await Promise.all([
      Appointment.find({ customerId: user._id }).sort({ createdAt: -1 }),
      Order.find({ customerId: user._id }).sort({ createdAt: -1 }),
    ]);
    res.status(200).json({ success: true, customer: user, appointments, orders });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/payments
async function getPaymentsList(req, res, next) {
  try {
    const { status, type, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    const payments = await Payment.find(filter).populate('customerId', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/revenue/export (optional CSV export)
async function exportRevenueCSV(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const filter = { status: 'succeeded' };
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    const payments = await Payment.find(filter).sort({ createdAt: 1 });

    const rows = ['Date,Type,ReferenceId,Amount,Currency'];
    for (const p of payments) {
      rows.push(
        `${p.createdAt.toISOString()},${p.type},${p.referenceId},${p.amount},${p.currency}`
      );
    }
    const csv = rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="revenue.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getTodaySchedule,
  getRecentActivity,
  getLowStockProducts,
  getCustomerList,
  getCustomerDetail,
  getPaymentsList,
  exportRevenueCSV,
};
