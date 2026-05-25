const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const roomRoutes = require('./rooms');
const bookingRoutes = require('./bookings');
const paymentRoutes = require('./payments');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hotel Booking API is running' });
});

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
