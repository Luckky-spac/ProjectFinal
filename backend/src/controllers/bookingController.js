const { Op } = require('sequelize');
const { Booking, Room, RoomType, Payment, User } = require('../models');

const bookingIncludes = [
  { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
  { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
  { model: Payment, as: 'payments' },
];

// POST /api/bookings  (ลูกค้าเท่านั้น)
const createBooking = async (req, res) => {
  try {
    const { room_id, start_time, end_time, guests, note } = req.body;
    const user_id = req.user.id;

    if (!room_id || !start_time || !end_time) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'วันเวลาไม่ถูกต้อง' });
    }

    const room = await Room.findByPk(room_id, {
      include: [{ model: RoomType, as: 'roomType' }],
    });
    if (!room) return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    if (room.status === 'maintenance') {
      return res.status(400).json({ message: 'ห้องนี้กำลังซ่อมบำรุง' });
    }

    const overlap = await Booking.findOne({
      where: {
        room_id,
        status: { [Op.notIn]: ['cancelled'] },
        start_time: { [Op.lt]: end },
        end_time: { [Op.gt]: start },
      },
    });
    if (overlap) {
      return res.status(400).json({ message: 'ห้องนี้ถูกจองในช่วงเวลาดังกล่าวแล้ว' });
    }

    const hours = (end - start) / (1000 * 60 * 60);
    const total_price = parseFloat((hours * parseFloat(room.roomType.price_per_hour)).toFixed(2));

    const booking = await Booking.create({
      user_id,
      room_id,
      start_time: start,
      end_time: end,
      guests: guests || 1,
      total_price,
      status: 'pending',
      note: note || null,
    });

    const full = await Booking.findByPk(booking.id, { include: bookingIncludes });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/my  (ลูกค้าดูของตัวเอง)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      include: bookingIncludes,
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, { include: bookingIncludes });
    if (!booking) return res.status(404).json({ message: 'ไม่พบการจองนี้' });
    // ลูกค้าดูได้เฉพาะของตัวเอง, พนักงานดูได้ทั้งหมด
    if (req.user.type === 'user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/deposit  (ลูกค้าอัปโหลด slip มัดจำ)
const uploadDeposit = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'ไม่พบการจองนี้' });
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'ไม่สามารถอัปโหลด slip ในสถานะนี้' });
    }
    if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์ slip' });

    const deposit_amount = parseFloat(req.body.deposit_amount);
    if (!deposit_amount || deposit_amount <= 0) {
      return res.status(400).json({ message: 'กรุณาระบุจำนวนเงินมัดจำ' });
    }
    if (deposit_amount > parseFloat(booking.total_price)) {
      return res.status(400).json({ message: 'จำนวนเงินมัดจำมากกว่าราคารวม' });
    }

    const slip_url = `/uploads/${req.file.filename}`;

    // อัปเดต booking
    await booking.update({ deposit_amount, deposit_slip: slip_url });

    // สร้าง Payment record สำหรับมัดจำ
    await Payment.create({
      booking_id: booking.id,
      amount: deposit_amount,
      type: 'deposit',
      method: req.body.method || 'transfer',
      slip_url,
      status: 'pending',
    });

    const full = await Booking.findByPk(booking.id, { include: bookingIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/status  (พนักงานเปลี่ยนสถานะ)
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'checked_in', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'ไม่พบการจองนี้' });

    const updates = { status };
    if (status === 'confirmed') {
      updates.confirmed_by = req.user.id;
      // ยืนยัน deposit payment ด้วย
      await Payment.update(
        { status: 'confirmed', confirmed_by: req.user.id, confirmed_at: new Date() },
        { where: { booking_id: booking.id, type: 'deposit', status: 'pending' } }
      );
    }
    if (status === 'checked_in') updates.actual_check_in = new Date();
    if (status === 'completed') updates.actual_check_out = new Date();

    await booking.update(updates);
    const full = await Booking.findByPk(booking.id, { include: bookingIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings  (พนักงานดูทั้งหมด)
const getAllBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const bookings = await Booking.findAll({
      where,
      include: bookingIncludes,
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  uploadDeposit,
  updateStatus,
  getAllBookings,
};
