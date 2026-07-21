// ຮ້ານເປີດ 12:00 - 01:00 (ຂ້າມວັນ) — ຈອງ/ຄົ້ນຫາຄັ້ງລະ 4 ຊົ່ວໂມງເທົ່ານັ້ນ (ຂັ້ນຕ່ຳ/ແພັກເກັດ)
export const OPEN_HOUR = 12;
export const CLOSE_HOUR = 1;
export const BOOKING_HOURS = 4;

// ตัวเลือกเวลาเริ่ม: 12:00 ถึงเวลาล่าสุดที่จอง 4 ชม. แล้วปิดพอดี 01:00
const LAST_START_MIN = (24 + CLOSE_HOUR) * 60 - BOOKING_HOURS * 60;
export const START_TIME_OPTIONS = Array.from(
  { length: (LAST_START_MIN - OPEN_HOUR * 60) / 30 + 1 },
  (_, i) => {
    const totalMin = OPEN_HOUR * 60 + i * 30;
    const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const m = String(totalMin % 60).padStart(2, '0');
    return `${h}:${m}`;
  }
);

// คำนวณเวลาสิ้นสุด (start + BOOKING_HOURS) จากวันที่ + เวลาเริ่มที่เลือก
export function computeEndDateTime(date, startTime) {
  if (!date || !startTime) return null;
  const start = new Date(`${date}T${startTime}:00`);
  if (isNaN(start)) return null;
  return new Date(start.getTime() + BOOKING_HOURS * 3600000);
}
