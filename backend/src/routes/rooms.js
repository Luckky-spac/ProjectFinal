const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
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
router.post('/', authenticate, authorize('admin'), upload.single('image'), createRoom);
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), updateRoom);
router.delete('/:id', authenticate, authorize('admin'), deleteRoom);

module.exports = router;
