const bcrypt = require('bcryptjs');
const { User, Customer, Employee, Village, District, Province, RoomType } = require('../models');

const empFullInclude = [
  { model: User, as: 'user', attributes: ['u_id', 'email', 'role'] },
  {
    model: Village, as: 'village', required: false,
    include: [{ model: District, as: 'district', include: [{ model: Province, as: 'province' }] }],
  },
];

// ─── USERS ───────────────────────────────────────────────────────────────────

const userWithCustomer = {
  attributes: { exclude: ['password'] },
  include: [{ model: Customer, as: 'customer', attributes: ['fname', 'lname', 'phone', 'gender', 'birthday'] }],
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ ...userWithCustomer, order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, userWithCustomer);
    if (!user) return res.status(404).json({ message: 'ບໍ່ພົບຜູ້ໃຊ້ນີ້' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'ບໍ່ພົບຜູ້ໃຊ້ນີ້' });
    const { fname, lname, phone, password } = req.body;
    if (password) await user.update({ password: await bcrypt.hash(password, 10) });
    const customer = await Customer.findOne({ where: { u_id: user.u_id } });
    if (customer) {
      const custUpdates = {};
      if (fname) custUpdates.fname = fname;
      if (lname !== undefined) custUpdates.lname = lname;
      if (phone !== undefined) custUpdates.phone = phone;
      if (Object.keys(custUpdates).length > 0) await customer.update(custUpdates);
    }
    res.json({
      id: user.u_id,
      email: user.email,
      role: user.role,
      customer: customer ? { fname: customer.fname, lname: customer.lname, phone: customer.phone } : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'ບໍ່ພົບຜູ້ໃຊ້ນີ້' });
    await user.destroy();
    res.json({ message: 'ລົບຜູ້ໃຊ້ສຳເລັດ' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { fname, lname, email, password, phone, gender, birthday } = req.body;
    if (!fname || !email || !password || !phone) {
      return res.status(400).json({ message: 'fname, email, password ແລະ phone ຈຳເປັນຕ້ອງກອກ' });
    }
    if (phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'ເບີໂທຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວເລກ' });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'ອີເມລນີ້ຖືກໃຊ້ງານແລ້ວ' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, role: 'member' });
    await Customer.create({
      u_id: user.u_id,
      fname,
      lname: lname || '',
      phone,
      gender: gender || null,
      birthday: birthday || null,
    });

    res.status(201).json({ message: 'ເພີ່ມສະມາຊິກສຳເລັດ', u_id: user.u_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: empFullInclude,
      order: [['createdAt', 'DESC']],
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id, { include: empFullInclude });
    if (!emp) return res.status(404).json({ message: 'ບໍ່ພົບພະນັກງານນີ້' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function resolveVillageId(village_name, district_id) {
  if (!village_name || !district_id) return null;
  const [village] = await Village.findOrCreate({
    where: { name: village_name.trim(), d_id: district_id },
    defaults: { name: village_name.trim(), d_id: district_id },
  });
  return village.v_id;
}

const createEmployee = async (req, res) => {
  try {
    const { fname, lname, email, password, phone, gender, birthday, position, role, status, hire_date, village_name, district_id } = req.body;
    if (!fname || !email || !password || !position) {
      return res.status(400).json({ message: 'ຊື່, ອີເມລ, ລະຫັດຜ່ານ ແລະ ຕຳແໜ່ງ ຈຳເປັນຕ້ອງກອກ' });
    }
    if (phone && phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'ເບີໂທຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວເລກ' });
    }
    const empRole = role && ['admin', 'staff'].includes(role) ? role : 'staff';

    const existsUser = await User.findOne({ where: { email } });
    if (existsUser) return res.status(409).json({ message: 'ອີເມລນີ້ຖືກໃຊ້ງານແລ້ວ' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, role: empRole });

    const v_id = await resolveVillageId(village_name, district_id);

    const emp = await Employee.create({
      u_id: user.u_id,
      fname,
      lname: lname || null,
      phone,
      gender: gender || null,
      birthday: birthday || null,
      position,
      status: status || 'active',
      hire_date: hire_date || null,
      v_id,
    });

    const full = await Employee.findByPk(emp.emp_id, { include: empFullInclude });
    res.status(201).json(full);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'ອີເມລນີ້ຖືກໃຊ້ງານແລ້ວ' });
    }
    res.status(500).json({ message: err.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ message: 'ບໍ່ພົບພະນັກງານນີ້' });
    const user = await User.findByPk(emp.u_id);

    const { fname, lname, email, phone, gender, birthday, position, role, status, hire_date, password, village_name, district_id } = req.body;

    const userUpdates = {};
    if (email) userUpdates.email = email;
    if (role && ['admin', 'staff'].includes(role)) userUpdates.role = role;
    if (password) userUpdates.password = await bcrypt.hash(password, 10);
    if (Object.keys(userUpdates).length > 0) await user.update(userUpdates);

    const empUpdates = {};
    if (fname) empUpdates.fname = fname;
    if (lname !== undefined) empUpdates.lname = lname || null;
    if (phone !== undefined) empUpdates.phone = phone;
    if (gender !== undefined) empUpdates.gender = gender || null;
    if (birthday !== undefined) empUpdates.birthday = birthday || null;
    if (position) empUpdates.position = position;
    if (status) empUpdates.status = status;
    if (hire_date !== undefined) empUpdates.hire_date = hire_date;
    if (village_name !== undefined) {
      empUpdates.v_id = await resolveVillageId(village_name, district_id || emp.v_id && (await Village.findByPk(emp.v_id))?.d_id);
    }
    if (Object.keys(empUpdates).length > 0) await emp.update(empUpdates);

    const full = await Employee.findByPk(emp.emp_id, { include: empFullInclude });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ message: 'ບໍ່ພົບພະນັກງານນີ້' });
    const user = await User.findByPk(emp.u_id);
    if (user) {
      await user.destroy();
    } else {
      await emp.destroy();
    }
    res.json({ message: 'ລົບພະນັກງານສຳເລັດ' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── ROOM TYPES (CRUD) ────────────────────────────────────────────────────────

const createRoomType = async (req, res) => {
  try {
    const { name, description, capacity, price_per_hour } = req.body;
    if (!name || !price_per_hour) {
      return res.status(400).json({ message: 'name ແລະ price_per_hour ຈຳເປັນຕ້ອງກອກ' });
    }
    const rt = await RoomType.create({ name, description, capacity, price_per_hour });
    res.status(201).json(rt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRoomType = async (req, res) => {
  try {
    const rt = await RoomType.findByPk(req.params.id);
    if (!rt) return res.status(404).json({ message: 'ບໍ່ພົບປະເພດຫ້ອງນີ້' });
    const { name, description, capacity, price_per_hour } = req.body;
    await rt.update({ name, description, capacity, price_per_hour });
    res.json(rt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRoomType = async (req, res) => {
  try {
    const rt = await RoomType.findByPk(req.params.id);
    if (!rt) return res.status(404).json({ message: 'ບໍ່ພົບປະເພດຫ້ອງນີ້' });
    await rt.destroy();
    res.json({ message: 'ລົບປະເພດຫ້ອງສຳເລັດ' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getUsers, getUserById, createUser, updateUser, deleteUser,
  getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
  createRoomType, updateRoomType, deleteRoomType,
};
