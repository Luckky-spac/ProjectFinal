const { Op } = require('sequelize');
const { Room, RoomType, Booking } = require('../models');

// GET /api/rooms
// query: ?date=YYYY-MM-DD&start_time=HH:mm&end_time=HH:mm
const getRooms = async (req, res) => {
  try {
    const { date, start_time, end_time } = req.query;

    const rooms = await Room.findAll({
      include: [{ model: RoomType, as: 'roomType' }],
      order: [['room_number', 'ASC']],
    });

    // ถ้าส่ง filter มา ให้คำนวณ isAvailable จาก booking overlap
    if (date && start_time && end_time) {
      const requestStart = new Date(`${date}T${start_time}:00`);
      const requestEnd = new Date(`${date}T${end_time}:00`);

      if (isNaN(requestStart) || isNaN(requestEnd) || requestStart >= requestEnd) {
        return res.status(400).json({ message: 'วันเวลาไม่ถูกต้อง' });
      }

      // หา room_id ที่มีการจองทับช่วงเวลาที่ขอ
      const overlappingBookings = await Booking.findAll({
        attributes: ['room_id'],
        where: {
          status: { [Op.notIn]: ['cancelled'] },
          start_time: { [Op.lt]: requestEnd },
          end_time: { [Op.gt]: requestStart },
        },
      });
      const bookedRoomIds = new Set(overlappingBookings.map((b) => b.room_id));

      const result = rooms
        .map((room) => ({
          ...room.toJSON(),
          isAvailable: !bookedRoomIds.has(room.id) && room.status === 'available',
        }))
        .filter((room) => room.isAvailable);
      return res.json(result);
    }

    // ไม่มี filter — ใช้ status ของห้องเป็น isAvailable
    const result = rooms.map((room) => ({
      ...room.toJSON(),
      isAvailable: room.status === 'available',
    }));
    return res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rooms/:id
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [{ model: RoomType, as: 'roomType' }],
    });
    if (!room) return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/room-types
const getRoomTypes = async (req, res) => {
  try {
    const types = await RoomType.findAll({ order: [['name', 'ASC']] });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rooms (Admin)
const createRoom = async (req, res) => {
  try {
    const { room_number, room_type_id, floor, status, image_url } = req.body;
    if (!room_number || !room_type_id) {
      return res.status(400).json({ message: 'กรุณากรอกเลขห้องและประเภทห้อง' });
    }
    const room = await Room.create({ room_number, room_type_id, floor, status, image_url });
    const full = await Room.findByPk(room.id, { include: [{ model: RoomType, as: 'roomType' }] });
    res.status(201).json(full);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'เลขห้องนี้มีอยู่แล้ว' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/rooms/:id (Admin)
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    const { room_number, room_type_id, floor, status, image_url } = req.body;
    await room.update({ room_number, room_type_id, floor, status, image_url });
    const full = await Room.findByPk(room.id, { include: [{ model: RoomType, as: 'roomType' }] });
    res.json(full);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'เลขห้องนี้มีอยู่แล้ว' });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/rooms/:id (Admin)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    await room.destroy();
    res.json({ message: 'ลบห้องสำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRooms, getRoomById, getRoomTypes, createRoom, updateRoom, deleteRoom };
