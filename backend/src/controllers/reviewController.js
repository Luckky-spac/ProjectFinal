const { Review, Booking, Room, RoomType, User, Customer } = require('../models');

// POST /api/reviews  (ລູກຄ້າຂຽນ review)
const createReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    if (!booking_id || !rating) {
      return res.status(400).json({ message: 'booking_id ແລະ rating ຈຳເປັນຕ້ອງກອກ' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating ຕ້ອງຢູ່ລະຫວ່າງ 1-5' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) return res.status(404).json({ message: 'ບໍ່ພົບການຈອງນີ້' });
    if (booking.u_id !== req.user.id) {
      return res.status(403).json({ message: 'ບໍ່ມີສິດ review ການຈອງນີ້' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'review ໄດ້ສະເພາະການຈອງທີ່ສຳເລັດແລ້ວ' });
    }

    const existing = await Review.findOne({ where: { b_id: booking_id } });
    if (existing) return res.status(409).json({ message: 'ທ່ານ review ການຈອງນີ້ໄປແລ້ວ' });

    const review = await Review.create({
      b_id: booking_id,
      u_id: req.user.id,
      r_id: booking.r_id,
      rating,
      comment: comment || null,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/room/:room_id  (ດູ review ຂອງຫ້ອງ)
const getRoomReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { r_id: req.params.room_id },
      include: [
        { model: User, as: 'user', attributes: ['u_id', 'email'], include: [{ model: Customer, as: 'customer', attributes: ['fname', 'lname'] }] },
        { model: Booking, as: 'booking', attributes: ['b_id', 'start_time', 'end_time'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ average_rating: avg ? parseFloat(avg) : null, total: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/my  (ລູກຄ້າດູ review ຂອງຕົວເອງ)
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { u_id: req.user.id },
      include: [
        { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
        { model: Booking, as: 'booking', attributes: ['b_id', 'start_time', 'end_time'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createReview, getRoomReviews, getMyReviews };
