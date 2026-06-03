const express = require('express');
const router = express.Router();
const { authenticate, isUser, isEmployee } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  uploadDeposit,
  updateStatus,
  getAllBookings,
  checkin,
  checkinConfirm,
  checkout,
  checkoutConfirm,
  extendBooking,
  transferRoom,
} = require('../controllers/bookingController');

router.use(authenticate);

router.get('/', isEmployee, getAllBookings);
router.get('/my', isUser, getMyBookings);
router.get('/:id', getBookingById);
router.post('/', isUser, createBooking);
router.patch('/:id/deposit', isUser, upload.single('slip'), uploadDeposit);
router.patch('/:id/status', isEmployee, updateStatus);

// P4 — Check-in / Check-out
router.patch('/:id/checkin', checkin);
router.patch('/:id/checkin/confirm', isEmployee, checkinConfirm);
router.patch('/:id/checkout', checkout);
router.patch('/:id/checkout/confirm', isEmployee, checkoutConfirm);

// P3.4 — ต่อเวลา
router.patch('/:id/extend', extendBooking);

// P3.5 — ย้ายห้อง (Staff เท่านั้น)
router.patch('/:id/transfer', isEmployee, transferRoom);

module.exports = router;
