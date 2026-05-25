require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Employee, RoomType, Room } = require('./models');

async function seed() {
  await sequelize.sync({ alter: true });
  console.log('DB synced');

  const hash = (pw) => bcrypt.hash(pw, 10);

  // --- Employees (พนักงาน/เจ้าของ) ---
  const [admin] = await Employee.findOrCreate({
    where: { email: 'admin@karaoke.com' },
    defaults: {
      name: 'เจ้าของร้าน',
      email: 'admin@karaoke.com',
      password: await hash('admin1234'),
      phone: '0800000001',
      position: 'เจ้าของ',
      role: 'admin',
      status: 'active',
      hire_date: '2024-01-01',
    },
  });
  await admin.update({ role: 'admin', status: 'active' });

  const [staff] = await Employee.findOrCreate({
    where: { email: 'staff@karaoke.com' },
    defaults: {
      name: 'สมศรี พนักงาน',
      email: 'staff@karaoke.com',
      password: await hash('staff1234'),
      phone: '0800000002',
      position: 'พนักงานต้อนรับ',
      role: 'staff',
      status: 'active',
      hire_date: '2024-03-01',
    },
  });
  await staff.update({ role: 'staff', status: 'active' });

  // --- Users (ลูกค้า) ---
  const [member] = await User.findOrCreate({
    where: { email: 'member@karaoke.com' },
    defaults: {
      name: 'สมชาย ลูกค้า',
      email: 'member@karaoke.com',
      password: await hash('member1234'),
      phone: '0800000003',
      role: 'member',
    },
  });

  console.log('Users & Employees seeded');

  // --- Room Types ---
  const [small] = await RoomType.findOrCreate({
    where: { name: 'ห้องเล็ก' },
    defaults: {
      description: 'เหมาะสำหรับกลุ่มเล็ก 2–4 คน',
      capacity: 4,
      price_per_hour: 300,
      amenities: 'ไมโครโฟน 2 ตัว, จอทีวี 55", ระบบเสียงคุณภาพสูง',
    },
  });

  const [medium] = await RoomType.findOrCreate({
    where: { name: 'ห้องกลาง' },
    defaults: {
      description: 'เหมาะสำหรับกลุ่ม 5–8 คน',
      capacity: 8,
      price_per_hour: 500,
      amenities: 'ไมโครโฟน 4 ตัว, จอทีวี 65", ระบบเสียง Surround',
    },
  });

  const [large] = await RoomType.findOrCreate({
    where: { name: 'ห้องใหญ่' },
    defaults: {
      description: 'เหมาะสำหรับปาร์ตี้ 9–15 คน',
      capacity: 15,
      price_per_hour: 800,
      amenities: 'ไมโครโฟน 6 ตัว, จอทีวี 75", ระบบเสียง Premium, โซฟา VIP',
    },
  });

  console.log('Room types seeded');

  // --- Rooms ---
  const roomsData = [
    { room_number: 'K01', room_type_id: small.id, floor: 1 },
    { room_number: 'K02', room_type_id: small.id, floor: 1 },
    { room_number: 'K03', room_type_id: medium.id, floor: 1 },
    { room_number: 'K04', room_type_id: medium.id, floor: 2 },
    { room_number: 'K05', room_type_id: large.id, floor: 2 },
    { room_number: 'K06', room_type_id: large.id, floor: 2 },
  ];
  for (const r of roomsData) {
    await Room.findOrCreate({ where: { room_number: r.room_number }, defaults: r });
  }

  console.log('Rooms seeded');
  console.log('\n✅ Seed สำเร็จ! บัญชีทดสอบ:');
  console.log('  Admin  → admin@karaoke.com  / admin1234  (พนักงาน login)');
  console.log('  Staff  → staff@karaoke.com  / staff1234  (พนักงาน login)');
  console.log('  Member → member@karaoke.com / member1234 (ลูกค้า login)');

  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seed ล้มเหลว:', err.message);
  process.exit(1);
});
