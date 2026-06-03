const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const roomRoutes = require('./rooms');
const bookingRoutes = require('./bookings');
const paymentRoutes = require('./payments');
const adminRoutes = require('./admin');
const reportRoutes = require('./reports');
const reviewRoutes = require('./reviews');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hotel Booking API is running' });
});

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/reviews', reviewRoutes);

module.exports = router;
