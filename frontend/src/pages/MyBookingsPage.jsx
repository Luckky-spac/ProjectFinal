import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const STATUS_CONFIG = {
  pending: { text: 'รอยืนยัน', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { text: 'ยืนยันแล้ว', cls: 'bg-blue-100 text-blue-700' },
  checked_in: { text: 'เช็คอินแล้ว', cls: 'bg-green-100 text-green-700' },
  completed: { text: 'เสร็จสิ้น', cls: 'bg-gray-100 text-gray-600' },
  cancelled: { text: 'ยกเลิก', cls: 'bg-red-100 text-red-500' },
};

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function DepositUploadForm({ booking, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const suggested = (parseFloat(booking.total_price) * 0.3).toFixed(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file || !amount) { setError('กรุณาเลือกไฟล์และระบุจำนวนเงิน'); return; }
    const fd = new FormData();
    fd.append('slip', file);
    fd.append('deposit_amount', amount);
    setUploading(true);
    try {
      const res = await api.patch(`/bookings/${booking.id}/deposit`, fd);
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'อัปโหลดล้มเหลว');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-yellow-50 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-yellow-800">อัปโหลด Slip มัดจำ</p>
      <div className="flex gap-2 items-center">
        <input
          type="number" min="1" placeholder={`แนะนำ ฿${Number(suggested).toLocaleString()} (30%)`}
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm flex-1"
        />
        <span className="text-xs text-gray-500">บาท</span>
      </div>
      <div className="flex gap-2 items-center">
        <button type="button" onClick={() => fileRef.current.click()}
          className="text-sm border border-dashed border-yellow-400 rounded-lg px-3 py-1.5 text-yellow-700 hover:bg-yellow-100">
          {file ? file.name : 'เลือกไฟล์ slip'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => setFile(e.target.files[0])} />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button type="submit" disabled={uploading}
        className="py-2 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50">
        {uploading ? 'กำลังอัปโหลด...' : 'ส่ง Slip มัดจำ'}
      </button>
    </form>
  );
}

function FinalPaymentForm({ booking, onSuccess }) {
  const remaining = parseFloat(booking.total_price) - parseFloat(booking.deposit_amount || 0);
  const [file, setFile] = useState(null);
  const [method, setMethod] = useState('transfer');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) { setError('กรุณาเลือกไฟล์ slip'); return; }
    const fd = new FormData();
    fd.append('slip', file);
    fd.append('booking_id', booking.id);
    fd.append('amount', remaining.toFixed(2));
    fd.append('method', method);
    setUploading(true);
    try {
      const res = await api.post('/payments', fd);
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'อัปโหลดล้มเหลว');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-green-50 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-green-800">ชำระเงินส่วนที่เหลือ</p>
      <div className="flex justify-between text-sm text-gray-600">
        <span>ราคารวม</span><span>฿{Number(booking.total_price).toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>มัดจำแล้ว</span><span>฿{Number(booking.deposit_amount || 0).toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-green-700 border-t pt-2">
        <span>ยอดที่ต้องชำระ</span><span>฿{remaining.toLocaleString()}</span>
      </div>
      <select value={method} onChange={(e) => setMethod(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm">
        <option value="transfer">โอนเงิน</option>
        <option value="cash">เงินสด</option>
      </select>
      <div className="flex gap-2 items-center">
        <button type="button" onClick={() => fileRef.current.click()}
          className="text-sm border border-dashed border-green-400 rounded-lg px-3 py-1.5 text-green-700 hover:bg-green-100">
          {file ? file.name : 'เลือกไฟล์ slip'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => setFile(e.target.files[0])} />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button type="submit" disabled={uploading}
        className="py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
        {uploading ? 'กำลังอัปโหลด...' : 'ส่ง Slip ชำระเงิน'}
      </button>
    </form>
  );
}

function Receipt({ booking }) {
  const finalPayment = booking.payments?.find((p) => p.type === 'final' && p.status === 'confirmed');
  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm">
      <p className="font-semibold text-gray-700">ใบเสร็จ</p>
      <div className="flex justify-between text-gray-600">
        <span>ราคารวม</span><span>฿{Number(booking.total_price).toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>มัดจำ</span><span>฿{Number(booking.deposit_amount || 0).toLocaleString()}</span>
      </div>
      {finalPayment && (
        <div className="flex justify-between text-gray-600">
          <span>ชำระส่วนที่เหลือ</span><span>฿{Number(finalPayment.amount).toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
        <span>รวมทั้งสิ้น</span><span>฿{Number(booking.total_price).toLocaleString()}</span>
      </div>
      {booking.actual_check_in && (
        <p className="text-xs text-gray-400">เช็คอิน: {formatDateTime(booking.actual_check_in)}</p>
      )}
      {booking.actual_check_out && (
        <p className="text-xs text-gray-400">เช็คเอาต์: {formatDateTime(booking.actual_check_out)}</p>
      )}
    </div>
  );
}

function BookingCard({ booking, isNew, onUpdate }) {
  const cfg = STATUS_CONFIG[booking.status] || { text: booking.status, cls: 'bg-gray-100 text-gray-500' };
  const hours = ((new Date(booking.end_time) - new Date(booking.start_time)) / 3600000).toFixed(1);
  const hasDepositSlip = !!booking.deposit_slip;
  const hasPendingFinalPayment = booking.payments?.some((p) => p.type === 'final' && p.status === 'pending');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div className={`bg-white rounded-2xl shadow p-5 flex flex-col gap-3 ${isNew ? 'ring-2 ring-purple-400' : ''}`}>
      {isNew && (
        <div className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-lg w-fit">
          จองสำเร็จ!
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-base">ห้อง {booking.room?.room_number}</p>
          <p className="text-sm text-gray-500">{booking.room?.roomType?.name}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${cfg.cls}`}>
          {cfg.text}
        </span>
      </div>

      <div className="text-sm text-gray-600 flex flex-col gap-1">
        <div className="flex gap-2"><span className="text-gray-400 w-20">เริ่ม</span><span>{formatDateTime(booking.start_time)}</span></div>
        <div className="flex gap-2"><span className="text-gray-400 w-20">สิ้นสุด</span><span>{formatDateTime(booking.end_time)}</span></div>
        <div className="flex gap-2"><span className="text-gray-400 w-20">ระยะเวลา</span><span>{hours} ชั่วโมง</span></div>
        <div className="flex gap-2"><span className="text-gray-400 w-20">ผู้เข้าใช้</span><span>{booking.guests} คน</span></div>
      </div>

      <div className="border-t pt-3 flex justify-between items-center">
        <span className="text-sm text-gray-500">ยอดรวม</span>
        <span className="font-bold text-purple-700 text-base">฿{Number(booking.total_price).toLocaleString()}</span>
      </div>

      {booking.note && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">{booking.note}</p>
      )}

      {/* pending: ยังไม่มี slip → แสดงปุ่มอัปโหลดมัดจำ */}
      {booking.status === 'pending' && !hasDepositSlip && (
        <>
          <button onClick={() => setShowDeposit((v) => !v)}
            className="text-sm py-2 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600">
            {showDeposit ? 'ซ่อน' : 'อัปโหลด Slip มัดจำ'}
          </button>
          {showDeposit && (
            <DepositUploadForm booking={booking} onSuccess={(updated) => { onUpdate(updated); setShowDeposit(false); }} />
          )}
        </>
      )}

      {/* pending: มี slip แล้ว → รอ staff ยืนยัน */}
      {booking.status === 'pending' && hasDepositSlip && (
        <div className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
          ส่ง slip มัดจำแล้ว — รอ staff ยืนยัน
        </div>
      )}

      {/* checked_in: ยังไม่มี final payment → ชำระเงินส่วนที่เหลือ */}
      {booking.status === 'checked_in' && !hasPendingFinalPayment && (
        <>
          <button onClick={() => setShowPayment((v) => !v)}
            className="text-sm py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
            {showPayment ? 'ซ่อน' : 'ชำระเงินส่วนที่เหลือ'}
          </button>
          {showPayment && (
            <FinalPaymentForm booking={booking} onSuccess={() => { onUpdate({ ...booking, payments: [...(booking.payments || []), { type: 'final', status: 'pending' }] }); setShowPayment(false); }} />
          )}
        </>
      )}

      {/* checked_in: รอ staff ยืนยัน final payment */}
      {booking.status === 'checked_in' && hasPendingFinalPayment && (
        <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
          ส่ง slip ชำระเงินแล้ว — รอ staff ยืนยัน
        </div>
      )}

      {/* completed: ใบเสร็จ */}
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

  useEffect(() => {
    api.get('/bookings/my')
      .then((res) => setBookings(res.data))
      .catch((err) => setError(err.response?.data?.message || 'โหลดข้อมูลล้มเหลว'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">การจองของฉัน</h1>
          <button onClick={() => navigate('/rooms')} className="text-sm text-purple-600 hover:underline">
            + จองห้องใหม่
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">กำลังโหลด...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
            <span className="text-5xl">📋</span>
            <p>ยังไม่มีประวัติการจอง</p>
            <button onClick={() => navigate('/rooms')} className="text-purple-600 underline text-sm">
              ดูห้องที่ว่าง
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} isNew={b.id === newBookingId} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
