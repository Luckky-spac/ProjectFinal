const { Payment, Booking, Room, RoomType, User, Customer } = require('../models');

const bookingIncludes = [
  { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
  { model: User, as: 'user', attributes: ['u_id', 'email'], include: [{ model: Customer, as: 'customer', attributes: ['fname', 'lname', 'phone'] }] },
  { model: Payment, as: 'payments' },
];

// POST /api/payments
// QR → status=confirmed อัตโนมัติ | cash → status=pending (พนักงานกดยืนยัน)
const createPayment = async (req, res) => {
  try {
    const { booking_id, amount, type, method } = req.body;

    if (!booking_id || !amount || !type) {
      return res.status(400).json({ message: 'ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });

    const payMethod = method || 'QR';
    const autoConfirm = payMethod === 'QR';

    const payment = await Payment.create({
      b_id: booking_id,
      amount: parseFloat(amount),
      type,
      method: payMethod,
      status: autoConfirm ? 'confirmed' : 'pending',
    });

    if (autoConfirm && type === 'deposit') {
      await booking.update({ status: 'confirmed', deposit_amount: parseFloat(amount) });
    }

    if (autoConfirm && type === 'final' && ['checked_in', 'checking_out'].includes(booking.status)) {
      await booking.update({ status: 'completed', actual_check_out: new Date() });
      await Room.update({ status: 'available' }, { where: { r_id: booking.r_id } });
    }

    const full = await Booking.findByPk(booking_id, { include: bookingIncludes });
    res.status(201).json({ payment, booking: full });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/payments/:id/confirm  (ພະນັກງານຢືນຢັນ cash)
const confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'ບໍ່ພົບລາຍການຊຳລະເງິນ' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'ລາຍການນີ້ຖືກດຳເນີນການແລ້ວ' });
    }

    await payment.update({ status: 'confirmed' });

    const booking = await Booking.findByPk(payment.b_id);
    if (payment.type === 'deposit' && booking.status === 'pending') {
      await booking.update({ status: 'confirmed', deposit_amount: payment.amount });
    }
    if (payment.type === 'final' && ['checked_in', 'checking_out'].includes(booking.status)) {
      await booking.update({ status: 'completed', actual_check_out: new Date() });
      await Room.update({ status: 'available' }, { where: { r_id: booking.r_id } });
    }

    const full = await Booking.findByPk(payment.b_id, { include: bookingIncludes });
    res.json({ payment, booking: full });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/payments/:id/reject  (ພະນັກງານປະຕິເສດ cash)
const rejectPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'ບໍ່ພົບລາຍການຊຳລະເງິນ' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'ລາຍການນີ້ຖືກດຳເນີນການແລ້ວ' });
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
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (req.user.role === 'member' && booking.u_id !== req.user.id) {
      return res.status(403).json({ message: 'ບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້' });
    }
    const payments = await Payment.findAll({
      where: { b_id: req.params.booking_id },
      order: [['createdAt', 'ASC']],
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPayment, confirmPayment, rejectPayment, getPaymentsByBooking };
