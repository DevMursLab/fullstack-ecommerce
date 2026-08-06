const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getDashboardStats,
  getRevenueChart,
  getTodaySchedule,
  getRecentActivity,
  getLowStockProducts,
  getCustomerList,
  getCustomerDetail,
  getPaymentsList,
  exportRevenueCSV,
} = require('../controllers/admin.controller');

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueChart);
router.get('/revenue/export', exportRevenueCSV);
router.get('/schedule-today', getTodaySchedule);
router.get('/activity', getRecentActivity);
router.get('/low-stock', getLowStockProducts);
router.get('/customers', getCustomerList);
router.get('/customers/:id', getCustomerDetail);
router.get('/payments', getPaymentsList);

module.exports = router;
