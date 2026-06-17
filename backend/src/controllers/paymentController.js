const { Payment, Booking, Room, RoomType, User, Customer } = require('../models');

const bookingIncludes = [
  { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
  { model: User, as: 'user', attributes: ['u_id', 'email'], include: [{ model: Customer, as: 'customer', attributes: ['fname', 'lname', 'phone'] }] },
  { model: Payment, as: 'payments' },
];

// POST /api/payments  (ລູກຄ້າ upload slip ຊຳລະສ່ວນທີ່ເຫຼືອ)
const createPayment = async (req, res) => {
  try {
    const { booking_id, amount, method } = req.body;

    if (!booking_id || !amount) {
      return res.status(400).json({ message: 'ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (booking.u_id !== req.user.id) {
      return res.status(403).json({ message: 'ບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້' });
    }
    if (booking.status !== 'checked_in') {
      return res.status(400).json({ message: 'ສາມາດຊຳລະເງິນໄດ້ສະເພາະເມື່ອ check-in ແລ້ວ' });
    }

    const existing = await Payment.findOne({
      where: { b_id: booking_id, type: 'final', status: ['pending', 'confirmed'] },
    });
    if (existing) {
      return res.status(400).json({ message: 'ມີລາຍການຊຳລະເງິນຢູ່ແລ້ວ ກະລຸນາລໍຖ້າພະນັກງານຢືນຢັນ' });
    }
    if (!req.file) return res.status(400).json({ message: 'ກະລຸນາເລືອກໄຟລ slip' });

    const payment = await Payment.create({
      b_id: booking_id,
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

// PATCH /api/payments/:id/confirm  (ພະນັກງານຢືນຢັນການຊຳລະ)
const confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'ບໍ່ພົບລາຍການຊຳລະເງິນ' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'ລາຍການນີ້ຖືກດຳເນີນການແລ້ວ' });
    }

    await payment.update({
      status: 'confirmed',
      confirmed_by: req.user.id,
      confirmed_at: new Date(),
    });

    const booking = await Booking.findByPk(payment.b_id);
    if (['checked_in', 'checking_out'].includes(booking.status)) {
      await booking.update({ status: 'completed', actual_check_out: new Date() });
      await Room.update({ status: 'available' }, { where: { r_id: booking.r_id } });
    }

    const full = await Booking.findByPk(payment.b_id, { include: bookingIncludes });
    res.json({ payment, booking: full });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/payments/:id/reject  (ພະນັກງານປະຕິເສດ)
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
