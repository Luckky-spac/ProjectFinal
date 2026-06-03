require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Employee, RoomType, Room, Booking, Payment, Review, RoomTransfer } = require('./models');

async function seed() {
  await sequelize.sync({ alter: true });
  console.log('DB synced');

  const hash = (pw) => bcrypt.hash(pw, 10);

  // ─── Cleanup ห้องและประเภทเก่า (K01-K06, ชื่อภาษาไทย) ──────────────────────
  const oldRooms = ['K01', 'K02', 'K03', 'K04', 'K05', 'K06'];
  for (const rn of oldRooms) {
    const old = await Room.findOne({ where: { room_number: rn } });
    if (old) {
      const bookings = await Booking.findAll({ where: { room_id: old.id } });
      for (const b of bookings) {
        await Review.destroy({ where: { booking_id: b.id } });
        await Payment.destroy({ where: { booking_id: b.id } });
        await RoomTransfer.destroy({ where: { booking_id: b.id } });
        await b.destroy();
      }
      await old.destroy();
    }
  }
  const oldTypes = ['ห้องเล็ก', 'ห้องกลาง', 'ห้องใหญ่'];
  for (const name of oldTypes) {
    await RoomType.destroy({ where: { name } });
  }

  // ─── Employees ────────────────────────────────────────────────────────────
  const [admin] = await Employee.findOrCreate({
    where: { email: 'admin@karaoke.com' },
    defaults: {
      name: 'ເຈົ້າຂອງຮ້ານ',
      email: 'admin@karaoke.com',
      password: await hash('admin1234'),
      phone: '0800000001',
      position: 'ເຈົ້າຂອງ',
      role: 'admin',
      status: 'active',
      hire_date: '2024-01-01',
    },
  });
  await admin.update({ name: 'ເຈົ້າຂອງຮ້ານ', phone: '0800000001', position: 'ເຈົ້າຂອງ', role: 'admin', status: 'active' });

  const [staff] = await Employee.findOrCreate({
    where: { email: 'staff@karaoke.com' },
    defaults: {
      name: 'ສົມສີ ພະນັກງານ',
      email: 'staff@karaoke.com',
      password: await hash('staff1234'),
      phone: '0800000002',
      position: 'ພະນັກງານຕ້ອນຮັບ',
      role: 'staff',
      status: 'active',
      hire_date: '2024-03-01',
    },
  });
  await staff.update({ name: 'ສົມສີ ພະນັກງານ', phone: '0800000002', position: 'ພະນັກງານຕ້ອນຮັບ', role: 'staff', status: 'active' });

  // ─── Users ────────────────────────────────────────────────────────────────
  const [member] = await User.findOrCreate({
    where: { email: 'member@karaoke.com' },
    defaults: {
      name: 'ສົມໄຊ ລູກຄ້າ',
      email: 'member@karaoke.com',
      password: await hash('member1234'),
      phone: '0800000003',
      role: 'member',
    },
  });
  await member.update({ name: 'ສົມໄຊ ລູກຄ້າ', phone: '0800000003' });

  const [member2] = await User.findOrCreate({
    where: { email: 'member2@karaoke.com' },
    defaults: {
      name: 'ສົມຍິງ ລູກຄ້າ',
      email: 'member2@karaoke.com',
      password: await hash('member1234'),
      phone: '0800000004',
      role: 'member',
    },
  });
  await member2.update({ name: 'ສົມຍິງ ລູກຄ້າ', phone: '0800000004' });

  console.log('Users & Employees seeded');

  // ─── Room Types (3 ประเภท ชื่อภาษาลาว) ──────────────────────────────────
  const [small] = await RoomType.findOrCreate({
    where: { name: 'ຫ້ອງນ້ອຍ' },
    defaults: {
      description: 'ເໝາະສຳລັບກຸ່ມນ້ອຍ 2–4 ຄົນ',
      capacity: 4,
      price_per_hour: 300,
      amenities: 'ໄມໂຄຣໂຟນ 2 ອັນ, ຈໍໂທລະທັດ 55", ລະບົບສຽງຄຸນນະພາບສູງ',
    },
  });
  await small.update({
    description: 'ເໝາະສຳລັບກຸ່ມນ້ອຍ 2–4 ຄົນ',
    capacity: 4,
    price_per_hour: 300,
    amenities: 'ໄມໂຄຣໂຟນ 2 ອັນ, ຈໍໂທລະທັດ 55", ລະບົບສຽງຄຸນນະພາບສູງ',
  });

  const [medium] = await RoomType.findOrCreate({
    where: { name: 'ຫ້ອງກາງ' },
    defaults: {
      description: 'ເໝາະສຳລັບກຸ່ມ 5–8 ຄົນ',
      capacity: 8,
      price_per_hour: 500,
      amenities: 'ໄມໂຄຣໂຟນ 4 ອັນ, ຈໍໂທລະທັດ 65", ລະບົບສຽງ Surround',
    },
  });
  await medium.update({
    description: 'ເໝາະສຳລັບກຸ່ມ 5–8 ຄົນ',
    capacity: 8,
    price_per_hour: 500,
    amenities: 'ໄມໂຄຣໂຟນ 4 ອັນ, ຈໍໂທລະທັດ 65", ລະບົບສຽງ Surround',
  });

  const [large] = await RoomType.findOrCreate({
    where: { name: 'ຫ້ອງໃຫຍ່' },
    defaults: {
      description: 'ເໝາະສຳລັບປາຕີ 9–15 ຄົນ',
      capacity: 15,
      price_per_hour: 800,
      amenities: 'ໄມໂຄຣໂຟນ 6 ອັນ, ຈໍໂທລະທັດ 75", ລະບົບສຽງ Premium, ໂຊຟາ VIP',
    },
  });
  await large.update({
    description: 'ເໝາະສຳລັບປາຕີ 9–15 ຄົນ',
    capacity: 15,
    price_per_hour: 800,
    amenities: 'ໄມໂຄຣໂຟນ 6 ອັນ, ຈໍໂທລະທັດ 75", ລະບົບສຽງ Premium, ໂຊຟາ VIP',
  });

  console.log('Room types seeded');

  // ─── Rooms (3 ห้อง) ───────────────────────────────────────────────────────
  const roomsData = [
    { room_number: 'S', room_type_id: small.id,  floor: 1 },
    { room_number: 'M', room_type_id: medium.id, floor: 1 },
    { room_number: 'L', room_type_id: large.id,  floor: 1 },
  ];
  const rooms = {};
  for (const r of roomsData) {
    const [room] = await Room.findOrCreate({ where: { room_number: r.room_number }, defaults: r });
    await room.update({ room_type_id: r.room_type_id, floor: r.floor });
    rooms[r.room_number] = room;
  }

  // Reset ห้องทั้งหมดเป็น available ก่อน (จะ set occupied ใหม่ด้านล่าง)
  await Room.update({ status: 'available' }, { where: {} });

  console.log('Rooms seeded');

  // ─── Demo Bookings ────────────────────────────────────────────────────────
  const now = new Date();
  const d = (offsetHours) => new Date(now.getTime() + offsetHours * 3600000);

  // Scenario 1: S → pending (จองแล้ว ยังไม่ส่ง slip มัดจำ)
  await Booking.findOrCreate({
    where: { user_id: member.id, room_id: rooms['S'].id, status: 'pending', deposit_slip: null },
    defaults: {
      start_time: d(24),
      end_time: d(26),
      guests: 3,
      total_price: 600,
      deposit_amount: 0,
      status: 'pending',
    },
  });

  // Scenario 2: M → confirmed (มัดจำยืนยันแล้ว รอ check-in)
  const [b2] = await Booking.findOrCreate({
    where: { user_id: member2.id, room_id: rooms['M'].id, status: 'confirmed' },
    defaults: {
      start_time: d(2),
      end_time: d(4),
      guests: 5,
      total_price: 1000,
      deposit_amount: 300,
      deposit_slip: '/uploads/demo_slip.jpg',
      status: 'confirmed',
      confirmed_by: admin.id,
    },
  });
  await Payment.findOrCreate({
    where: { booking_id: b2.id, type: 'deposit' },
    defaults: { booking_id: b2.id, amount: 300, type: 'deposit', method: 'transfer', slip_url: '/uploads/demo_slip.jpg', status: 'confirmed', confirmed_by: admin.id, confirmed_at: new Date() },
  });

  // Scenario 3: L → checked_in (กำลังใช้งาน)
  const [b3] = await Booking.findOrCreate({
    where: { user_id: member.id, room_id: rooms['L'].id, status: 'checked_in' },
    defaults: {
      start_time: d(-1),
      end_time: d(2),
      guests: 10,
      total_price: 2400,
      deposit_amount: 800,
      deposit_slip: '/uploads/demo_slip.jpg',
      status: 'checked_in',
      confirmed_by: staff.id,
      actual_check_in: d(-1),
    },
  });
  await Payment.findOrCreate({
    where: { booking_id: b3.id, type: 'deposit' },
    defaults: { booking_id: b3.id, amount: 800, type: 'deposit', method: 'transfer', slip_url: '/uploads/demo_slip.jpg', status: 'confirmed', confirmed_by: staff.id, confirmed_at: d(-2) },
  });
  await Room.update({ status: 'occupied' }, { where: { id: rooms['L'].id } });

  // Scenario 4: S → completed + review (อดีต, ใช้สำหรับสาธิตรีวิว)
  const [b4] = await Booking.findOrCreate({
    where: { user_id: member2.id, room_id: rooms['S'].id, status: 'completed' },
    defaults: {
      start_time: d(-50),
      end_time: d(-48),
      guests: 2,
      total_price: 600,
      deposit_amount: 200,
      deposit_slip: '/uploads/demo_slip.jpg',
      status: 'completed',
      confirmed_by: admin.id,
      actual_check_in: d(-50),
      actual_check_out: d(-48),
    },
  });
  await Payment.findOrCreate({
    where: { booking_id: b4.id, type: 'deposit' },
    defaults: { booking_id: b4.id, amount: 200, type: 'deposit', method: 'transfer', slip_url: '/uploads/demo_slip.jpg', status: 'confirmed', confirmed_by: admin.id, confirmed_at: d(-52) },
  });
  await Payment.findOrCreate({
    where: { booking_id: b4.id, type: 'final' },
    defaults: { booking_id: b4.id, amount: 400, type: 'final', method: 'transfer', slip_url: '/uploads/demo_slip.jpg', status: 'confirmed', confirmed_by: admin.id, confirmed_at: d(-48) },
  });
  await Review.findOrCreate({
    where: { booking_id: b4.id },
    defaults: { booking_id: b4.id, user_id: member2.id, room_id: rooms['S'].id, rating: 5, comment: 'ຫ້ອງສະອາດ ສຽງດີ ພະນັກງານບໍລິການດີຫຼາຍ ຈະມາອີກແນ່ນອນ!' },
  });

  console.log('Demo bookings seeded');
  console.log('\n✅ Seed ສຳເລັດ! ບັນຊີທົດສອບ:');
  console.log('─────────────────────────────────────────');
  console.log('  Admin  : admin@karaoke.com  / admin1234  (ເຈົ້າຂອງ)');
  console.log('  Staff  : staff@karaoke.com  / staff1234  (ພະນັກງານ)');
  console.log('  Member : member@karaoke.com / member1234 (ລູກຄ້າ 1)');
  console.log('  Member2: member2@karaoke.com/ member1234 (ລູກຄ້າ 2)');
  console.log('─────────────────────────────────────────');
  console.log('  ຫ້ອງທັງໝົດ 3 ຫ້ອງ:');
  console.log('  S (ຫ້ອງນ້ອຍ)  → pending   (ລໍຖ້າ slip ມັດຈຳ)');
  console.log('  M (ຫ້ອງກາງ)  → confirmed (ລໍ check-in)');
  console.log('  L (ຫ້ອງໃຫຍ່) → checked_in (ກຳລັງໃຊ້ງານ)');
  console.log('  S (ຫ້ອງນ້ອຍ)  → completed + review (ອະດີດ, member2)');

  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seed ລົ້ມເຫຼວ:', err.message);
  process.exit(1);
});
