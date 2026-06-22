const express = require('express');
const router = express.Router();
const { authenticate, isUser, isEmployee } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookingById,
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
router.patch('/:id/status', isEmployee, updateStatus);

router.patch('/:id/checkin', checkin);
router.patch('/:id/checkin/confirm', isEmployee, checkinConfirm);
router.patch('/:id/checkout', checkout);
router.patch('/:id/checkout/confirm', isEmployee, checkoutConfirm);

router.patch('/:id/extend', extendBooking);
router.patch('/:id/transfer', isEmployee, transferRoom);

module.exports = router;
