import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roomId = searchParams.get('room_id');
  const preDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const preStart = searchParams.get('start_time') || '';
  const preEnd = searchParams.get('end_time') || '';

  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState('');

  const [date, setDate] = useState(preDate);
  const [startTime, setStartTime] = useState(preStart);
  const [hours, setHours] = useState(() => {
    if (preStart && preEnd) {
      const s = new Date(`2000-01-01T${preStart}`);
      const e = new Date(`2000-01-01T${preEnd}`);
      const h = (e - s) / 3600000;
      return h > 0 ? String(h) : '1';
    }
    return '1';
  });
  const [guests, setGuests] = useState('1');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!roomId) {
      setRoomError('ไม่ได้ระบุห้อง กรุณาเลือกห้องจากหน้าห้อง');
      setLoadingRoom(false);
      return;
    }
    api.get(`/rooms/${roomId}`)
      .then((res) => setRoom(res.data))
      .catch(() => setRoomError('ไม่พบห้องที่เลือก'))
      .finally(() => setLoadingRoom(false));
  }, [roomId]);

  // คำนวณค่าต่างๆ
  const hoursNum = parseFloat(hours) || 0;
  const pricePerHour = parseFloat(room?.roomType?.price_per_hour) || 0;
  const totalPrice = hoursNum * pricePerHour;

  const endTime = (() => {
    if (!startTime || hoursNum <= 0) return '';
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + hoursNum * 60;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!date || !startTime || hoursNum <= 0) {
      setSubmitError('กรุณากรอกวันที่ เวลาเริ่มต้น และจำนวนชั่วโมงให้ครบ');
      return;
    }
    if (!endTime) {
      setSubmitError('ไม่สามารถคำนวณเวลาสิ้นสุดได้');
      return;
    }

    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;

    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        room_id: roomId,
        start_time: startISO,
        end_time: endISO,
        guests: parseInt(guests),
        note,
      });
      navigate(`/my-bookings`, { state: { newBookingId: res.data.id } });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'จองห้องล้มเหลว กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRoom) {
    return <div className="flex justify-center py-20 text-gray-400">กำลังโหลด...</div>;
  }
  if (roomError) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <p className="text-red-500">{roomError}</p>
        <button onClick={() => navigate('/rooms')} className="text-purple-600 underline text-sm">
          กลับไปเลือกห้อง
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/rooms')} className="text-sm text-purple-600 mb-4 hover:underline">
          ← กลับไปหน้าห้อง
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">จองห้องคาราโอเกะ</h1>

        {/* Room info card */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex gap-4 items-center">
          <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
            {room.image_url ? (
              <img src={room.image_url} alt={room.room_number} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-3xl">🎤</div>
            )}
          </div>
          <div>
            <p className="font-bold text-lg">ห้อง {room.room_number}</p>
            <p className="text-sm text-gray-500">{room.roomType?.name} · ชั้น {room.floor}</p>
            <p className="text-sm text-gray-500">จุได้ {room.roomType?.capacity} คน</p>
            <p className="text-purple-600 font-semibold text-sm mt-1">
              ฿{pricePerHour.toLocaleString()} / ชั่วโมง
            </p>
          </div>
        </div>

        {/* Booking form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700">วันที่จอง</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700">เวลาเริ่มต้น</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700">จำนวนชั่วโมง</label>
              <select
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map((h) => (
                  <option key={h} value={h}>{h} ชั่วโมง</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700">เวลาสิ้นสุด</label>
              <input
                type="time"
                value={endTime}
                readOnly
                className="border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700">จำนวนผู้เข้าใช้</label>
              <input
                type="number"
                min={1}
                max={room.roomType?.capacity || 20}
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium text-gray-700">หมายเหตุ (ถ้ามี)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="ต้องการอุปกรณ์พิเศษ หรือข้อมูลเพิ่มเติม..."
                className="border rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>

          {/* Price summary */}
          <div className="bg-purple-50 rounded-xl p-4 text-sm flex flex-col gap-1">
            <p className="font-semibold text-gray-700 mb-1">สรุปค่าใช้จ่าย</p>
            <div className="flex justify-between text-gray-600">
              <span>ราคา / ชั่วโมง</span>
              <span>฿{pricePerHour.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>จำนวนชั่วโมง</span>
              <span>{hoursNum} ชั่วโมง</span>
            </div>
            <div className="border-t border-purple-200 mt-1 pt-1 flex justify-between font-bold text-purple-700 text-base">
              <span>รวมทั้งสิ้น</span>
              <span>฿{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting || !user}
            className="py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm
              hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'กำลังจอง...' : 'ยืนยันการจอง'}
          </button>

          {!user && (
            <p className="text-center text-sm text-gray-500">
              กรุณา{' '}
              <a href="/login" className="text-purple-600 underline">เข้าสู่ระบบ</a>
              {' '}ก่อนทำการจอง
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
