const { Payment, Booking, Room, RoomType, User } = require('../models');

const bookingIncludes = [
  { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
  { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
  { model: Payment, as: 'payments' },
];

// POST /api/payments  (ลูกค้าอัปโหลด slip ชำระส่วนที่เหลือ)
const createPayment = async (req, res) => {
  try {
    const { booking_id, amount, method } = req.body;

    if (!booking_id || !amount) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) return res.status(404).json({ message: 'ไม่พบการจองนี้' });
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    }
    if (booking.status !== 'checked_in') {
      return res.status(400).json({ message: 'สามารถชำระเงินได้เฉพาะเมื่อเช็คอินแล้ว' });
    }

    const existing = await Payment.findOne({
      where: { booking_id, type: 'final', status: ['pending', 'confirmed'] },
    });
    if (existing) {
      return res.status(400).json({ message: 'มีรายการชำระเงินอยู่แล้ว กรุณารอพนักงานยืนยัน' });
    }
    if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์ slip' });

    const payment = await Payment.create({
      booking_id,
      amount: parseFloat(amount),
      type: 'final',
      method: method || 'transfer',
      slip_url: `/uploads/${req.file.filename}`,
      status: 'pending',
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/payments/:id/confirm  (พนักงานยืนยันการชำระ)
const confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'ไม่พบรายการชำระเงิน' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'รายการนี้ถูกดำเนินการแล้ว' });
    }

    await payment.update({
      status: 'confirmed',
      confirmed_by: req.user.id,
      confirmed_at: new Date(),
    });

    await Booking.update(
      { status: 'completed', actual_check_out: new Date() },
      { where: { id: payment.booking_id } }
    );

    const booking = await Booking.findByPk(payment.booking_id, { include: bookingIncludes });
    res.json({ payment, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/payments/:id/reject  (พนักงานปฏิเสธ)
const rejectPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'ไม่พบรายการชำระเงิน' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'รายการนี้ถูกดำเนินการแล้ว' });
    }
    await payment.update({ status: 'rejected' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/booking/:booking_id
const getPaymentsByBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.booking_id);
    if (!booking) return res.status(404).json({ message: 'ไม่พบการจองนี้' });
    if (req.user.type === 'user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    }
    const payments = await Payment.findAll({
      where: { booking_id: req.params.booking_id },
      order: [['createdAt', 'ASC']],
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPayment, confirmPayment, rejectPayment, getPaymentsByBooking };
