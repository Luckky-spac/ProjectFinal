const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getRooms,
  getRoomById,
  getRoomTypes,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');

router.get('/', getRooms);
router.get('/types', getRoomTypes);
router.get('/:id', getRoomById);
router.post('/', authenticate, authorize('admin'), createRoom);
router.put('/:id', authenticate, authorize('admin'), updateRoom);
router.delete('/:id', authenticate, authorize('admin'), deleteRoom);

module.exports = router;
