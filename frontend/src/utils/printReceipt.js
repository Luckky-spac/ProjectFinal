import { formatUSD } from './currency';

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ເປີດໜ້າຕ່າງໃໝ່ + ພິມໃບບິນ ແຍກອອກຈາກໜ້າຫຼັກ ເພື່ອບໍ່ໃຫ້ຂໍ້ມູນຫຼາຍລາຍການປົນກັນຕອນພິມ (ບໍ່ອີງໃສ່ Tailwind ຈຶ່ງໃຊ້ CSS ທຳມະດາໃນຕົວ)
export function printBookingReceipt(booking) {
  const deposit = parseFloat(booking.deposit_amount || 0);
  const finalPayment = booking.payments?.find((p) => p.type === 'final' && p.status === 'confirmed');
  const customerName = [booking.user?.customer?.fname, booking.user?.customer?.lname].filter(Boolean).join(' ') || '-';

  const rows = [
    ['ຫ້ອງ', `${booking.room?.room_number || '-'} — ${booking.room?.roomType?.name || ''}`],
    ['ລູກຄ້າ', customerName],
    ['ເບີໂທ', booking.user?.customer?.phone || '-'],
    ['ເຊັກອິນ', formatDateTime(booking.actual_check_in)],
    ['ເຊັກເອົາ', formatDateTime(booking.actual_check_out)],
  ];

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<title>ໃບບິນ #${booking.b_id}</title>
<style>
  body { font-family: 'Phetsarath', 'Segoe UI', sans-serif; padding: 24px; color: #222; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .muted { color: #777; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  td { padding: 6px 0; font-size: 14px; }
  td.label { color: #777; width: 40%; }
  .totals td { border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold; font-size: 16px; }
  .right { text-align: right; }
</style>
</head>
<body>
  <h1>ໃບບິນ / ໃບຮັບເງິນ</h1>
  <p class="muted">ເລກທີການຈອງ #${booking.b_id} · ພິມເມື່ອ ${new Date().toLocaleString('lo-LA')}</p>
  <table>
    ${rows.map(([label, val]) => `<tr><td class="label">${label}</td><td>${val}</td></tr>`).join('')}
  </table>
  <table>
    <tr><td class="label">ລາຄາລວມ</td><td class="right">${formatUSD(booking.total_price)}</td></tr>
    <tr><td class="label">ມັດຈຳ</td><td class="right">${formatUSD(deposit)}</td></tr>
    ${finalPayment ? `<tr><td class="label">ຊຳລະສ່ວນທີ່ເຫຼືອ</td><td class="right">${formatUSD(finalPayment.amount)}</td></tr>` : ''}
    <tr class="totals"><td>ລວມທັງໝົດ</td><td class="right">${formatUSD(booking.total_price)}</td></tr>
  </table>
</body></html>`;

  const win = window.open('', '_blank', 'width=420,height=600');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { try { win.print(); } catch { /* ignore */ } }, 250);
}
