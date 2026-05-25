import { useState, useEffect } from 'react';
import api from '../api/axios';

const STATUS_CONFIG = {
  pending: { text: 'รอยืนยัน', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { text: 'ยืนยันแล้ว', cls: 'bg-blue-100 text-blue-700' },
  checked_in: { text: 'เช็คอินแล้ว', cls: 'bg-green-100 text-green-700' },
  completed: { text: 'เสร็จสิ้น', cls: 'bg-gray-100 text-gray-600' },
  cancelled: { text: 'ยกเลิก', cls: 'bg-red-100 text-red-500' },
};

const TABS = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอยืนยัน' },
  { key: 'confirmed', label: 'ยืนยันแล้ว' },
  { key: 'checked_in', label: 'เช็คอินแล้ว' },
  { key: 'completed', label: 'เสร็จสิ้น' },
  { key: 'cancelled', label: 'ยกเลิก' },
];

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ActionButton({ label, color, onClick, disabled }) {
  const colors = {
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${colors[color]}`}
    >
      {label}
    </button>
  );
}

function BookingRow({ booking, onUpdate }) {
  const cfg = STATUS_CONFIG[booking.status] || { text: booking.status, cls: 'bg-gray-100 text-gray-500' };
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasDepositSlip = !!booking.deposit_slip;
  const pendingFinalPayment = booking.payments?.find((p) => p.type === 'final' && p.status === 'pending');

  const changeStatus = async (status) => {
    setLoading(true);
    try {
      const res = await api.patch(`/bookings/${booking.id}/status`, { status });
      onUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const confirmFinalPayment = async () => {
    if (!pendingFinalPayment) return;
    setLoading(true);
    try {
      const res = await api.patch(`/payments/${pendingFinalPayment.id}/confirm`);
      onUpdate(res.data.booking);
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const rejectFinalPayment = async () => {
    if (!pendingFinalPayment) return;
    setLoading(true);
    try {
      await api.patch(`/payments/${pendingFinalPayment.id}/reject`);
      onUpdate({ ...booking, payments: booking.payments.map((p) => p.id === pendingFinalPayment.id ? { ...p, status: 'rejected' } : p) });
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">ห้อง {booking.room?.room_number}</span>
            <span className="text-xs text-gray-400">{booking.room?.roomType?.name}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.text}</span>
            {hasDepositSlip && booking.status === 'pending' && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                มี slip มัดจำ
              </span>
            )}
            {pendingFinalPayment && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                มี slip ชำระเงิน
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {booking.user?.name} · {formatDateTime(booking.start_time)} – {formatDateTime(booking.end_time)}
          </p>
        </div>
        <span className="text-sm font-bold text-purple-700 whitespace-nowrap">
          ฿{Number(booking.total_price).toLocaleString()}
        </span>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div><span className="text-gray-400">ผู้จอง: </span>{booking.user?.name}</div>
            <div><span className="text-gray-400">โทร: </span>{booking.user?.phone || '-'}</div>
            <div><span className="text-gray-400">ผู้เข้าใช้: </span>{booking.guests} คน</div>
            <div><span className="text-gray-400">มัดจำ: </span>฿{Number(booking.deposit_amount || 0).toLocaleString()}</div>
          </div>

          {booking.note && (
            <p className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2">{booking.note}</p>
          )}

          {/* Slip images */}
          {booking.deposit_slip && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Slip มัดจำ</p>
              <a href={booking.deposit_slip} target="_blank" rel="noreferrer">
                <img src={booking.deposit_slip} alt="deposit slip" className="h-28 rounded-lg object-cover border" />
              </a>
            </div>
          )}
          {pendingFinalPayment?.slip_url && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Slip ชำระเงินส่วนที่เหลือ</p>
              <a href={pendingFinalPayment.slip_url} target="_blank" rel="noreferrer">
                <img src={pendingFinalPayment.slip_url} alt="final slip" className="h-28 rounded-lg object-cover border" />
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {booking.status === 'pending' && hasDepositSlip && (
              <ActionButton label="ยืนยันมัดจำ" color="blue" disabled={loading} onClick={() => changeStatus('confirmed')} />
            )}
            {booking.status === 'confirmed' && (
              <ActionButton label="เช็คอิน" color="green" disabled={loading} onClick={() => changeStatus('checked_in')} />
            )}
            {booking.status === 'checked_in' && pendingFinalPayment && (
              <>
                <ActionButton label="ยืนยันชำระเงิน" color="purple" disabled={loading} onClick={confirmFinalPayment} />
                <ActionButton label="ปฏิเสธ slip" color="red" disabled={loading} onClick={rejectFinalPayment} />
              </>
            )}
            {['pending', 'confirmed'].includes(booking.status) && (
              <ActionButton label="ยกเลิกการจอง" color="red" disabled={loading} onClick={() => {
                if (window.confirm('ยืนยันยกเลิกการจองนี้?')) changeStatus('cancelled');
              }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffDashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const [error, setError] = useState('');

  const fetchBookings = (status = '') => {
    setLoading(true);
    setError('');
    const params = status ? { status } : {};
    api.get('/bookings', { params })
      .then((res) => setBookings(res.data))
      .catch((err) => setError(err.response?.data?.message || 'โหลดข้อมูลล้มเหลว'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(tab); }, [tab]);

  const handleUpdate = (updated) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const needAttention = bookings.filter(
    (b) => (b.status === 'pending' && b.deposit_slip) ||
            (b.status === 'checked_in' && b.payments?.some((p) => p.type === 'final' && p.status === 'pending'))
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            {needAttention > 0 && (
              <p className="text-sm text-orange-600 font-medium mt-0.5">
                {needAttention} รายการรอดำเนินการ
              </p>
            )}
          </div>
          <button onClick={() => fetchBookings(tab)}
            className="text-sm text-purple-600 hover:underline">
            รีเฟรช
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap mb-4">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === t.key ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">กำลังโหลด...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">ไม่มีการจอง</div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <BookingRow key={b.id} booking={b} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
