const express = require('express');
const router = express.Router();
const { authenticate, isEmployee, authorize } = require('../middleware/auth');
const { bookingsReport, revenueReport, roomsReport, customersReport } = require('../controllers/reportController');

router.use(authenticate, isEmployee, authorize('admin'));

router.get('/bookings', bookingsReport);
router.get('/revenue', revenueReport);
router.get('/rooms', roomsReport);
router.get('/customers', customersReport);

module.exports = router;
