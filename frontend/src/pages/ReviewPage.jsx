import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)}
          className={`text-3xl transition ${star <= value ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}>
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ booking, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('ກະລຸນາໃຫ້ຄະແນນ'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/reviews', { booking_id: booking.id, rating, comment });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="mb-4">
        <p className="font-bold text-gray-800">ຫ້ອງ {booking.room?.room_number}</p>
        <p className="text-sm text-gray-500">{booking.room?.roomType?.name}</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-gray-600 mb-2 block">ຄວາມພໍໃຈ</label>
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {['', 'ຮ້າຍຫຼາຍ', 'ຮ້າຍ', 'ປານກາງ', 'ດີ', 'ດີຫຼາຍ'][rating]}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">ຄຳຄິດເຫັນ (ບໍ່ບັງຄັບ)</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            placeholder="ແຊຣ໌ປະສົບການຂອງທ່ານ..."
            className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="py-3 bg-[#7B2438] text-white rounded-xl font-semibold hover:bg-rose-900 disabled:opacity-50">
          {loading ? 'ກຳລັງສົ່ງ...' : 'ສົ່ງລີວິວ'}
        </button>
      </form>
    </div>
  );
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/bookings/my'),
      api.get('/reviews/my'),
    ]).then(([bRes, rRes]) => {
      setBookings(bRes.data);
      setReviews(rRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(fetchData, [fetchData]);

  const handleReviewed = () => {
    setToast('ຂອບໃຈສຳລັບລີວິວ!');
    setTimeout(() => setToast(''), 3000);
    fetchData();
  };

  const reviewedIds = new Set(reviews.map((r) => r.booking_id));
  const reviewable = bookings.filter((b) => b.status === 'completed' && !reviewedIds.has(b.id));

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>;
  }

  return (
    <div className="min-h-screen bg-green-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/my-bookings')} className="text-[#7B2438] hover:text-rose-900 text-xl">←</button>
          <h1 className="text-2xl font-bold text-[#7B2438]">ລີວິວ</h1>
        </div>

        {toast && (
          <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm font-semibold">
            {toast}
          </div>
        )}

        {reviewable.length === 0 && reviews.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">ຍັງບໍ່ມີການຈອງທີ່ສາມາດລີວິວໄດ້</p>
            <p className="text-sm mt-1">ລີວິວໄດ້ຫຼັງ check-out ສຳເລັດ</p>
          </div>
        )}

        {reviewable.length > 0 && (
          <div className="flex flex-col gap-4 mb-8">
            <h2 className="font-semibold text-gray-700">ລໍລີວິວ ({reviewable.length})</h2>
            {reviewable.map((b) => (
              <ReviewForm key={b.id} booking={b} onSuccess={handleReviewed} />
            ))}
          </div>
        )}

        {reviews.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-3">ລີວິວທີ່ຂຽນແລ້ວ ({reviews.length})</h2>
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 text-lg">
                      {'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      ຫ້ອງ {r.room?.room_number || '-'}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                  {r.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
