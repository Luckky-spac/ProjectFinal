const { Op } = require('sequelize');
const { Booking, Room, RoomType, Payment, User, Customer } = require('../models');

const bookingIncludes = [
  { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
  { model: User, as: 'user', attributes: ['u_id', 'email'], include: [{ model: Customer, as: 'customer', attributes: ['fname', 'lname', 'phone'] }] },
  { model: Payment, as: 'payments' },
];

// POST /api/bookings  (ລູກຄ້າເທົ່ານັ້ນ)
const createBooking = async (req, res) => {
  try {
    const { room_id, start_time, end_time, guests } = req.body;
    const u_id = req.user.id;

    if (!room_id || !start_time || !end_time) {
      return res.status(400).json({ message: 'ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'ວັນເວລາບໍ່ຖືກຕ້ອງ' });
    }

    const room = await Room.findByPk(room_id, {
      include: [{ model: RoomType, as: 'roomType' }],
    });
    if (!room) return res.status(404).json({ message: 'ບໍ່ພົບຫ້ອງນີ້' });
    if (room.status === 'maintenance') {
      return res.status(400).json({ message: 'ຫ້ອງນີ້ກຳລັງຊ່ອມບຳລຸງ' });
    }

    const overlap = await Booking.findOne({
      where: {
        r_id: room_id,
        status: { [Op.notIn]: ['cancelled'] },
        start_time: { [Op.lt]: end },
        end_time: { [Op.gt]: start },
      },
    });
    if (overlap) {
      return res.status(400).json({ message: 'ຫ້ອງນີ້ຖືກຈອງໃນຊ່ວງເວລານັ້ນແລ້ວ' });
    }

    const hours = (end - start) / (1000 * 60 * 60);
    const total_price = parseFloat((hours * parseFloat(room.roomType.price_per_hour)).toFixed(2));

    const booking = await Booking.create({
      u_id,
      r_id: room_id,
      start_time: start,
      end_time: end,
      guests: guests || 1,
      total_price,
      status: 'pending',
    });

    const full = await Booking.findByPk(booking.b_id, { include: bookingIncludes });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/my  (ລູກຄ້າດູຂອງຕົວເອງ)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { u_id: req.user.id },
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
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (req.user.role === 'member' && booking.u_id !== req.user.id) {
      return res.status(403).json({ message: 'ບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/status  (ພະນັກງານປ່ຽນສະຖານະ)
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'checked_in', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'ສະຖານະບໍ່ຖືກຕ້ອງ' });
    }

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });

    const updates = { status };
    if (status === 'checked_in') updates.actual_check_in = new Date();
    if (status === 'completed') updates.actual_check_out = new Date();

    await booking.update(updates);
    const full = await Booking.findByPk(booking.b_id, { include: bookingIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings  (ພະນັກງານດູທັງໝົດ)
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

// PATCH /api/bookings/:id/checkin
const checkin = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (req.user.role === 'member' && booking.u_id !== req.user.id) {
      return res.status(403).json({ message: 'ບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'ການຈອງຕ້ອງໄດ້ຮັບການຢືນຢັນກ່ອນ check-in' });
    }
    await booking.update({ status: 'checking_in' });
    const full = await Booking.findByPk(booking.b_id, { include: bookingIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/checkin/confirm  (Staff ຢືນຢັນ check-in)
const checkinConfirm = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (!['confirmed', 'checking_in'].includes(booking.status)) {
      return res.status(400).json({ message: 'ບໍ່ສາມາດຢືນຢັນ check-in ໃນສະຖານະນີ້' });
    }
    await booking.update({ status: 'checked_in', actual_check_in: new Date() });
    await Room.update({ status: 'occupied' }, { where: { r_id: booking.r_id } });
    const full = await Booking.findByPk(booking.b_id, { include: bookingIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/checkout
const checkout = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (req.user.role === 'member' && booking.u_id !== req.user.id) {
      return res.status(403).json({ message: 'ບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້' });
    }
    if (booking.status !== 'checked_in') {
      return res.status(400).json({ message: 'ຕ້ອງ check-in ກ່ອນຈຶ່ງ check-out ໄດ້' });
    }
    await booking.update({ status: 'checking_out' });
    const full = await Booking.findByPk(booking.b_id, { include: bookingIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/checkout/confirm  (Staff ຢືນຢັນ check-out)
const checkoutConfirm = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (!['checked_in', 'checking_out'].includes(booking.status)) {
      return res.status(400).json({ message: 'ບໍ່ສາມາດຢືນຢັນ check-out ໃນສະຖານະນີ້' });
    }
    await booking.update({ status: 'completed', actual_check_out: new Date() });
    await Room.update({ status: 'available' }, { where: { r_id: booking.r_id } });
    const full = await Booking.findByPk(booking.b_id, { include: bookingIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/extend  (ຕໍ່ເວລາ)
const extendBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] }],
    });
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (req.user.role === 'member' && booking.u_id !== req.user.id) {
      return res.status(403).json({ message: 'ບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້' });
    }
    if (booking.status !== 'checked_in') {
      return res.status(400).json({ message: 'ຕ້ອງຢູ່ໃນສະຖານະ checked_in ຈຶ່ງຕໍ່ເວລາໄດ້' });
    }

    const { extra_hours } = req.body;
    if (!extra_hours || extra_hours <= 0) {
      return res.status(400).json({ message: 'ກະລຸນາລະບຸຈຳນວນຊົ່ວໂມງທີ່ຕ້ອງການຕໍ່' });
    }

    const newEnd = new Date(new Date(booking.end_time).getTime() + Number(extra_hours) * 3600000);

    const overlap = await Booking.findOne({
      where: {
        r_id: booking.r_id,
        b_id: { [Op.ne]: booking.b_id },
        status: { [Op.notIn]: ['cancelled'] },
        start_time: { [Op.lt]: newEnd },
        end_time: { [Op.gt]: booking.end_time },
      },
    });
    if (overlap) {
      return res.status(400).json({ message: 'ຫ້ອງຖືກຈອງຕໍ່ໃນຊ່ວງເວລານັ້ນແລ້ວ' });
    }

    const pricePerHour = parseFloat(booking.room.roomType.price_per_hour);
    const extraPrice = parseFloat((extra_hours * pricePerHour).toFixed(2));
    const newTotal = parseFloat((parseFloat(booking.total_price) + extraPrice).toFixed(2));

    await booking.update({ end_time: newEnd, total_price: newTotal });
    const full = await Booking.findByPk(booking.b_id, { include: bookingIncludes });
    res.json({ booking: full, extra_price: extraPrice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/transfer  (Staff ຍ້າຍຫ້ອງ)
const transferRoom = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (!['confirmed', 'checked_in'].includes(booking.status)) {
      return res.status(400).json({ message: 'ບໍ່ສາມາດຍ້າຍຫ້ອງໃນສະຖານະນີ້' });
    }

    const { to_room_id } = req.body;
    if (!to_room_id) return res.status(400).json({ message: 'ກະລຸນາເລືອກຫ້ອງໃໝ່' });
    if (to_room_id === booking.r_id) {
      return res.status(400).json({ message: 'ຫ້ອງໃໝ່ຕ້ອງແຕກຕ່າງຈາກຫ້ອງເດີມ' });
    }

    const newRoom = await Room.findByPk(to_room_id);
    if (!newRoom) return res.status(404).json({ message: 'ບໍ່ພົບຫ້ອງໃໝ່' });
    if (newRoom.status !== 'available') {
      return res.status(400).json({ message: 'ຫ້ອງໃໝ່ບໍ່ຫວ່າງ' });
    }

    const overlap = await Booking.findOne({
      where: {
        r_id: to_room_id,
        status: { [Op.notIn]: ['cancelled'] },
        start_time: { [Op.lt]: booking.end_time },
        end_time: { [Op.gt]: booking.start_time },
      },
    });
    if (overlap) {
      return res.status(400).json({ message: 'ຫ້ອງໃໝ່ຖືກຈອງໃນຊ່ວງເວລານັ້ນແລ້ວ' });
    }

    const fromRoomId = booking.r_id;

    if (booking.status === 'checked_in') {
      await Room.update({ status: 'available' }, { where: { r_id: fromRoomId } });
      await Room.update({ status: 'occupied' }, { where: { r_id: to_room_id } });
    }
    await booking.update({ r_id: to_room_id });

    const full = await Booking.findByPk(booking.b_id, { include: bookingIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
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
};
