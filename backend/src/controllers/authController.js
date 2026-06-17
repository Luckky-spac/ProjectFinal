const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Customer, Employee } = require('../models');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /auth/register  (ເຊີນສະໝັກລູກຄ້າເທົ່ານັ້ນ)
const register = async (req, res) => {
  try {
    const { fname, lname, email, password, phone, gender, birthday } = req.body;
    if (!fname || !email || !password || !phone) {
      return res.status(400).json({ message: 'fname, email, password ແລະ phone ຈຳເປັນຕ້ອງກອກ' });
    }
    if (phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'ເບີໂທຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວເລກ (ຕົວຢ່າງ: 02012345678)' });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'ອີເມລນີ້ຖືກໃຊ້ງານແລ້ວ' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, role: 'member' });
    const customer = await Customer.create({
      u_id: user.u_id,
      fname,
      lname: lname || '',
      phone,
      gender: gender || null,
      birthday: birthday || null,
    });

    const token = signToken({ id: user.u_id, role: user.role });
    return res.status(201).json({
      token,
      user: { id: user.u_id, fname: customer.fname, lname: customer.lname, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// POST /auth/login  (login ດຽວ ໃຊ້ຮ່ວມກັນທຸກ role)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email ແລະ password ຈຳເປັນຕ້ອງກອກ' });
    }

    const user = await User.findOne({
      where: { email },
      include: [
        { model: Customer, as: 'customer' },
        { model: Employee, as: 'employee' },
      ],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'ອີເມລຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' });
    }

    if (['admin', 'staff'].includes(user.role)) {
      const emp = user.employee;
      if (!emp || emp.status !== 'active') {
        return res.status(403).json({ message: 'ບັນຊີນີ້ຖືກລະງັບການໃຊ້ງານ' });
      }
      const token = signToken({ id: user.u_id, role: user.role, employeeId: emp.emp_id });
      return res.json({
        token,
        user: { id: user.u_id, name: emp.name, email: user.email, role: user.role, employeeId: emp.emp_id },
      });
    }

    // member
    const token = signToken({ id: user.u_id, role: user.role });
    return res.json({
      token,
      user: {
        id: user.u_id,
        fname: user.customer?.fname,
        lname: user.customer?.lname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// POST /auth/employee/login  (backward compat — ກວດ role ດ້ວຍ)
const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email ແລະ password ຈຳເປັນຕ້ອງກອກ' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Employee, as: 'employee' }],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'ອີເມລຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' });
    }
    if (!['admin', 'staff'].includes(user.role)) {
      return res.status(403).json({ message: 'ບໍ່ມີສິດເຂົ້າໜ້ານີ້' });
    }
    const emp = user.employee;
    if (!emp || emp.status !== 'active') {
      return res.status(403).json({ message: 'ບັນຊີນີ້ຖືກລະງັບການໃຊ້ງານ' });
    }

    const token = signToken({ id: user.u_id, role: user.role, employeeId: emp.emp_id });
    return res.json({
      token,
      user: { id: user.u_id, name: emp.name, email: user.email, role: user.role, employeeId: emp.emp_id },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /auth/me
const me = async (req, res) => {
  try {
    if (['admin', 'staff'].includes(req.user.role)) {
      const emp = await Employee.findByPk(req.user.employeeId, {
        attributes: ['emp_id', 'name', 'phone', 'position', 'gender', 'birthday', 'status', 'hire_date'],
        include: [{ model: User, as: 'user', attributes: ['u_id', 'email', 'role'] }],
      });
      if (!emp) return res.status(404).json({ message: 'ບໍ່ພົບບັນຊີນີ້' });
      return res.json({
        id: emp.user.u_id,
        employeeId: emp.emp_id,
        email: emp.user.email,
        role: emp.user.role,
        name: emp.name,
        phone: emp.phone,
        position: emp.position,
        gender: emp.gender,
        birthday: emp.birthday,
        status: emp.status,
        hire_date: emp.hire_date,
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['u_id', 'email', 'role'],
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['fname', 'lname', 'phone', 'gender', 'birthday', 'address'],
      }],
    });
    if (!user) return res.status(404).json({ message: 'ບໍ່ພົບບັນຊີນີ້' });

    const { customer, ...userJson } = user.toJSON();
    return res.json({ ...userJson, ...(customer || {}) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PUT /auth/profile
const updateProfile = async (req, res) => {
  try {
    const { fname, lname, name, phone, gender, birthday, address, password, new_password } = req.body;

    if (['admin', 'staff'].includes(req.user.role)) {
      const emp = await Employee.findByPk(req.user.employeeId);
      if (!emp) return res.status(404).json({ message: 'ບໍ່ພົບບັນຊີນີ້' });
      const user = await User.findByPk(req.user.id);

      const empUpdates = {};
      const newName = fname || name;
      if (newName !== undefined) empUpdates.name = newName || emp.name;
      if (phone !== undefined) empUpdates.phone = phone;
      if (gender !== undefined) empUpdates.gender = gender || null;
      if (birthday !== undefined) empUpdates.birthday = birthday || null;
      if (Object.keys(empUpdates).length > 0) await emp.update(empUpdates);

      if (password && new_password) {
        if (!(await bcrypt.compare(password, user.password))) {
          return res.status(400).json({ message: 'ລະຫັດຜ່ານເດີມບໍ່ຖືກຕ້ອງ' });
        }
        await user.update({ password: await bcrypt.hash(new_password, 10) });
      }

      return res.json({
        id: user.u_id,
        employeeId: emp.emp_id,
        email: user.email,
        role: user.role,
        name: emp.name,
        phone: emp.phone,
        gender: emp.gender,
        birthday: emp.birthday,
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'ບໍ່ພົບບັນຊີນີ້' });

    if (password && new_password) {
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'ລະຫັດຜ່ານເດີມບໍ່ຖືກຕ້ອງ' });
      }
      await user.update({ password: await bcrypt.hash(new_password, 10) });
    }

    const customer = await Customer.findOne({ where: { u_id: user.u_id } });
    if (customer) {
      await customer.update({
        fname: fname !== undefined ? fname : customer.fname,
        lname: lname !== undefined ? lname : customer.lname,
        phone: phone !== undefined ? phone : customer.phone,
        gender: gender !== undefined ? gender : customer.gender,
        birthday: birthday !== undefined ? birthday : customer.birthday,
        address: address !== undefined ? address : customer.address,
      });
    }

    return res.json({
      id: user.u_id,
      email: user.email,
      fname: customer?.fname,
      lname: customer?.lname,
      phone: customer?.phone,
      gender: customer?.gender,
      birthday: customer?.birthday,
      address: customer?.address,
      role: user.role,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, employeeLogin, me, updateProfile };
