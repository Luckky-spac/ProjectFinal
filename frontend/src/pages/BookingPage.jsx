import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roomId   = searchParams.get('room_id');
  const preDate  = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const preStart = searchParams.get('start_time') || '';
  const preEnd   = searchParams.get('end_time') || '';

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
      if (h > 0) {
        const clamped = Math.min(8, Math.max(1, Math.round(h)));
        return String(clamped);
      }
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
      setRoomError('ບໍ່ໄດ້ລະບຸຫ້ອງ ກະລຸນາເລືອກຫ້ອງ');
      setLoadingRoom(false);
      return;
    }
    api.get(`/rooms/${roomId}`)
      .then((res) => setRoom(res.data))
      .catch(() => setRoomError('ບໍ່ພົບຫ້ອງທີ່ເລືອກ'))
      .finally(() => setLoadingRoom(false));
  }, [roomId]);

  // คำนวณ endDateTime รองรับข้ามเที่ยงคืน
  const hoursNum = parseFloat(hours) || 0;
  const pricePerHour = parseFloat(room?.roomType?.price_per_hour) || 0;
  const totalPrice = hoursNum * pricePerHour;

  const endDateTime = (() => {
    if (!date || !startTime || hoursNum <= 0) return null;
    const start = new Date(`${date}T${startTime}:00`);
    if (isNaN(start)) return null;
    return new Date(start.getTime() + hoursNum * 3600000);
  })();

  const endTime = endDateTime
    ? `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`
    : '';

  const endDateLabel = (() => {
    if (!endDateTime || !date) return '';
    const startDate = new Date(`${date}T00:00:00`);
    const diff = Math.round((endDateTime - startDate) / 86400000);
    return diff >= 1 ? `(+${diff} ວັນ)` : '';
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!date || !startTime || hoursNum <= 0) {
      setSubmitError('ກະລຸນາກວດຂໍ້ມູນໃຫ້ຄົບ');
      return;
    }
    if (!endDateTime) {
      setSubmitError('ບໍ່ສາມາດຄຳນວນເວລາສິ້ນສຸດ');
      return;
    }
    const startISO = `${date}T${startTime}:00`;
    const pad = (n) => String(n).padStart(2, '0');
    const ed = endDateTime;
    const endISO = `${ed.getFullYear()}-${pad(ed.getMonth() + 1)}-${pad(ed.getDate())}T${pad(ed.getHours())}:${pad(ed.getMinutes())}:00`;

    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        room_id: roomId,
        start_time: startISO,
        end_time: endISO,
        guests: parseInt(guests),
        note,
      });
      navigate('/my-bookings', { state: { newBookingId: res.data.id } });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'ຈອງຫ້ອງລົ້ມເຫຼວ ກະລຸນາລອງໃໝ່');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRoom) {
    return <div className="flex justify-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>;
  }
  if (roomError) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <p className="text-red-500">{roomError}</p>
        <button onClick={() => navigate('/rooms')} className="text-[#7B2438] underline text-sm">
          ກັບໄປເລືອກຫ້ອງ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 py-8 px-4">
      <div className="max-w-lg mx-auto">

        <button
          onClick={() => navigate('/rooms')}
          className="text-sm text-[#7B2438] mb-4 hover:underline flex items-center gap-1"
        >
          ← ກັບໄປຫ້ອງ
        </button>

        {/* ─── Booking Card (dark maroon) ─── */}
        <div className="bg-[#7B2438] rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-5 pb-3 border-b border-rose-700">
            <h1 className="text-white font-bold text-lg flex items-center gap-2">
              ✏️ ເພີ່ມ ການຈອງ
            </h1>
            <p className="text-rose-300 text-xs mt-0.5">
              ຫ້ອງ {room.room_number} · {room.roomType?.name}
            </p>
          </div>

          {/* Room Photo strip */}
          <div className="px-6 pt-4">
            <div className="w-full h-28 bg-rose-900 rounded-xl flex items-center justify-center overflow-hidden">
              {room.image_url ? (
                <img src={room.image_url} alt={room.room_number} className="w-full h-full object-cover" />
              ) : (
                /*
                  TODO: ใส่รูปห้อง {room.room_number}
                  เพิ่ม image_url ในข้อมูลห้องผ่าน Admin Panel
                */
                <div className="text-center text-rose-500">
                  <div className="text-4xl">🎤</div>
                  <p className="text-xs mt-1">[ ຮູບຫ້ອງ {room.room_number} ]</p>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-3">

            {/* Row 1: ชื่อผู้จอง + Check-in */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-rose-200 text-xs font-medium flex items-center gap-1 mb-1">
                  👤 ຊື່ ແລະ ນາມສະກຸນ
                </label>
                <input
                  value={user?.name || ''}
                  disabled
                  className="w-full bg-rose-900 border border-rose-700 text-white rounded-lg px-3 py-2 text-sm placeholder-rose-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-rose-200 text-xs font-medium flex items-center gap-1 mb-1">
                  🕐 ເວລາ Check-in
                </label>
                <input
                  type="time" value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-white border border-rose-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            </div>

            {/* Row 2: จำนวนคน + หมายเหตุ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-rose-200 text-xs font-medium flex items-center gap-1 mb-1">
                  👥 ຈຳນວນຜູ້ໃຊ້
                </label>
                <input
                  type="number" min={1} max={room.roomType?.capacity || 20}
                  value={guests} onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-white border border-rose-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="text-rose-200 text-xs font-medium flex items-center gap-1 mb-1">
                  📋 ໝາຍເຫດ
                </label>
                <input
                  value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="ຕ້ອງການອຸປະກອນພິເສດ..."
                  className="w-full bg-white border border-rose-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            </div>

            {/* Row 3: วันที่ + ชั่วโมง */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-rose-200 text-xs font-medium flex items-center gap-1 mb-1">
                  📅 ວັນທີ ຈອງ
                </label>
                <input
                  type="date" min={today} value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-white border border-rose-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="text-rose-200 text-xs font-medium flex items-center gap-1 mb-1">
                  ⏱️ ຈຳນວນຊົ່ວໂມງ
                </label>
                <select
                  value={hours} onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-white border border-rose-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                    <option key={h} value={h}>{h} ຊົ່ວໂມງ</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ประเภทห้อง (readonly) */}
            <div>
              <label className="text-rose-200 text-xs font-medium flex items-center gap-1 mb-1">
                🏠 ປະເພດຫ້ອງ
              </label>
              <div className="w-full bg-rose-900 border border-rose-700 text-rose-200 rounded-lg px-3 py-2 text-sm">
                {room.roomType?.name} — ບັບຈຸໄດ້ {room.roomType?.capacity} ທ່ານ
              </div>
            </div>

            {/* สรุปเวลาและราคา */}
            <div className="bg-rose-900 rounded-xl p-3 text-sm flex flex-col gap-1 border border-rose-700">
              <div className="flex justify-between text-rose-300">
                <span>ເວລາສິ້ນສຸດ</span>
                <span className="text-white font-medium">
                  {endTime || '—'}
                  {endDateLabel && <span className="ml-1 text-xs text-yellow-300">{endDateLabel}</span>}
                </span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>ລາຄາ / ຊົ່ວໂມງ</span>
                <span className="text-white">฿{pricePerHour.toLocaleString()}</span>
              </div>
              <div className="border-t border-rose-700 mt-1 pt-1 flex justify-between font-bold text-white text-base">
                <span>ລວມທັງໝົດ</span>
                <span>฿{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {submitError && (
              <p className="text-yellow-300 text-xs bg-rose-900 rounded-lg px-3 py-2">{submitError}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="flex-1 py-2.5 border border-rose-500 text-rose-200 rounded-xl text-sm font-semibold hover:bg-rose-800 transition flex items-center justify-center gap-1"
              >
                ✕ ຍົກເລີກ
              </button>
              <button
                type="submit"
                disabled={submitting || !user}
                className="flex-1 py-2.5 bg-white text-[#7B2438] rounded-xl font-bold text-sm hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1"
              >
                {submitting ? 'ກຳລັງຈອງ...' : '💾 ບັນທຶກ'}
              </button>
            </div>

            {!user && (
              <p className="text-center text-xs text-rose-300 mt-1">
                ກະລຸນາ{' '}
                <a href="/login" className="text-white underline">ເຂົ້າສູ່ລະບົບ</a>
                {' '}ກ່ອນຈອງ
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
