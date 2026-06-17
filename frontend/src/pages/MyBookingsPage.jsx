import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

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
    if (!file || !amount) { setError('ກະລຸນາເລືອກໄຟລ໌ ແລະ ລະບຸຈຳນວນເງິນ'); return; }
    const fd = new FormData();
    fd.append('slip', file);
    fd.append('deposit_amount', amount);
    setUploading(true);
    try {
      const res = await api.patch(`/bookings/${booking.b_id}/deposit`, fd);
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'ອັບໂຫຼດລົ້ມເຫຼວ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-yellow-50 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-yellow-800">ອັບໂຫຼດສະລິບມັດຈຳ</p>
      <div className="flex gap-2 items-center">
        <input
          type="number" min="1" placeholder={`ແນະນຳ ฿${Number(suggested).toLocaleString()} (30%)`}
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm flex-1"
        />
        <span className="text-xs text-gray-500">ບາດ</span>
      </div>
      <div className="flex gap-2 items-center">
        <button type="button" onClick={() => fileRef.current.click()}
          className="text-sm border border-dashed border-yellow-400 rounded-lg px-3 py-1.5 text-yellow-700 hover:bg-yellow-100">
          {file ? file.name : 'ເລືອກໄຟລ໌ສະລິບ'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => setFile(e.target.files[0])} />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button type="submit" disabled={uploading}
        className="py-2 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50">
        {uploading ? 'ກຳລັງອັບໂຫຼດ...' : 'ສົ່ງສະລິບມັດຈຳ'}
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
    if (!file) { setError('ກະລຸນາເລືອກໄຟລ໌ສະລິບ'); return; }
    const fd = new FormData();
    fd.append('slip', file);
    fd.append('booking_id', booking.b_id);
    fd.append('amount', remaining.toFixed(2));
    fd.append('method', method);
    setUploading(true);
    try {
      const res = await api.post('/payments', fd);
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'ອັບໂຫຼດລົ້ມເຫຼວ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-green-50 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-green-800">ຊຳລະເງິນສ່ວນທີ່ເຫຼືອ</p>
      <div className="flex justify-between text-sm text-gray-600">
        <span>ລາຄາລວມ</span><span>฿{Number(booking.total_price).toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>ມັດຈຳແລ້ວ</span><span>฿{Number(booking.deposit_amount || 0).toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-green-700 border-t pt-2">
        <span>ຍອດທີ່ຕ້ອງຊຳລະ</span><span>฿{remaining.toLocaleString()}</span>
      </div>
      <select value={method} onChange={(e) => setMethod(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm">
        <option value="transfer">ໂອນເງິນ</option>
        <option value="cash">ເງິນສົດ</option>
      </select>
      <div className="flex gap-2 items-center">
        <button type="button" onClick={() => fileRef.current.click()}
          className="text-sm border border-dashed border-green-400 rounded-lg px-3 py-1.5 text-green-700 hover:bg-green-100">
          {file ? file.name : 'ເລືອກໄຟລ໌ສະລິບ'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => setFile(e.target.files[0])} />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button type="submit" disabled={uploading}
        className="py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
        {uploading ? 'ກຳລັງອັບໂຫຼດ...' : 'ສົ່ງສະລິບຊຳລະເງິນ'}
      </button>
    </form>
  );
}

function Receipt({ booking }) {
  const finalPayment = booking.payments?.find((p) => p.type === 'final' && p.status === 'confirmed');
  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm">
      <p className="font-semibold text-gray-700">ໃບບິນ</p>
      <div className="flex justify-between text-gray-600">
        <span>ລາຄາລວມ</span><span>฿{Number(booking.total_price).toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>ມັດຈຳ</span><span>฿{Number(booking.deposit_amount || 0).toLocaleString()}</span>
      </div>
      {finalPayment && (
        <div className="flex justify-between text-gray-600">
          <span>ຊຳລະສ່ວນທີ່ເຫຼືອ</span><span>฿{Number(finalPayment.amount).toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
        <span>ລວມທັງໝົດ</span><span>฿{Number(booking.total_price).toLocaleString()}</span>
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
      alert(`ຕໍ່ເວລາສຳເລັດ! ຄ່າໃຊ້ຈ່າຍເພີ່ມ ฿${Number(res.data.extra_price).toLocaleString()}`);
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
        <label className="text-sm text-gray-600">ຈຳນວນຊົ່ວໂມງທີ່ຕ້ອງການຕໍ່</label>
        <input type="number" min="1" max="12" value={hours} onChange={(e) => setHours(Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm w-20 text-center" />
        <span className="text-sm text-gray-500">ຊມ.</span>
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
  const hasDepositSlip = !!booking.deposit_slip;
  const hasPendingFinalPayment = booking.payments?.some((p) => p.type === 'final' && p.status === 'pending');
  const hasConfirmedFinalPayment = booking.payments?.some((p) => p.type === 'final' && p.status === 'confirmed');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
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

  const doCheckout = async () => {
    if (!window.confirm('ຢືນຢັນວ່າທ່ານອອກຈາກຫ້ອງແລ້ວ?')) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/bookings/${booking.b_id}/checkout`);
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
        <span className="font-bold text-[#7B2438] text-base">฿{Number(booking.total_price).toLocaleString()}</span>
      </div>

      {booking.note && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">{booking.note}</p>
      )}

      {booking.status === 'pending' && !hasDepositSlip && (
        <>
          <button onClick={() => setShowDeposit((v) => !v)}
            className="text-sm py-2 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600">
            {showDeposit ? 'ຊ່ອນ' : 'ອັບໂຫຼດສະລິບມັດຈຳ'}
          </button>
          {showDeposit && (
            <DepositUploadForm booking={booking} onSuccess={(updated) => { onUpdate(updated); setShowDeposit(false); }} />
          )}
        </>
      )}

      {booking.status === 'pending' && hasDepositSlip && (
        <div className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
          ສົ່ງສະລິບມັດຈຳແລ້ວ — ລໍພະນັກງານຢືນຢັນ
        </div>
      )}

      {booking.status === 'confirmed' && (
        <button onClick={doCheckin} disabled={actionLoading}
          className="text-sm py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
          {actionLoading ? 'ກຳລັງດຳເນີນການ...' : 'ຂ້ອຍມາເຖິງແລ້ວ (Check-in)'}
        </button>
      )}

      {booking.status === 'checking_in' && (
        <div className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
          ແຈ້ງ check-in ແລ້ວ — ລໍພະນັກງານຢືນຢັນ
        </div>
      )}

      {booking.status === 'checked_in' && (
        <>
          {!hasPendingFinalPayment && !hasConfirmedFinalPayment && (
            <>
              <button onClick={() => setShowPayment((v) => !v)}
                className="text-sm py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
                {showPayment ? 'ຊ່ອນ' : 'ຊຳລະເງິນສ່ວນທີ່ເຫຼືອ'}
              </button>
              {showPayment && (
                <FinalPaymentForm booking={booking} onSuccess={() => { onUpdate({ ...booking, payments: [...(booking.payments || []), { type: 'final', status: 'pending' }] }); setShowPayment(false); }} />
              )}
            </>
          )}
          {hasPendingFinalPayment && (
            <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              ສົ່ງສະລິບຊຳລະເງິນແລ້ວ — ລໍພະນັກງານຢືນຢັນ
            </div>
          )}
          <button onClick={() => setShowExtend((v) => !v)}
            className="text-sm py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200">
            {showExtend ? 'ຊ່ອນ' : 'ຕໍ່ເວລາການໃຊ້ຫ້ອງ'}
          </button>
          {showExtend && <ExtendForm booking={booking} onSuccess={(updated) => { onUpdate(updated); setShowExtend(false); }} />}
          <button onClick={doCheckout} disabled={actionLoading}
            className="text-sm py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50">
            {actionLoading ? 'ກຳລັງດຳເນີນການ...' : 'ອອກຈາກຫ້ອງ (Check-out)'}
          </button>
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

  useEffect(() => {
    api.get('/bookings/my')
      .then((res) => setBookings(res.data))
      .catch((err) => setError(err.response?.data?.message || 'ໂຫຼດຂໍ້ມູນລົ້ມເຫຼວ'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated) => {
    setBookings((prev) => prev.map((b) => (b.b_id === updated.b_id ? updated : b)));
  };

  return (
    <div className="min-h-screen bg-green-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#7B2438]">ການຈອງຂອງຂ້ອຍ</h1>
          <button onClick={() => navigate('/rooms')} className="text-sm text-[#7B2438] hover:underline font-semibold">
            + ຈອງຫ້ອງໃໝ່
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
            <span className="text-5xl">📋</span>
            <p>ຍັງບໍ່ມີປະຫວັດການຈອງ</p>
            <button onClick={() => navigate('/rooms')} className="text-[#7B2438] underline text-sm">
              ເບິ່ງຫ້ອງທີ່ວ່າງ
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((b) => (
              <BookingCard key={b.b_id} booking={b} isNew={b.b_id === newBookingId} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
