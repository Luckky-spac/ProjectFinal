const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Employee } = require('../models');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email และ password จำเป็นต้องกรอก' });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone, role: 'member' });
    const token = signToken({ id: user.id, role: user.role, type: 'user' });
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, type: 'user' },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// POST /auth/login  (ลูกค้า + พนักงาน — ตรวจอัตโนมัติจาก email)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email และ password จำเป็นต้องกรอก' });
    }

    // ตรวจ employees ก่อน
    const emp = await Employee.findOne({ where: { email } });
    if (emp) {
      if (!(await bcrypt.compare(password, emp.password))) {
        return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }
      if (emp.status !== 'active') {
        return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน' });
      }
      const token = signToken({ id: emp.id, role: emp.role, type: 'employee' });
      return res.json({
        token,
        user: { id: emp.id, name: emp.name, email: emp.email, role: emp.role, type: 'employee' },
      });
    }

    // ตรวจ users
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    const token = signToken({ id: user.id, role: user.role, type: 'user' });
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, type: 'user' },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// POST /auth/employee/login  (เก็บไว้สำหรับ API — ไม่ได้ใช้จาก frontend)
const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email และ password จำเป็นต้องกรอก' });
    }
    const emp = await Employee.findOne({ where: { email } });
    if (!emp || !(await bcrypt.compare(password, emp.password))) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    if (emp.status !== 'active') {
      return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน' });
    }
    const token = signToken({ id: emp.id, role: emp.role, type: 'employee' });
    return res.json({
      token,
      user: { id: emp.id, name: emp.name, email: emp.email, role: emp.role, type: 'employee' },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /auth/me
const me = async (req, res) => {
  try {
    if (req.user.type === 'employee') {
      const emp = await Employee.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'role', 'phone', 'position'],
      });
      if (!emp) return res.status(404).json({ message: 'ไม่พบบัญชีนี้' });
      return res.json({ ...emp.toJSON(), type: 'employee' });
    }
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'phone'],
    });
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีนี้' });
    return res.json({ ...user.toJSON(), type: 'user' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, employeeLogin, me };
