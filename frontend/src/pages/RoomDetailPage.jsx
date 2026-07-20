import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMicrophone, FaUser, FaCoins, FaBuilding, FaStar, FaMagic, FaClipboardList } from 'react-icons/fa';
import api from '../api/axios';

function StarRow({ rating }) {
  return (
    <span className="text-yellow-400 text-base">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/rooms/${id}`),
      api.get(`/reviews/room/${id}`),
    ])
      .then(([rRoom, rReviews]) => {
        setRoom(rRoom.data);
        setReviews(rReviews.data.reviews || []);
        setAvgRating(rReviews.data.average_rating);
      })
      .catch(() => setError('ບໍ່ພົບຂໍ້ມູນຫ້ອງ'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = () => {
    navigate(`/booking?room_id=${id}`);
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>;
  if (error || !room) return (
    <div className="flex flex-col items-center py-20 gap-4">
      <p className="text-red-500">{error || 'ບໍ່ພົບຫ້ອງ'}</p>
      <button onClick={() => navigate('/rooms')} className="text-[#7B2438] underline text-sm">ກັບໄປຫ້ອງທັງໝົດ</button>
    </div>
  );

  const isAvail = room.status === 'available';
  const isMaint = room.status === 'maintenance';
  let badge, badgeCls;
  if (isAvail)      { badge = 'ວ່າງ';       badgeCls = 'bg-green-500 text-white'; }
  else if (isMaint) { badge = 'ຊ່ອມບຳລຸງ'; badgeCls = 'bg-yellow-500 text-white'; }
  else              { badge = 'ບໍ່ວ່າງ';    badgeCls = 'bg-red-500 text-white'; }

  return (
    <div className="relative min-h-screen pb-28">
      <img src="/images/hero.jpeg" alt="" className="fixed inset-0 w-full h-full object-cover -z-10" />
      <div className="fixed inset-0 bg-black/60 -z-10" />
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Back */}
        <button
          onClick={() => navigate('/rooms')}
          className="text-sm text-white mb-4 hover:underline flex items-center gap-1 drop-shadow"
        >
          <FaArrowLeft /> ກັບໄປຫ້ອງທັງໝົດ
        </button>

        {/* Images — 2 ช่อง */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[room.image_url, room.image_url2].map((url, i) => (
            <div key={i} className="relative bg-gray-200 rounded-2xl overflow-hidden" style={{ paddingBottom: '62%' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-1">
                {url ? (
                  <img src={url} alt={`ຫ້ອງ ${room.room_number} ຮູບ ${i+1}`} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <FaMicrophone className="text-3xl" />
                    <span className="text-xs">ຮູບ {i+1}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-rose-100">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-bold text-[#7B2438]">ຫ້ອງ {room.room_number}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{room.roomType?.name}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${badgeCls}`}>{badge}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FaUser className="text-lg" />
              <div>
                <p className="text-xs text-gray-400">ຮອງຮັບ</p>
                <p className="font-semibold">{room.roomType?.capacity} ທ່ານ</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaCoins className="text-lg" />
              <div>
                <p className="text-xs text-gray-400">ລາຄາ</p>
                <p className="font-semibold text-[#7B2438]">฿{Number(room.roomType?.price_per_hour).toLocaleString()}/ຊົ່ວໂມງ</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaBuilding className="text-lg" />
              <div>
                <p className="text-xs text-gray-400">ຊັ້ນ</p>
                <p className="font-semibold">{room.floor}</p>
              </div>
            </div>
            {avgRating && (
              <div className="flex items-center gap-2 text-gray-600">
                <FaStar className="text-lg text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-400">ຄະແນນສະເລ່ຍ</p>
                  <p className="font-semibold">{avgRating} / 5 ({reviews.length} ລີວິວ)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amenities */}
        {room.roomType?.amenities && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-rose-100">
            <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><FaMagic /> ສິ່ງອຳນວຍຄວາມສະດວກ</h2>
            <p className="text-sm text-gray-600">{room.roomType.amenities}</p>
          </div>
        )}

        {/* Description */}
        {room.roomType?.description && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-rose-100">
            <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><FaClipboardList /> ລາຍລະອຽດ</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{room.roomType.description}</p>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-rose-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">ລີວິວ ({reviews.length})</h2>
            {avgRating && (
              <div className="flex items-center gap-2">
                <StarRow rating={Math.round(avgRating)} />
                <span className="text-sm font-bold text-[#7B2438]">{avgRating}</span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">ຍັງບໍ່ມີລີວິວ</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((r) => (
                <div key={r.re_id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRow rating={r.rating} />
                    <span className="text-xs text-gray-400">
                      {r.user?.customer
                        ? [r.user.customer.fname, r.user.customer.lname].filter(Boolean).join(' ')
                        : 'ລູກຄ້າ'}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Book Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400">ລາຄາເລີ່ມຕົ້ນ</p>
            <p className="font-bold text-[#7B2438] text-lg">฿{Number(room.roomType?.price_per_hour).toLocaleString()}<span className="text-sm font-normal text-gray-400">/ຊົ່ວໂມງ</span></p>
          </div>
          <button
            onClick={handleBook}
            disabled={!isAvail}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition shadow ${
              isAvail
                ? 'bg-[#7B2438] text-white hover:bg-rose-900'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAvail ? 'ຈອງຫ້ອງນີ້' : badge}
          </button>
        </div>
      </div>
    </div>
  );
}
