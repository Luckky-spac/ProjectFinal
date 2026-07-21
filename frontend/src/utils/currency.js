// อัตราแลกเปลี่ยนคงที่ USD -> LAK ใช้แสดงราคาอ้างอิงในวงเล็บเท่านั้น ราคาจริงในระบบยังเป็น USD
const USD_TO_LAK = 21000;

export function formatUSD(amount) {
  const usd = Number(amount) || 0;
  const lak = Math.round(usd * USD_TO_LAK);
  return `$${usd.toLocaleString()} (₭${lak.toLocaleString()})`;
}
