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
const roomImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
]);
router.post('/', authenticate, authorize('admin'), roomImages, createRoom);
router.put('/:id', authenticate, authorize('admin'), roomImages, updateRoom);
router.delete('/:id', authenticate, authorize('admin'), deleteRoom);

module.exports = router;
