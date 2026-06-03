const { Op, fn, col, literal } = require('sequelize');
const { sequelize, Booking, Payment, Room, RoomType, User } = require('../models');

// GET /api/reports/bookings?date=YYYY-MM-DD
const bookingsReport = async (req, res) => {
  try {
    const { date } = req.query;
    const where = {};
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      where.createdAt = { [Op.between]: [start, end] };
    }
    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Payment, as: 'payments' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/revenue?month=YYYY-MM
const revenueReport = async (req, res) => {
  try {
    const { month } = req.query;
    const where = { status: 'confirmed', type: 'final' };
    if (month) {
      const [y, m] = month.split('-');
      const start = new Date(y, Number(m) - 1, 1);
      const end = new Date(y, Number(m), 0, 23, 59, 59);
      where.confirmed_at = { [Op.between]: [start, end] };
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [{ model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] }],
        },
      ],
      order: [['confirmed_at', 'ASC']],
    });

    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const byDay = {};
    payments.forEach((p) => {
      if (!p.confirmed_at) return;
      const day = new Date(p.confirmed_at).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + parseFloat(p.amount || 0);
    });

    res.json({
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      by_day: Object.entries(byDay).map(([date, amount]) => ({ date, amount: parseFloat(amount.toFixed(2)) })),
      payments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/rooms
const roomsReport = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [{ model: RoomType, as: 'roomType' }],
      order: [['room_number', 'ASC']],
    });

    // ดึง bookings+payments ทั้งหมดครั้งเดียวเพื่อหลีกเลี่ยง N+1
    const allBookings = await Booking.findAll({
      attributes: ['id', 'room_id', 'status'],
      where: { status: { [Op.notIn]: ['cancelled'] } },
    });
    const allPayments = await Payment.findAll({
      attributes: ['id', 'booking_id', 'amount', 'status'],
      where: { status: 'confirmed' },
    });

    const bookingsByRoom = {};
    allBookings.forEach((b) => {
      if (!bookingsByRoom[b.room_id]) bookingsByRoom[b.room_id] = [];
      bookingsByRoom[b.room_id].push(b);
    });

    const paymentsByBooking = {};
    allPayments.forEach((p) => {
      if (!paymentsByBooking[p.booking_id]) paymentsByBooking[p.booking_id] = [];
      paymentsByBooking[p.booking_id].push(p);
    });

    const stats = rooms.map((room) => {
      const roomBookings = bookingsByRoom[room.id] || [];
      const total_bookings = roomBookings.length;
      const completed_bookings = roomBookings.filter((b) => b.status === 'completed').length;
      const revenue = roomBookings.reduce((sum, b) => {
        const pmts = paymentsByBooking[b.id] || [];
        return sum + pmts.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      }, 0);
      return {
        ...room.toJSON(),
        total_bookings,
        completed_bookings,
        revenue: parseFloat(revenue.toFixed(2)),
      };
    });

    stats.sort((a, b) => b.total_bookings - a.total_bookings);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/customers
const customersReport = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    const allBookings = await Booking.findAll({
      attributes: ['id', 'user_id', 'status'],
    });

    const allPayments = await Payment.findAll({
      attributes: ['id', 'booking_id', 'amount', 'status'],
      where: { status: 'confirmed' },
    });

    const bookingsByUser = {};
    allBookings.forEach((b) => {
      if (!bookingsByUser[b.user_id]) bookingsByUser[b.user_id] = [];
      bookingsByUser[b.user_id].push(b);
    });

    const paymentsByBooking = {};
    allPayments.forEach((p) => {
      if (!paymentsByBooking[p.booking_id]) paymentsByBooking[p.booking_id] = [];
      paymentsByBooking[p.booking_id].push(p);
    });

    const stats = users.map((user) => {
      const userBookings = bookingsByUser[user.id] || [];
      const total_bookings = userBookings.length;
      const completed_bookings = userBookings.filter((b) => b.status === 'completed').length;
      const total_spent = userBookings.reduce((sum, b) => {
        const pmts = paymentsByBooking[b.id] || [];
        return sum + pmts.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      }, 0);
      return {
        ...user.toJSON(),
        total_bookings,
        completed_bookings,
        total_spent: parseFloat(total_spent.toFixed(2)),
      };
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { bookingsReport, revenueReport, roomsReport, customersReport };
