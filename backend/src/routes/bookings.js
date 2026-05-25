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
} = require('../controllers/bookingController');

router.use(authenticate);

router.get('/', isEmployee, getAllBookings);
router.get('/my', isUser, getMyBookings);
router.get('/:id', getBookingById);
router.post('/', isUser, createBooking);
router.patch('/:id/deposit', isUser, upload.single('slip'), uploadDeposit);
router.patch('/:id/status', isEmployee, updateStatus);

module.exports = router;
