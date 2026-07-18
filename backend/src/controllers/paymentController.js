const QRCode = require('qrcode');
const { Payment, Booking, Room, RoomType, User, Customer } = require('../models');
const { generateQR } = require('../services/phajay');

const bookingIncludes = [
  { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
  { model: User, as: 'user', attributes: ['u_id', 'email'], include: [{ model: Customer, as: 'customer', attributes: ['fname', 'lname', 'phone'] }] },
  { model: Payment, as: 'payments' },
];

// ใช้ร่วมกันทั้งตอน staff กดยืนยันเงินสด และตอน PhaJay แจ้งว่าจ่าย QR สำเร็จ
async function applyConfirmedPayment(payment) {
  await payment.update({ status: 'confirmed' });

  const booking = await Booking.findByPk(payment.b_id);
  if (payment.type === 'deposit' && booking.status === 'pending') {
    await booking.update({ status: 'confirmed', deposit_amount: payment.amount });
  }
  if (payment.type === 'final' && ['checked_in', 'checking_out'].includes(booking.status)) {
    await booking.update({ status: 'completed', actual_check_out: new Date() });
    await Room.update({ status: 'available' }, { where: { r_id: booking.r_id } });
  }
  return booking;
}

// เรียกจาก PhaJay socket listener (backend/src/app.js) ตอนได้รับแจ้งว่าจ่าย QR สำเร็จจริง
async function confirmQrPaymentByTransactionId(transactionId) {
  const payment = await Payment.findOne({ where: { transaction_id: transactionId } });
  if (!payment || payment.status !== 'pending') return null;
  return applyConfirmedPayment(payment);
}

// POST /api/payments  (ຈ່າຍເງິນສົດ — ລໍພະນັກງານກົດຢືນຢັນ)
const createPayment = async (req, res) => {
  try {
    const { booking_id, amount, type } = req.body;

    if (!booking_id || !amount || !type) {
      return res.status(400).json({ message: 'ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });

    const payment = await Payment.create({
      b_id: booking_id,
      amount: parseFloat(amount),
      type,
      method: 'cash',
      status: 'pending',
    });

    const full = await Booking.findByPk(booking_id, { include: bookingIncludes });
    res.status(201).json({ payment, booking: full });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payments/qr/generate  (ເຈນ QR ຈ່າຍຜ່ານ PhaJay/BCEL One)
const generateQrPayment = async (req, res) => {
  try {
    const { booking_id, amount, type } = req.body;

    if (!booking_id || !amount || !type) {
      return res.status(400).json({ message: 'ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });

    const payment = await Payment.create({
      b_id: booking_id,
      amount: parseFloat(amount),
      type,
      method: 'QR',
      status: 'pending',
    });

    // BCEL ยังไม่รองรับ description เป็นภาษาไทย/ลาว ต้องใช้ภาษาอังกฤษ
    const description = type === 'deposit'
      ? `Deposit for booking #${booking_id}`
      : `Final payment for booking #${booking_id}`;

    let phajayResult;
    try {
      phajayResult = await generateQR({
        amount: parseFloat(amount),
        description,
        tag1: String(payment.pay_id),
        tag2: String(booking_id),
        tag3: type,
      });
    } catch (phajayErr) {
      await payment.destroy();
      return res.status(502).json({ message: 'ສ້າງ QR ຊຳລະເງິນລົ້ມເຫລວ ກະລຸນາລອງໃໝ່' });
    }

    const qrImage = await QRCode.toDataURL(phajayResult.qrCode);
    await payment.update({ transaction_id: phajayResult.transactionId, qr_image: qrImage });

    res.status(201).json({
      payment,
      qrImage,
      link: phajayResult.link,
      transactionId: phajayResult.transactionId,
    });
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

    await applyConfirmedPayment(payment);

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

module.exports = {
  createPayment,
  generateQrPayment,
  confirmPayment,
  rejectPayment,
  getPaymentsByBooking,
  confirmQrPaymentByTransactionId,
};
