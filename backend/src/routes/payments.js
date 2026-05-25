const express = require('express');
const router = express.Router();
const { authenticate, isUser, isEmployee } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createPayment, confirmPayment, rejectPayment, getPaymentsByBooking } = require('../controllers/paymentController');

router.use(authenticate);

router.get('/booking/:booking_id', getPaymentsByBooking);
router.post('/', isUser, upload.single('slip'), createPayment);
router.patch('/:id/confirm', isEmployee, confirmPayment);
router.patch('/:id/reject', isEmployee, rejectPayment);

module.exports = router;
