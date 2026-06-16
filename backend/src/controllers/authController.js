const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Customer, Employee } = require('../models');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /auth/register  [ขั้น 6]
const register = async (req, res) => {
  try {
    const { name, email, password, phone, gender, birthday } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'name, email, password ແລະ phone ຈຳເປັນຕ້ອງກອກ' });
    }
    if (phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'ເບີໂທຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວເລກ (ຕົວຢ່າງ: 02012345678)' });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'ອີເມລນີ້ຖືກໃຊ້ງານແລ້ວ' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, role: 'member' });
    const customer = await Customer.create({
      user_id: user.id,
      name,
      phone,
      gender: gender || null,
      birthday: birthday || null,
    });

    const token = signToken({ id: user.id, role: user.role, type: 'user' });
    return res.status(201).json({
      token,
      user: { id: user.id, name: customer.name, email: user.email, role: user.role, type: 'user' },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// POST /auth/login  [ขั้น 8]
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email ແລະ password ຈຳເປັນຕ້ອງກອກ' });
    }

    // ตรวจ employees ก่อน
    const emp = await Employee.findOne({ where: { email } });
    if (emp) {
      if (!(await bcrypt.compare(password, emp.password))) {
        return res.status(401).json({ message: 'ອີເມລຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' });
      }
      if (emp.status !== 'active') {
        return res.status(403).json({ message: 'ບັນຊີນີ້ຖືກລະງັບການໃຊ້ງານ' });
      }
      const token = signToken({ id: emp.id, role: emp.role, type: 'employee' });
      return res.json({
        token,
        user: { id: emp.id, name: emp.name, email: emp.email, role: emp.role, type: 'employee' },
      });
    }

    // ตรวจ users + JOIN customer เพื่อดึง name  [ขั้น 9]
    const user = await User.findOne({
      where: { email },
      include: [{ model: Customer, as: 'customer' }],
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'ອີເມລຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' });
    }
    const token = signToken({ id: user.id, role: user.role, type: 'user' });
    return res.json({
      token,
      user: { id: user.id, name: user.customer?.name, email: user.email, role: user.role, type: 'user' },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// POST /auth/employee/login  [ขั้น 10 — ไม่ต้องแก้]
const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email ແລະ password ຈຳເປັນຕ້ອງກອກ' });
    }
    const emp = await Employee.findOne({ where: { email } });
    if (!emp || !(await bcrypt.compare(password, emp.password))) {
      return res.status(401).json({ message: 'ອີເມລຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' });
    }
    if (emp.status !== 'active') {
      return res.status(403).json({ message: 'ບັນຊີນີ້ຖືກລະງັບການໃຊ້ງານ' });
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

// GET /auth/me  [ขั้น 11]
const me = async (req, res) => {
  try {
    if (req.user.type === 'employee') {
      const emp = await Employee.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'role', 'phone', 'position', 'gender', 'birthday'],
      });
      if (!emp) return res.status(404).json({ message: 'ບໍ່ພົບບັນຊີນີ້' });
      return res.json({ ...emp.toJSON(), type: 'employee' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role'],
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['name', 'phone', 'gender', 'birthday', 'address', 'avatar_url'],
      }],
    });
    if (!user) return res.status(404).json({ message: 'ບໍ່ພົບບັນຊີນີ້' });

    const { customer, ...userJson } = user.toJSON();
    return res.json({ ...userJson, ...(customer || {}), type: 'user' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PUT /auth/profile  [ขั้น 12]
const updateProfile = async (req, res) => {
  try {
    const { name, phone, gender, birthday, address, password, new_password } = req.body;

    if (req.user.type === 'employee') {
      const emp = await Employee.findByPk(req.user.id);
      if (!emp) return res.status(404).json({ message: 'ບໍ່ພົບບັນຊີນີ້' });
      const updates = {};
      if (name !== undefined) updates.name = name || emp.name;
      if (phone !== undefined) updates.phone = phone;
      if (gender !== undefined) updates.gender = gender || null;
      if (birthday !== undefined) updates.birthday = birthday || null;
      if (password && new_password) {
        if (!(await bcrypt.compare(password, emp.password))) {
          return res.status(400).json({ message: 'ລະຫັດຜ່ານເດີມບໍ່ຖືກຕ້ອງ' });
        }
        updates.password = await bcrypt.hash(new_password, 10);
      }
      await emp.update(updates);
      return res.json({ id: emp.id, name: emp.name, email: emp.email, phone: emp.phone, gender: emp.gender, birthday: emp.birthday, role: emp.role, type: 'employee' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'ບໍ່ພົບບັນຊີນີ້' });

    if (password && new_password) {
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'ລະຫັດຜ່ານເດີມບໍ່ຖືກຕ້ອງ' });
      }
      await user.update({ password: await bcrypt.hash(new_password, 10) });
    }

    const customer = await Customer.findOne({ where: { user_id: user.id } });
    if (customer) {
      await customer.update({
        name: name !== undefined ? name : customer.name,
        phone: phone !== undefined ? phone : customer.phone,
        gender: gender !== undefined ? gender : customer.gender,
        birthday: birthday !== undefined ? birthday : customer.birthday,
        address: address !== undefined ? address : customer.address,
      });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: customer?.name,
      phone: customer?.phone,
      gender: customer?.gender,
      birthday: customer?.birthday,
      address: customer?.address,
      role: user.role,
      type: 'user',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, employeeLogin, me, updateProfile };
