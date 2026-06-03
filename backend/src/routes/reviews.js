const express = require('express');
const router = express.Router();
const { authenticate, isUser } = require('../middleware/auth');
const { createReview, getRoomReviews, getMyReviews } = require('../controllers/reviewController');

router.get('/room/:room_id', getRoomReviews);
router.get('/my', authenticate, isUser, getMyReviews);
router.post('/', authenticate, isUser, createReview);

module.exports = router;
