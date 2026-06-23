const express = require('express');
const router = express.Router();
const { authenticate, isEmployee, authorize } = require('../middleware/auth');
const {
  getUsers, getUserById, createUser, updateUser, deleteUser,
  getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
  createRoomType, updateRoomType, deleteRoomType,
} = require('../controllers/adminController');

router.use(authenticate, isEmployee);

// Users — admin + staff จัดการได้ทั้งคู่
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Employees (admin เท่านั้น)
router.get('/employees', authorize('admin'), getEmployees);
router.get('/employees/:id', authorize('admin'), getEmployeeById);
router.post('/employees', authorize('admin'), createEmployee);
router.put('/employees/:id', authorize('admin'), updateEmployee);
router.delete('/employees/:id', authorize('admin'), deleteEmployee);

// Room types (admin เท่านั้น)
router.post('/room-types', authorize('admin'), createRoomType);
router.put('/room-types/:id', authorize('admin'), updateRoomType);
router.delete('/room-types/:id', authorize('admin'), deleteRoomType);

module.exports = router;
