const { Op } = require('sequelize');
const { Booking, Room, RoomType } = require('../models');

// ຖ້າພົ້ນເວລາ end_time ໄປແລ້ວເກີນນີ້ ໂດຍບໍ່ໄດ້ check-out → ຄິດເພີ່ມອັດຕະໂນມັດ
const GRACE_PERIOD_MS = 5 * 60 * 1000;

// ເພີ່ມເວລາຄັ້ງລະເທົ່າໃດຕໍ່ຮອບທີ່ກວດພົບວ່າເກີນເວລາ
const OVERTIME_HOURS_STEP = 1;

// ເຊັກທຸກໆລະຍະນີ້ວ່າມີ booking ໄຫນເກີນ grace period ແລ້ວແດ່
const CHECK_INTERVAL_MS = 30 * 1000;

// ບໍ່ check-out ໃຫ້ອັດຕະໂນມັດແລ້ວ — ແຕ່ຕໍ່ເວລາ + ຄິດຄ່າໂມງເກີນອັດຕະໂນມັດແທນ
// ຫ້ອງຍັງຄົງສະຖານະ occupied ຢູ່ ເພາະລູກຄ້າຍັງຢູ່ໃນຫ້ອງຈິງ staff ຕ້ອງໄປ check-out ໃຫ້ເອງພາຍຫຼັງ
async function runAutoOvertime() {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);

  const overdue = await Booking.findAll({
    where: {
      status: { [Op.in]: ['checked_in', 'checking_out'] },
      end_time: { [Op.lt]: cutoff },
    },
    include: [{ model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] }],
  });

  for (const booking of overdue) {
    const overtimeRate = parseFloat(booking.room.roomType.overtime_price_per_hour);
    const extraPrice = parseFloat((OVERTIME_HOURS_STEP * overtimeRate).toFixed(2));
    const newEnd = new Date(booking.end_time.getTime() + OVERTIME_HOURS_STEP * 3600000);
    const newTotal = parseFloat((parseFloat(booking.total_price) + extraPrice).toFixed(2));

    await booking.update({ end_time: newEnd, total_price: newTotal });
    console.log(`[auto-overtime] booking #${booking.b_id} ເກີນເວລາ check-out — ເພີ່ມ ${OVERTIME_HOURS_STEP} ຊົ່ວໂມງ (+${extraPrice}) ອັດຕະໂນມັດ, end_time ໃໝ່: ${newEnd.toISOString()}`);
  }

  return overdue.length;
}

function startAutoOvertimeJob() {
  setInterval(() => {
    runAutoOvertime().catch((err) => console.error('[auto-overtime] failed:', err.message));
  }, CHECK_INTERVAL_MS);
}

module.exports = { runAutoOvertime, startAutoOvertimeJob, GRACE_PERIOD_MS, OVERTIME_HOURS_STEP };
