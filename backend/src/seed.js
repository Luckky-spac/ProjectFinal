require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Customer, Employee, Province, District, Village, RoomType, Room, Booking, Payment, Review } = require('./models');

async function seed() {
  await sequelize.sync({ force: true });
  console.log('DB synced (force)');

  const hash = (pw) => bcrypt.hash(pw, 10);

  // ─── Provinces ────────────────────────────────────────────────────────────
  const provincesData = [
    { p_id: 1, name: 'ນະຄອນຫຼວງວຽງຈັນ' },
    { p_id: 2, name: 'ແຂວງວຽງຈັນ' },
    { p_id: 3, name: 'ແຂວງຫຼວງພະບາງ' },
    { p_id: 4, name: 'ແຂວງສະຫວັນນະເຂດ' },
    { p_id: 5, name: 'ແຂວງຈຳປາສັກ' },
  ];
  for (const p of provincesData) {
    await Province.create({ p_id: p.p_id, name: p.name });
  }
  console.log('Provinces seeded');

  // ─── Districts ────────────────────────────────────────────────────────────
  const districtsData = [
    { d_id: 1,  name: 'ຈັນທະບູລີ',    p_id: 1 },
    { d_id: 2,  name: 'ສີໂຄດຕະບອງ',  p_id: 1 },
    { d_id: 3,  name: 'ໄຊເສດຖາ',      p_id: 1 },
    { d_id: 4,  name: 'ສີສັດຕະນາກ',   p_id: 1 },
    { d_id: 5,  name: 'ທ່ານາແລງ',     p_id: 2 },
    { d_id: 6,  name: 'ວັງວຽງ',        p_id: 2 },
    { d_id: 7,  name: 'ຫຼວງພະບາງ',    p_id: 3 },
    { d_id: 8,  name: 'ຊຽງງາ',         p_id: 3 },
    { d_id: 9,  name: 'ໄຊບູລີ',       p_id: 4 },
    { d_id: 10, name: 'ຄັນທະບູລີ',    p_id: 4 },
    { d_id: 11, name: 'ປາກເຊ',         p_id: 5 },
    { d_id: 12, name: 'ໂຂງ',           p_id: 5 },
  ];
  for (const d of districtsData) {
    await District.create({ d_id: d.d_id, name: d.name, p_id: d.p_id });
  }
  console.log('Districts seeded');

  // ─── Villages ─────────────────────────────────────────────────────────────
  const villagesData = [
    { v_id: 1,  name: 'ບ້ານໂນນສະຫວ່າງ',  d_id: 1 },
    { v_id: 2,  name: 'ບ້ານທ່າດ່ານ',       d_id: 1 },
    { v_id: 3,  name: 'ບ້ານທາດຫຼວງ',      d_id: 2 },
    { v_id: 4,  name: 'ບ້ານໂພນສີ',         d_id: 2 },
    { v_id: 5,  name: 'ບ້ານດອນກອຍ',       d_id: 3 },
    { v_id: 6,  name: 'ບ້ານໂດນໜູນ',       d_id: 3 },
    { v_id: 7,  name: 'ບ້ານໂນນສົມບູນ',    d_id: 4 },
    { v_id: 8,  name: 'ບ້ານທ່ານາ',         d_id: 4 },
    { v_id: 9,  name: 'ບ້ານຫ້ວຍຊາຍ',      d_id: 5 },
    { v_id: 10, name: 'ບ້ານນາຄຳ',          d_id: 5 },
    { v_id: 11, name: 'ບ້ານວຽງຄຳ',        d_id: 6 },
    { v_id: 12, name: 'ບ້ານວັດໄຊ',         d_id: 7 },
    { v_id: 13, name: 'ບ້ານທ່າໄຊ',         d_id: 7 },
    { v_id: 14, name: 'ບ້ານຫ້ວຍຈຳ',        d_id: 11 },
    { v_id: 15, name: 'ບ້ານໂນນຄຳ',         d_id: 11 },
  ];
  for (const v of villagesData) {
    await Village.create({ v_id: v.v_id, name: v.name, d_id: v.d_id });
  }
  console.log('Villages seeded');

  // ─── Users (admin/staff) + Employees ─────────────────────────────────────
  const adminUser = await User.create({
    email: 'admin@karaoke.com',
    password: await hash('admin1234'),
    role: 'admin',
  });
  await Employee.create({
    u_id: adminUser.u_id,
    fname: 'ເຈົ້າຂອງ',
    lname: 'ຮ້ານ',
    phone: '0800000001',
    position: 'ເຈົ້າຂອງ',
    status: 'active',
    hire_date: '2024-01-01',
    v_id: 1,
  });

  const staffUser = await User.create({
    email: 'staff@karaoke.com',
    password: await hash('staff1234'),
    role: 'staff',
  });
  await Employee.create({
    u_id: staffUser.u_id,
    fname: 'ສົມສີ',
    lname: 'ພະນັກງານ',
    phone: '0800000002',
    position: 'ພະນັກງານຕ້ອນຮັບ',
    status: 'active',
    hire_date: '2024-03-01',
    v_id: 3,
  });

  // ─── Users (member) + Customers ───────────────────────────────────────────
  const memberUser = await User.create({
    email: 'member@karaoke.com',
    password: await hash('member1234'),
    role: 'member',
  });
  await Customer.create({ u_id: memberUser.u_id, fname: 'ສົມໄຊ', lname: 'ລູກຄ້າ', phone: '0800000003' });

  const memberUser2 = await User.create({
    email: 'member2@karaoke.com',
    password: await hash('member1234'),
    role: 'member',
  });
  await Customer.create({ u_id: memberUser2.u_id, fname: 'ສົມຍິງ', lname: 'ລູກຄ້າ', phone: '0800000004' });

  console.log('Users & Employees & Customers seeded');

  // ─── Room Types ───────────────────────────────────────────────────────────
  const small = await RoomType.create({
    name: 'ຫ້ອງນ້ອຍ',
    description: 'ເບຍລາວ 330ml 24ແກ້ວ ຫຼື ເບຍ Heineken 12 ແກ້ວ, ໂຄກ ຫຼື ແປບຊີ 12 ກະປ໋ອງ, ໝາກໄມ້ລວມ 2 ຈານ ແລະ ຂອງກິນວ່າງ 4 ຢ່າງ/ຊະນິດ. ທຸກຫ້ອງຮ້ອງເພງຈະມີນ້ຳດື່ມ 12ຕຸກໃຫ້ຟຣີ. ບັນຈຸໄດ້ 10-15ທ່ານ. ຖ້າຈອງ 4ຊົ່ວໂມງ ຈະໄດ້ ທຸກຢ່າງທີ່ໄດ້ກ່າວມາຂ້າງຕົ້ນ.',
    capacity: 15,
    price_per_hour: 42,
    amenities: 'ໄມໂຄຣໂຟນ 2 ອັນ, ຈໍໂທລະທັດ 55", ລະບົບສຽງຄຸນນະພາບສູງ',
  });
  const medium = await RoomType.create({
    name: 'ຫ້ອງກາງ',
    description: 'ໄດ້ຮັບ ເຫຼົ້າ Chivas 18 ຫຼື ເຫຼົ້າແວງແດງ Merlot 4 ແກ້ວ, ເບຍລາວ 330ml 24ແກ້ວ ຫຼື ເບຍ Heineken 12 ແກ້ວ, ໂຄກ ຫຼື ແປບຊີ 12 ກະປ໋ອງ, ໝາກໄມ້ລວມ 2 ຈານ ແລະ ຂອງກິນວ່າງ 4 ຢ່າງ/ຊະນິດ. ທຸກຫ້ອງຮ້ອງເພງຈະມີນ້ຳດື່ມ 12ຕຸກໃຫ້ຟຣີ. ບັນຈຸໄດ້ 15-20ທ່ານ. ຖ້າຈອງ 4ຊົ່ວໂມງ ຈະໄດ້ ທຸກຢ່າງທີ່ໄດ້ກ່າວມາຂ້າງຕົ້ນ.',
    capacity: 20,
    price_per_hour: 147,
    amenities: 'ໄມໂຄຣໂຟນ 4 ອັນ, ຈໍໂທລະທັດ 65", ລະບົບສຽງ Surround',
  });
  const large = await RoomType.create({
    name: 'ຫ້ອງໃຫຍ່',
    description: 'ໄດ້ຮັບ ແຊມເປນ Moet 1 ແກ້ວ ຫຼື ເຫຼົ້າ VSOP Remy Martin 1 ແກ້ວ, ເຫຼົ້າ Johnnie Walker 1 ແກ້ວ ຫຼື ເຫຼົ້າ Chivas Regal 21 ຈຳນວນ 1 ແກ້ວ, ເບຍ 1664 ແບບເຢັ້ນສົດ 2 ຈັກ(30ແກ້ວ), ນ້ຳໂຊດາ 12 ແກ້ວ(320ml), ລວມມິດໝາກໄມ້ 2 ຊຸດ ແລະ ຂອງຫວານ 4 ຢ່າງ ເວລາຮ້ອງເພງ 4 ຊົ່ວໂມງ ຈຳກັດຂັ້ນຕ່ຳ. ທຸກຫ້ອງຮ້ອງເພງຈະມີນ້ຳດື່ມ 12ຕຸກໃຫ້ຟຣີ. ບັນຈຸໄດ້ 30-35ທ່ານ. ຖ້າຈອງ 4ຊົ່ວໂມງ ຈະໄດ້ ທຸກຢ່າງທີ່ໄດ້ກ່າວມາຂ້າງຕົ້ນ.',
    capacity: 35,
    price_per_hour: 166,
    amenities: 'ໄມໂຄຣໂຟນ 6 ອັນ, ຈໍໂທລະທັດ 75", ລະບົບສຽງ Premium, ໂຊຟາ VIP',
  });
  console.log('Room types seeded');

  // ─── Rooms ────────────────────────────────────────────────────────────────
  const rooms = {};
  rooms['S'] = await Room.create({ room_number: 'S', rtype_id: small.rtype_id,  floor: 36, status: 'available' });
  rooms['M'] = await Room.create({ room_number: 'M', rtype_id: medium.rtype_id, floor: 36, status: 'available' });
  rooms['L'] = await Room.create({ room_number: 'L', rtype_id: large.rtype_id,  floor: 36, status: 'available' });
  console.log('Rooms seeded');

  // ─── Demo Bookings ────────────────────────────────────────────────────────
  const now = new Date();
  const d = (offsetHours) => new Date(now.getTime() + offsetHours * 3600000);

  // S → pending (ยังไม่จ่ายมัดจำ)
  await Booking.create({
    u_id: memberUser.u_id, r_id: rooms['S'].r_id,
    start_time: d(24), end_time: d(26), guests: 3,
    total_price: 60, deposit_amount: 0, status: 'pending',
  });

  // M → confirmed (จ่ายมัดจำแล้ว รอ check-in)
  const b2 = await Booking.create({
    u_id: memberUser2.u_id, r_id: rooms['M'].r_id,
    start_time: d(2), end_time: d(4), guests: 5,
    total_price: 120, deposit_amount: 36,
    status: 'confirmed',
  });
  await Payment.create({
    b_id: b2.b_id, amount: 36, type: 'deposit', method: 'QR', status: 'confirmed',
  });

  // L → checked_in (กำลังใช้งาน)
  const b3 = await Booking.create({
    u_id: memberUser.u_id, r_id: rooms['L'].r_id,
    start_time: d(-1), end_time: d(2), guests: 10,
    total_price: 300, deposit_amount: 90,
    status: 'checked_in', actual_check_in: d(-1),
  });
  await Payment.create({
    b_id: b3.b_id, amount: 90, type: 'deposit', method: 'QR', status: 'confirmed',
  });
  await Room.update({ status: 'occupied' }, { where: { r_id: rooms['L'].r_id } });

  // S → completed + review (ประวัติเก่า)
  const b4 = await Booking.create({
    u_id: memberUser2.u_id, r_id: rooms['S'].r_id,
    start_time: d(-50), end_time: d(-48), guests: 2,
    total_price: 60, deposit_amount: 18,
    status: 'completed',
    actual_check_in: d(-50), actual_check_out: d(-48),
  });
  await Payment.create({
    b_id: b4.b_id, amount: 18, type: 'deposit', method: 'QR', status: 'confirmed',
  });
  await Payment.create({
    b_id: b4.b_id, amount: 42, type: 'final', method: 'cash', status: 'confirmed',
  });
  await Review.create({
    b_id: b4.b_id, u_id: memberUser2.u_id, r_id: rooms['S'].r_id,
    rating: 5, comment: 'ຫ້ອງສະອາດ ສຽງດີ ພະນັກງານບໍລິການດີຫຼາຍ ຈະມາອີກແນ່ນອນ!',
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
  console.log('  S (ຫ້ອງນ້ອຍ)  → pending    (ລໍຈ່າຍມັດຈຳ)');
  console.log('  M (ຫ້ອງກາງ)  → confirmed  (ລໍ check-in)');
  console.log('  L (ຫ້ອງໃຫຍ່) → checked_in (ກຳລັງໃຊ້ງານ)');
  console.log('  S (ຫ້ອງນ້ອຍ)  → completed + review (ອະດີດ, member2)');

  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seed ລົ້ມເຫຼວ:', err.message);
  process.exit(1);
});
