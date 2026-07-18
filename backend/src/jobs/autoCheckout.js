const { Op } = require('sequelize');
const { Booking, Room } = require('../models');

// ถ้าพ้นเวลา end_time ไปแล้วเกินนี้ โดยไม่มีคน check-out เอง → ปล่อยห้องว่างอัตโนมัติ
const GRACE_PERIOD_MS = 2 * 60 * 1000;

// เช็คทุกๆ ระยะนี้ว่ามี booking ไหนเกิน grace period แล้วบ้าง
const CHECK_INTERVAL_MS = 30 * 1000;

// แค่ปล่อยห้องว่าง ไม่แตะ payment เพราะไม่รู้จริงว่าลูกค้าจ่ายส่วนที่เหลือแล้วหรือยัง
// staff ต้องยืนยัน/เก็บเงินที่ค้างแยกทีหลังตามปกติ
async function runAutoCheckout() {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);

  const overdue = await Booking.findAll({
    where: {
      status: { [Op.in]: ['checked_in', 'checking_out'] },
      end_time: { [Op.lt]: cutoff },
    },
  });

  for (const booking of overdue) {
    await booking.update({ status: 'completed', actual_check_out: new Date() });
    await Room.update({ status: 'available' }, { where: { r_id: booking.r_id } });
    console.log(`[auto-checkout] booking #${booking.b_id} ເກີນເວລາ (end_time: ${booking.end_time.toISOString()}) — ປ່ອຍຫ້ອງວ່າງອັດຕະໂນມັດ`);
  }

  return overdue.length;
}

function startAutoCheckoutJob() {
  setInterval(() => {
    runAutoCheckout().catch((err) => console.error('[auto-checkout] failed:', err.message));
  }, CHECK_INTERVAL_MS);
}

module.exports = { runAutoCheckout, startAutoCheckoutJob, GRACE_PERIOD_MS };
