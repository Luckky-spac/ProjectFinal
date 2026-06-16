const bcrypt = require('bcryptjs');
const { User, Customer, Employee, Address, Village, District, Province } = require('../models');

const empAddressInclude = [{
  model: Address, as: 'address', required: false,
  include: [
    { model: Village, as: 'village' },
    { model: District, as: 'district' },
    { model: Province, as: 'province' },
  ],
}];

// ─── USERS ───────────────────────────────────────────────────────────────────

const userWithCustomer = { attributes: { exclude: ['password'] }, include: [{ model: Customer, as: 'customer', attributes: ['name', 'phone'] }] };

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ ...userWithCustomer, order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, userWithCustomer);
    if (!user) return res.status(404).json({ message: 'ບໍ່ພົບຜູ້ໃຊ້ນີ້' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'ບໍ່ພົບຜູ້ໃຊ້ນີ້' });
    const { name, phone, password } = req.body;
    if (password) await user.update({ password: await bcrypt.hash(password, 10) });
    const customer = await Customer.findOne({ where: { user_id: user.id } });
    if (customer) {
      const custUpdates = {};
      if (name) custUpdates.name = name;
      if (phone !== undefined) custUpdates.phone = phone;
      if (Object.keys(custUpdates).length > 0) await customer.update(custUpdates);
    }
    res.json({ id: user.id, email: user.email, role: user.role, customer: customer ? { name: customer.name, phone: customer.phone } : null });
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

async function saveAddress(emp, { province_id, district_id, village_id, address_detail }) {
  if (!province_id || !district_id || !village_id) return null;
  if (emp.address_id) {
    await Address.update(
      { province_id, district_id, village_id, detail: address_detail || null },
      { where: { id: emp.address_id } }
    );
    return emp.address_id;
  }
  const addr = await Address.create({ province_id, district_id, village_id, detail: address_detail || null });
  return addr.id;
}

// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      attributes: { exclude: ['password'] },
      include: empAddressInclude,
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
    const emp = await Employee.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: empAddressInclude,
    });
    if (!emp) return res.status(404).json({ message: 'ບໍ່ພົບພະນັກງານນີ້' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, gender, birthday, position, role, status, hire_date, province_id, district_id, village_id, address_detail } = req.body;
    if (!name || !email || !password || !position) {
      return res.status(400).json({ message: 'ຊື່, ອີເມລ, ລະຫັດຜ່ານ ແລະ ຕຳແໜ່ງ ຈຳເປັນຕ້ອງກອກ' });
    }
    if (phone && phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'ເບີໂທຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວເລກ' });
    }
    const exists = await Employee.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'ອີເມລນີ້ຖືກໃຊ້ງານແລ້ວ' });
    const hashed = await bcrypt.hash(password, 10);
    const emp = await Employee.create({ name, email, password: hashed, phone, gender: gender || null, birthday: birthday || null, position, role: role || 'staff', status: status || 'active', hire_date });
    const address_id = await saveAddress(emp, { province_id, district_id, village_id, address_detail });
    if (address_id) await emp.update({ address_id });
    const full = await Employee.findByPk(emp.id, { attributes: { exclude: ['password'] }, include: empAddressInclude });
    res.status(201).json(full);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'ອີເມລນີ້ຖືກໃຊ້ງານແລ້ວ' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ message: 'ບໍ່ພົບພະນັກງານນີ້' });
    const { name, phone, gender, birthday, position, role, status, hire_date, password, province_id, district_id, village_id, address_detail } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (gender !== undefined) updates.gender = gender || null;
    if (birthday !== undefined) updates.birthday = birthday || null;
    if (position) updates.position = position;
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (hire_date !== undefined) updates.hire_date = hire_date;
    if (password) updates.password = await bcrypt.hash(password, 10);
    const address_id = await saveAddress(emp, { province_id, district_id, village_id, address_detail });
    if (address_id) updates.address_id = address_id;
    await emp.update(updates);
    const full = await Employee.findByPk(emp.id, { attributes: { exclude: ['password'] }, include: empAddressInclude });
    res.json(full);
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
