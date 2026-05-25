import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const STATUS_LABEL = {
  available: { text: 'ว่าง', cls: 'bg-green-100 text-green-700' },
  occupied: { text: 'ไม่ว่าง', cls: 'bg-red-100 text-red-700' },
  maintenance: { text: 'ซ่อมบำรุง', cls: 'bg-yellow-100 text-yellow-700' },
};

function RoomCard({ room, filterParams, onBook }) {
  const badge = room.isAvailable
    ? STATUS_LABEL.available
    : room.status === 'maintenance'
    ? STATUS_LABEL.maintenance
    : STATUS_LABEL.occupied;

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="h-40 bg-gray-100 overflow-hidden">
        {room.image_url ? (
          <img src={room.image_url} alt={room.room_number} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-4xl">🎤</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">ห้อง {room.room_number}</h3>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.cls}`}>
            {badge.text}
          </span>
        </div>
        <p className="text-sm text-gray-500">{room.roomType?.name}</p>
        <div className="flex gap-4 text-sm text-gray-600 mt-1">
          <span>ชั้น {room.floor}</span>
          <span>จุ {room.roomType?.capacity} คน</span>
        </div>
        <p className="text-purple-600 font-semibold mt-1">
          ฿{Number(room.roomType?.price_per_hour).toLocaleString()} / ชม.
        </p>
        {room.roomType?.amenities && (
          <p className="text-xs text-gray-400 truncate">{room.roomType.amenities}</p>
        )}
        <button
          onClick={() => onBook(room)}
          disabled={!room.isAvailable}
          className="mt-auto py-2 rounded-xl text-sm font-semibold transition
            disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
            bg-purple-600 text-white hover:bg-purple-700"
        >
          {room.isAvailable ? 'จองห้องนี้' : 'ไม่ว่าง'}
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
      setError(err.response?.data?.message || 'โหลดข้อมูลล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

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
    const params = new URLSearchParams({ room_id: room.id });
    if (filtered && date && startTime && endTime) {
      params.append('date', date);
      params.append('start_time', startTime);
      params.append('end_time', endTime);
    }
    navigate(`/booking?${params.toString()}`);
  };

  const availableCount = rooms.filter((r) => r.isAvailable).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">ห้องคาราโอเกะทั้งหมด</h1>

        {/* Filter */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-wrap gap-3 items-end"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">วันที่</label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">เวลาเริ่ม</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">เวลาสิ้นสุด</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!date || !startTime || !endTime}
            className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold
              hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ค้นหาห้องว่าง
          </button>
          {filtered && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              รีเซ็ต
            </button>
          )}
        </form>

        {filtered && !loading && (
          <p className="text-sm text-gray-500 mb-4">
            ว่างในช่วง {date} เวลา {startTime}–{endTime}: <strong>{availableCount} ห้อง</strong>
          </p>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">กำลังโหลด...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center text-gray-400 py-20">ไม่พบห้อง</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                filterParams={{ date, startTime, endTime }}
                onBook={handleBook}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
