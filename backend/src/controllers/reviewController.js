const { Review, Booking, Room, RoomType, User } = require('../models');

// POST /api/reviews  (ลูกค้าเขียนรีวิว)
const createReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    if (!booking_id || !rating) {
      return res.status(400).json({ message: 'booking_id และ rating จำเป็นต้องกรอก' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating ต้องอยู่ระหว่าง 1-5' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) return res.status(404).json({ message: 'ไม่พบการจองนี้' });
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์รีวิวการจองนี้' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'รีวิวได้เฉพาะการจองที่เสร็จสิ้นแล้วเท่านั้น' });
    }

    const existing = await Review.findOne({ where: { booking_id } });
    if (existing) return res.status(409).json({ message: 'คุณรีวิวการจองนี้ไปแล้ว' });

    const review = await Review.create({
      booking_id,
      user_id: req.user.id,
      room_id: booking.room_id,
      rating,
      comment: comment || null,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/room/:room_id  (ดูรีวิวของห้อง)
const getRoomReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { room_id: req.params.room_id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: Booking, as: 'booking', attributes: ['id', 'start_time', 'end_time'] },
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

// GET /api/reviews/my  (ลูกค้าดูรีวิวของตัวเอง)
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
        { model: Booking, as: 'booking', attributes: ['id', 'start_time', 'end_time'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createReview, getRoomReviews, getMyReviews };
