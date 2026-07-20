const { Op } = require('sequelize');
const { Room, RoomType, Booking } = require('../models');

// GET /api/rooms
const getRooms = async (req, res) => {
  try {
    const { date, start_time, end_time } = req.query;

    const rooms = await Room.findAll({
      include: [{ model: RoomType, as: 'roomType' }],
      order: [['room_number', 'ASC']],
    });

    if (date && start_time && end_time) {
      const requestStart = new Date(`${date}T${start_time}:00`);
      let requestEnd = new Date(`${date}T${end_time}:00`);

      // ຮ້ານເປີດ 12:00 - 01:00 (ຂ້າມວັນ) — ຖ້າເວລາສິ້ນສຸດບໍ່ຫຼັງເວລາເລີ່ມ ໃຫ້ຖືວ່າຂ້າມໄປມື້ຖັດໄປ
      if (!isNaN(requestStart) && !isNaN(requestEnd) && requestEnd <= requestStart) {
        requestEnd = new Date(requestEnd.getTime() + 24 * 3600000);
      }

      if (isNaN(requestStart) || isNaN(requestEnd) || requestStart >= requestEnd) {
        return res.status(400).json({ message: 'ວັນເວລາບໍ່ຖືກຕ້ອງ' });
      }

      const overlappingBookings = await Booking.findAll({
        attributes: ['r_id'],
        where: {
          status: { [Op.notIn]: ['cancelled'] },
          start_time: { [Op.lt]: requestEnd },
          end_time: { [Op.gt]: requestStart },
        },
      });
      const bookedRoomIds = new Set(overlappingBookings.map((b) => b.r_id));

      const result = rooms
        .map((room) => ({
          ...room.toJSON(),
          isAvailable: !bookedRoomIds.has(room.r_id) && room.status === 'available',
        }))
        .filter((room) => room.isAvailable);
      return res.json(result);
    }

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
    if (!room) return res.status(404).json({ message: 'ບໍ່ພົບຫ້ອງນີ້' });
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
    const { room_number, room_type_id, floor, status } = req.body;
    if (!room_number || !room_type_id) {
      return res.status(400).json({ message: 'ກະລຸນາກອກເລກຫ້ອງ ແລະ ປະເພດຫ້ອງ' });
    }
    const image_url  = req.files?.image?.[0]  ? `/uploads/${req.files.image[0].filename}`  : null;
    const image_url2 = req.files?.image2?.[0] ? `/uploads/${req.files.image2[0].filename}` : null;
    const room = await Room.create({ room_number, rtype_id: room_type_id, floor, status, image_url, image_url2 });
    const full = await Room.findByPk(room.r_id, { include: [{ model: RoomType, as: 'roomType' }] });
    res.status(201).json(full);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'ເລກຫ້ອງນີ້ມີຢູ່ແລ້ວ' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/rooms/:id (Admin)
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'ບໍ່ພົບຫ້ອງນີ້' });
    const { room_number, room_type_id, floor, status } = req.body;
    const image_url  = req.files?.image?.[0]  ? `/uploads/${req.files.image[0].filename}`  : room.image_url;
    const image_url2 = req.files?.image2?.[0] ? `/uploads/${req.files.image2[0].filename}` : room.image_url2;
    await room.update({ room_number, rtype_id: room_type_id, floor, status, image_url, image_url2 });
    const full = await Room.findByPk(room.r_id, { include: [{ model: RoomType, as: 'roomType' }] });
    res.json(full);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'ເລກຫ້ອງນີ້ມີຢູ່ແລ້ວ' });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/rooms/:id (Admin)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'ບໍ່ພົບຫ້ອງນີ້' });
    await room.destroy();
    res.json({ message: 'ລົບຫ້ອງສຳເລັດ' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRooms, getRoomById, getRoomTypes, createRoom, updateRoom, deleteRoom };
