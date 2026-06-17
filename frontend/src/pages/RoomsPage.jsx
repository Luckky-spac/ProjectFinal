import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function RoomCard({ room, onBook }) {
  const isAvail = room.isAvailable;
  const isMaint = room.status === 'maintenance';

  let badge, badgeCls;
  if (isAvail)       { badge = 'ວ່າງ';       badgeCls = 'bg-green-500 text-white'; }
  else if (isMaint)  { badge = 'ຊ່ອມບຳລຸງ'; badgeCls = 'bg-yellow-500 text-white'; }
  else               { badge = 'ບໍ່ວ່າງ';    badgeCls = 'bg-red-500 text-white'; }

  return (
    <div className="bg-rose-100 rounded-2xl overflow-hidden shadow-md border border-rose-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[#7B2438] text-base">
            ຫ້ອງ {room.room_number} — {room.roomType?.name}
          </h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
            {badge}
          </span>
        </div>
        <span className="text-[#7B2438] text-xl">📅</span>
      </div>

      {/* Photo — 1 ช่อง */}
      <div className="px-5 pb-3">
        <div className="bg-gray-300 h-40 rounded-xl flex items-center justify-center overflow-hidden">
          {room.image_url ? (
            <img
              src={room.image_url}
              alt={`ຫ້ອງ ${room.room_number}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-xs text-center px-2">
              [ ຮູບຫ້ອງ {room.room_number} ]
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <span className="text-xs text-rose-400 italic">{room.roomType?.name}</span>
        <button
          onClick={() => onBook(room)}
          disabled={!isAvail}
          className={`px-5 py-1.5 rounded-lg text-sm font-bold transition shadow-sm ${
            isAvail
              ? 'bg-[#7B2438] text-white hover:bg-rose-900'
              : 'bg-gray-300 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isAvail ? 'ຈອງຫ້ອງນີ້' : 'ບໍ່ວ່າງ'}
        </button>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [filtered, setFiltered] = useState(false);

  const fetchRooms = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/rooms', { params });
      setRooms(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'ໂຫຼດຂໍ້ມູນລົ້ມເຫຼວ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;
    setFiltered(true);
    fetchRooms({ date, start_time: startTime, end_time: endTime });
  };

  const handleReset = () => {
    setStartTime('');
    setEndTime('');
    setFiltered(false);
    fetchRooms();
  };

  const handleBook = (room) => {
    navigate(`/rooms/${room.r_id}`);
  };

  const availCount = rooms.filter((r) => r.isAvailable).length;

  return (
    <div className="min-h-screen bg-green-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#7B2438] mb-6">ຫ້ອງຄາຣາໂອເກະທັງໝົດ</h1>

        {/* ─── Filter ─── */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end border border-rose-100"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">ວັນທີ</label>
            <input
              type="date" min={today} value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">ເວລາເລີ່ມ</label>
            <input
              type="time" value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">ເວລາສິ້ນສຸດ</label>
            <input
              type="time" value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <button
            type="submit"
            disabled={!date || !startTime || !endTime}
            className="px-5 py-2 bg-[#7B2438] text-white rounded-lg text-sm font-bold hover:bg-rose-900 disabled:opacity-50 transition"
          >
            ຄົ້ນຫາຫ້ອງວ່າງ
          </button>
          {filtered && (
            <button
              type="button" onClick={handleReset}
              className="px-4 py-2 border border-rose-300 rounded-lg text-sm text-[#7B2438] hover:bg-rose-50 transition"
            >
              ລີເຊັດ
            </button>
          )}
        </form>

        {filtered && !loading && (
          <p className="text-sm text-gray-500 mb-4">
            ວ່າງໃນຊ່ວງ {date} ເວລາ {startTime}–{endTime}:{' '}
            <strong className="text-[#7B2438]">{availCount} ຫ້ອງ</strong>
          </p>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center text-gray-400 py-20">ບໍ່ພົບຫ້ອງ</div>
        ) : (
          <div className="flex flex-col gap-5">
            {rooms.map((room) => (
              <RoomCard key={room.r_id} room={room} onBook={handleBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
