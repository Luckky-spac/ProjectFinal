const express = require('express');
const router = express.Router();
const { authenticate, isUser, isEmployee } = require('../middleware/auth');
const { createPayment, generateQrPayment, confirmPayment, rejectPayment, getPaymentsByBooking } = require('../controllers/paymentController');

router.use(authenticate);

router.get('/booking/:booking_id', getPaymentsByBooking);
router.post('/', isUser, createPayment);
router.post('/qr/generate', isUser, generateQrPayment);
router.patch('/:id/confirm', isEmployee, confirmPayment);
router.patch('/:id/reject', isEmployee, rejectPayment);

module.exports = router;
