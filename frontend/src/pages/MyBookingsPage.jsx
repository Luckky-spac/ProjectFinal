import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaClipboardList, FaCalendarAlt } from 'react-icons/fa';
import api from '../api/axios';
import { formatUSD } from '../utils/currency';

const STATUS_CONFIG = {
  pending: { text: 'ລໍການຢືນຢັນ', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { text: 'ຢືນຢັນແລ້ວ', cls: 'bg-blue-100 text-blue-700' },
  checking_in: { text: 'ລໍຢືນຢັນ check-in', cls: 'bg-blue-100 text-blue-600' },
  checked_in: { text: 'ເຊັກອິນແລ້ວ', cls: 'bg-green-100 text-green-700' },
  checking_out: { text: 'ລໍຢືນຢັນ check-out', cls: 'bg-orange-100 text-orange-600' },
  completed: { text: 'ສຳເລັດ', cls: 'bg-gray-100 text-gray-600' },
  cancelled: { text: 'ຍົກເລີກ', cls: 'bg-red-100 text-red-500' },
};

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// QR ຊຳລະເງິນຈິງຈາກ PhaJay (BCEL One) — สแกนผ่านแอปธนาคารได้จริง
function QRPayment({ amount, qrImage }) {
  return (
    <div className="flex flex-col items-center bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 gap-2">
      <img src={qrImage} alt="QR ຊຳລະເງິນ" className="w-48 h-48 object-contain" />
      <p className="text-xs text-gray-500">ສະແກນດ້ວຍແອັບທະນາຄານເພື່ອຈ່າຍ (BCEL One)</p>
      <p className="text-sm font-bold text-[#7B2438]">{formatUSD(amount)}</p>
    </div>
  );
}

function PaymentForm({ booking, type, onSuccess }) {
  const isDeposit = type === 'deposit';
  // ค่ามัดจำ lock ไว้ที่ 20% ของราคาเต็ม แก้ไขเองไม่ได้ (backend ก็คำนวณค่านี้ซ้ำอีกชั้น ไม่รับยอดจาก client)
  const suggested = isDeposit
    ? Math.ceil(parseFloat(booking.total_price) * 0.2)
    : parseFloat(booking.total_price) - parseFloat(booking.deposit_amount || 0);

  const pendingQrPayment = booking.payments?.find((p) => p.type === type && p.status === 'pending' && p.method === 'QR');

  const amount = String(pendingQrPayment ? pendingQrPayment.amount : suggested);
  const [method, setMethod] = useState('QR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cashSent, setCashSent] = useState(false);
  // ถ้ามี QR ที่เจนไว้แล้วรออยู่ (เช่น refresh หน้า/เปิดแท็บใหม่) ให้ดึงกลับมาโชว์ต่อ ไม่ใช่เริ่มใหม่
  const [qrInfo, setQrInfo] = useState(() =>
    pendingQrPayment ? { qrImage: pendingQrPayment.qr_image, payId: pendingQrPayment.pay_id } : null
  );

  // poll booking ทุก 3 วิ รอ PhaJay ยืนยันว่าจ่ายจริงผ่าน socket แล้วค่อย auto-confirm
  useEffect(() => {
    if (!qrInfo) return undefined;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/bookings/${booking.b_id}`);
        const payment = res.data.payments?.find((p) => p.pay_id === qrInfo.payId);
        if (payment?.status === 'confirmed') {
          clearInterval(interval);
          onSuccess(res.data);
        }
      } catch {
        // เงียบไว้ รอ poll รอบหน้า
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [qrInfo, booking.b_id, onSuccess]);

  const handleGenerateQr = useCallback(async () => {
    setError('');
    if (!amount || parseFloat(amount) <= 0) { setError('ກະລຸນາລະບຸຈຳນວນເງິນ'); return; }
    setLoading(true);
    try {
      const res = await api.post('/payments/qr/generate', {
        booking_id: booking.b_id,
        amount: parseFloat(amount),
        type,
      });
      setQrInfo({ qrImage: res.data.qrImage, payId: res.data.payment.pay_id });
    } catch (err) {
      setError(err.response?.data?.message || 'ສ້າງ QR ລົ້ມເຫລວ ກະລຸນາລອງໃໝ່');
    } finally {
      setLoading(false);
    }
  }, [amount, booking.b_id, type]);

  const handleCash = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/payments', {
        booking_id: booking.b_id,
        amount: parseFloat(amount),
        type,
        method: 'cash',
      });
      setCashSent(true);
      onSuccess(res.data.booking);
    } catch (err) {
      setError(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDeposit ? 'bg-yellow-50' : 'bg-green-50';
  const titleColor = isDeposit ? 'text-yellow-800' : 'text-green-800';
  const title = isDeposit ? 'ຊຳລະມັດຈຳ' : 'ຊຳລະເງິນສ່ວນທີ່ເຫຼືອ';

  return (
    <div className={`mt-3 ${bgColor} rounded-xl p-4 flex flex-col gap-3`}>
      <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>

      {!isDeposit && (
        <div className="text-sm text-gray-600 flex flex-col gap-1">
          <div className="flex justify-between"><span>ລາຄາລວມ</span><span>{formatUSD(booking.total_price)}</span></div>
          <div className="flex justify-between"><span>ມັດຈຳແລ້ວ</span><span>{formatUSD(booking.deposit_amount || 0)}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>ຍອດທີ່ຕ້ອງຊຳລະ</span><span>{formatUSD(suggested)}</span></div>
        </div>
      )}

      {isDeposit && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>ຍອດມັດຈຳ (20%)</span>
          <span className="font-bold text-yellow-700">{formatUSD(amount)}</span>
        </div>
      )}

      {/* Method selector */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setMethod('QR')} disabled={!!qrInfo}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition disabled:opacity-50 ${method === 'QR' ? 'bg-[#7B2438] text-white border-[#7B2438]' : 'bg-white text-gray-600 border-gray-300'}`}>
          QR Code
        </button>
        <button type="button" onClick={() => setMethod('cash')} disabled={!!qrInfo}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition disabled:opacity-50 ${method === 'cash' ? 'bg-[#7B2438] text-white border-[#7B2438]' : 'bg-white text-gray-600 border-gray-300'}`}>
          ເງິນສົດ
        </button>
      </div>

      {method === 'QR' && (
        <div className="flex flex-col gap-3">
          {!qrInfo ? (
            <>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button type="button" onClick={handleGenerateQr} disabled={loading}
                className="py-2 bg-[#7B2438] text-white rounded-lg text-sm font-semibold hover:bg-rose-900 disabled:opacity-50">
                {loading ? 'ກຳລັງສ້າງ QR...' : 'ສ້າງ QR ຊຳລະເງິນ'}
              </button>
            </>
          ) : (
            <>
              <QRPayment amount={isDeposit ? amount : suggested} qrImage={qrInfo.qrImage} />
              <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                ລໍການຊຳລະເງິນ... ລະບົບຈະຢືນຢັນອັດຕະໂນມັດເມື່ອຈ່າຍສຳເລັດ
              </p>
            </>
          )}
        </div>
      )}

      {method === 'cash' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-200">
            ກະລຸນາຊຳລະເງິນສົດໃຫ້ພະນັກງານ ຈຳນວນ <strong>{formatUSD(isDeposit ? amount : suggested)}</strong>
          </p>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {!cashSent && (
            <button type="button" onClick={handleCash} disabled={loading}
              className="py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'ກຳລັງດຳເນີນການ...' : 'ແຈ້ງຊຳລະເງິນສົດ'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Receipt({ booking }) {
  const finalPayment = booking.payments?.find((p) => p.type === 'final' && p.status === 'confirmed');
  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm">
      <p className="font-semibold text-gray-700">ໃບບິນ</p>
      <div className="flex justify-between text-gray-600">
        <span>ລາຄາລວມ</span><span>{formatUSD(booking.total_price)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>ມັດຈຳ</span><span>{formatUSD(booking.deposit_amount || 0)}</span>
      </div>
      {finalPayment && (
        <div className="flex justify-between text-gray-600">
          <span>ຊຳລະສ່ວນທີ່ເຫຼືອ</span><span>{formatUSD(finalPayment.amount)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
        <span>ລວມທັງໝົດ</span><span>{formatUSD(booking.total_price)}</span>
      </div>
      {booking.actual_check_in && (
        <p className="text-xs text-gray-400">ເຊັກອິນ: {formatDateTime(booking.actual_check_in)}</p>
      )}
      {booking.actual_check_out && (
        <p className="text-xs text-gray-400">ເຊັກເອົາ: {formatDateTime(booking.actual_check_out)}</p>
      )}
    </div>
  );
}

function ExtendForm({ booking, onSuccess }) {
  const overtimeRate = parseFloat(booking.room?.roomType?.overtime_price_per_hour || 0);
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.patch(`/bookings/${booking.b_id}/extend`, { extra_hours: hours });
      onSuccess(res.data.booking);
      alert(`ຕໍ່ເວລາສຳເລັດ! ຄ່າໃຊ້ຈ່າຍເພີ່ມ ${formatUSD(res.data.extra_price)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-blue-50 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-blue-800">ຕໍ່ເວລາ</p>
      <div className="flex gap-2 items-center">
        <label className="text-sm text-gray-600">ຈຳນວນຊົ່ວໂມງ</label>
        <select value={hours} onChange={(e) => setHours(Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm flex-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>
              {h} ຊມ. — {formatUSD(h * overtimeRate)}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button type="submit" disabled={loading}
        className="py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'ກຳລັງດຳເນີນການ...' : 'ຢືນຢັນຕໍ່ເວລາ'}
      </button>
    </form>
  );
}

function BookingCard({ booking, isNew, onUpdate }) {
  const cfg = STATUS_CONFIG[booking.status] || { text: booking.status, cls: 'bg-gray-100 text-gray-500' };
  const hours = ((new Date(booking.end_time) - new Date(booking.start_time)) / 3600000).toFixed(1);

  const pendingDeposit = booking.payments?.find((p) => p.type === 'deposit' && p.status === 'pending');
  const hasPendingCashDeposit = pendingDeposit?.method === 'cash';
  const hasPendingQrDeposit = pendingDeposit?.method === 'QR';
  const hasConfirmedDeposit = booking.payments?.some((p) => p.type === 'deposit' && p.status === 'confirmed');

  const pendingFinal = booking.payments?.find((p) => p.type === 'final' && p.status === 'pending');
  const hasPendingCashFinal = pendingFinal?.method === 'cash';
  const hasPendingQrFinal = pendingFinal?.method === 'QR';
  const hasConfirmedFinalPayment = booking.payments?.some((p) => p.type === 'final' && p.status === 'confirmed');

  const [showDeposit, setShowDeposit] = useState(hasPendingQrDeposit);
  const [showPayment, setShowPayment] = useState(hasPendingQrFinal);
  const [showExtend, setShowExtend] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const doCheckin = async () => {
    if (!window.confirm('ຢືນຢັນວ່າທ່ານມາເຖິງສະຖານທີ່ແລ້ວ?')) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/bookings/${booking.b_id}/checkin`);
      onUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow p-5 flex flex-col gap-3 ${isNew ? 'ring-2 ring-rose-400' : ''}`}>
      {isNew && (
        <div className="text-xs text-[#7B2438] font-semibold bg-rose-50 px-2 py-1 rounded-lg w-fit">
          ຈອງສຳເລັດ!
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-base">ຫ້ອງ {booking.room?.room_number}</p>
          <p className="text-sm text-gray-500">{booking.room?.roomType?.name}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${cfg.cls}`}>
          {cfg.text}
        </span>
      </div>

      <div className="text-sm text-gray-600 flex flex-col gap-1">
        <div className="flex gap-2"><span className="text-gray-400 w-24">ເລີ່ມ</span><span>{formatDateTime(booking.start_time)}</span></div>
        <div className="flex gap-2"><span className="text-gray-400 w-24">ສິ້ນສຸດ</span><span>{formatDateTime(booking.end_time)}</span></div>
        <div className="flex gap-2"><span className="text-gray-400 w-24">ໄລຍະເວລາ</span><span>{hours} ຊົ່ວໂມງ</span></div>
        <div className="flex gap-2"><span className="text-gray-400 w-24">ຜູ້ເຂົ້າໃຊ້</span><span>{booking.guests} ຄົນ</span></div>
      </div>

      <div className="border-t pt-3 flex justify-between items-center">
        <span className="text-sm text-gray-500">ຍອດລວມ</span>
        <span className="font-bold text-[#7B2438] text-base">{formatUSD(booking.total_price)}</span>
      </div>

      {/* pending — ຈ່າຍມັດຈຳ */}
      {booking.status === 'pending' && !hasConfirmedDeposit && !hasPendingCashDeposit && (
        <>
          <button onClick={() => setShowDeposit((v) => !v)}
            className="text-sm py-2 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600">
            {showDeposit ? 'ຫຍໍ້ໜ້າ' : 'ຈ່າຍຄ່າມັດຈຳ'}
          </button>
          {showDeposit && (
            <PaymentForm booking={booking} type="deposit"
              onSuccess={(updated) => { onUpdate(updated); setShowDeposit(false); }} />
          )}
        </>
      )}

      {booking.status === 'pending' && hasPendingCashDeposit && (
        <div className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
          ແຈ້ງຊຳລະເງິນສົດແລ້ວ — ລໍພະນັກງານຢືນຢັນ
        </div>
      )}

      {/* confirmed — check-in */}
      {booking.status === 'confirmed' && (
        <button onClick={doCheckin} disabled={actionLoading}
          className="text-sm py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
          {actionLoading ? 'ກຳລັງດຳເນີນການ...' : 'ຂ້ອຍມາຮອດແລ້ວ (Check-in)'}
        </button>
      )}

      {booking.status === 'checking_in' && (
        <div className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
          ແຈ້ງ check-in ແລ້ວ — ລໍພະນັກງານຢືນຢັນ
        </div>
      )}

      {/* checked_in — ຊຳລະສ່ວນທີ່ເຫຼືອ + ຕໍ່ເວລາ */}
      {booking.status === 'checked_in' && (
        <>
          {!hasPendingCashFinal && !hasConfirmedFinalPayment && (
            <>
              <button onClick={() => setShowPayment((v) => !v)}
                className="text-sm py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
                {showPayment ? 'ເກັບແທັບ' : 'ຊຳລະເງິນສ່ວນທີ່ເຫຼືອ'}
              </button>
              {showPayment && (
                <PaymentForm booking={booking} type="final"
                  onSuccess={(updated) => { onUpdate(updated); setShowPayment(false); }} />
              )}
            </>
          )}
          {hasPendingCashFinal && (
            <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              ແຈ້ງຊຳລະເງິນສົດແລ້ວ — ລໍພະນັກງານຢືນຢັນ
            </div>
          )}
          <button onClick={() => setShowExtend((v) => !v)}
            className="text-sm py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200">
            {showExtend ? 'ເກັບແທັບ' : 'ຕໍ່ເວລາການໃຊ້ຫ້ອງ'}
          </button>
          {showExtend && <ExtendForm booking={booking} onSuccess={(updated) => { onUpdate(updated); setShowExtend(false); }} />}
        </>
      )}

      {booking.status === 'checking_out' && (
        <div className="text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
          ແຈ້ງ check-out ແລ້ວ — ລໍພະນັກງານຢືນຢັນ
        </div>
      )}

      {booking.status === 'completed' && <Receipt booking={booking} />}
    </div>
  );
}

export default function MyBookingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const newBookingId = location.state?.newBookingId;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    api.get('/bookings/my')
      .then((res) => setBookings(res.data))
      .catch((err) => setError(err.response?.data?.message || 'ໂຫຼດຂໍ້ມູນລົ້ມເຫຼວ'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated) => {
    if (!updated) return;
    setBookings((prev) => prev.map((b) => (b.b_id === updated.b_id ? updated : b)));
  };

  const filteredBookings = useMemo(() => {
    if (!selectedMonth) return bookings;
    return bookings.filter((b) => b.start_time?.slice(0, 7) === selectedMonth);
  }, [bookings, selectedMonth]);

  const monthSummary = useMemo(() => {
    if (!selectedMonth) return null;
    const total = filteredBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
    return { count: filteredBookings.length, total };
  }, [filteredBookings, selectedMonth]);

  return (
    <div className="relative min-h-screen py-8 px-4">
      <img src="/images/hero.jpeg" alt="" className="fixed inset-0 w-full h-full object-cover -z-10" />
      <div className="fixed inset-0 bg-black/60 -z-10" />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white drop-shadow">ການຈອງຂອງຂ້ອຍ</h1>
          <button onClick={() => navigate('/rooms')} className="text-sm text-white hover:underline font-semibold drop-shadow">
            + ຈອງຫ້ອງໃໝ່
          </button>
        </div>

        {bookings.length > 0 && (
          <div className="bg-white/95 rounded-xl p-3 mb-4 flex items-center gap-3 shadow-sm">
            <FaCalendarAlt className="text-[#7B2438] shrink-0" />
            <input
              type="month" value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-rose-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {selectedMonth && (
              <button
                type="button" onClick={() => setSelectedMonth('')}
                className="text-xs text-[#7B2438] underline"
              >
                ເບິ່ງທັງໝົດ
              </button>
            )}
            {monthSummary && (
              <span className="ml-auto text-xs text-gray-500 text-right">
                {monthSummary.count} ລາຍການ · ຍອດລວມ {formatUSD(monthSummary.total)}
              </span>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
            <FaClipboardList className="text-5xl" />
            <p>ຍັງບໍ່ມີປະຫວັດການຈອງ</p>
            <button onClick={() => navigate('/rooms')} className="text-[#7B2438] underline text-sm">
              ເບິ່ງຫ້ອງທີ່ວ່າງ
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
            <FaCalendarAlt className="text-5xl" />
            <p>ບໍ່ມີການຈອງໃນເດືອນນີ້</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredBookings.map((b) => (
              <BookingCard key={b.b_id} booking={b} isNew={b.b_id === newBookingId} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
