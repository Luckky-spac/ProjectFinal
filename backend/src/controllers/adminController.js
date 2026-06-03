const bcrypt = require('bcryptjs');
const { User, Employee } = require('../models');

// ─── USERS ───────────────────────────────────────────────────────────────────

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });
    const { name, phone, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (password) updates.password = await bcrypt.hash(password, 10);
    await user.update(updates);
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });
    await user.destroy();
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────

// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/employees/:id
const getEmployeeById = async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!emp) return res.status(404).json({ message: 'ไม่พบพนักงานนี้' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, position, role, status, hire_date } = req.body;
    if (!name || !email || !password || !position) {
      return res.status(400).json({ message: 'name, email, password และ position จำเป็นต้องกรอก' });
    }
    const exists = await Employee.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    const hashed = await bcrypt.hash(password, 10);
    const emp = await Employee.create({ name, email, password: hashed, phone, position, role: role || 'staff', status: status || 'active', hire_date });
    const { password: _, ...safe } = emp.toJSON();
    res.status(201).json(safe);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ message: 'ไม่พบพนักงานนี้' });
    const { name, phone, position, role, status, hire_date, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (position) updates.position = position;
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (hire_date !== undefined) updates.hire_date = hire_date;
    if (password) updates.password = await bcrypt.hash(password, 10);
    await emp.update(updates);
    const { password: _, ...safe } = emp.toJSON();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ message: 'ไม่พบพนักงานนี้' });
    await emp.destroy();
    res.json({ message: 'ลบพนักงานสำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── ROOM TYPES (CRUD) ────────────────────────────────────────────────────────
const { RoomType } = require('../models');

// POST /api/room-types
const createRoomType = async (req, res) => {
  try {
    const { name, description, capacity, price_per_hour } = req.body;
    if (!name || !price_per_hour) {
      return res.status(400).json({ message: 'name และ price_per_hour จำเป็นต้องกรอก' });
    }
    const rt = await RoomType.create({ name, description, capacity, price_per_hour });
    res.status(201).json(rt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/room-types/:id
const updateRoomType = async (req, res) => {
  try {
    const rt = await RoomType.findByPk(req.params.id);
    if (!rt) return res.status(404).json({ message: 'ไม่พบประเภทห้องนี้' });
    const { name, description, capacity, price_per_hour } = req.body;
    await rt.update({ name, description, capacity, price_per_hour });
    res.json(rt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/room-types/:id
const deleteRoomType = async (req, res) => {
  try {
    const rt = await RoomType.findByPk(req.params.id);
    if (!rt) return res.status(404).json({ message: 'ไม่พบประเภทห้องนี้' });
    await rt.destroy();
    res.json({ message: 'ลบประเภทห้องสำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getUsers, getUserById, updateUser, deleteUser,
  getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
  createRoomType, updateRoomType, deleteRoomType,
};
