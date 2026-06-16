import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LAO = {
  pending: 'ລໍການຢືນຢັນ',
  confirmed: 'ຢືນຢັນແລ້ວ',
  checking_in: 'ລໍ check-in',
  checked_in: 'ເຊັກອິນແລ້ວ',
  checking_out: 'ລໍ check-out',
  completed: 'ສຳເລັດ',
  cancelled: 'ຍົກເລີກ',
};

// ─── P6.1 Bookings Report ────────────────────────────────────────────────────
function BookingsReport() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/reports/bookings', { params: { date } })
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(load, [load]);

  return (
    <div>
      <div className="flex gap-3 items-center mb-4">
        <label className="text-sm text-gray-600">ວັນທີ</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm" />
        <span className="text-sm text-gray-400">({data.length} ລາຍການ)</span>
      </div>
      {loading ? <p className="text-gray-400 text-sm">ກຳລັງໂຫຼດ...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b text-xs">
              <th className="pb-2 pr-3">ຫ້ອງ</th><th className="pb-2 pr-3">ລູກຄ້າ</th>
              <th className="pb-2 pr-3">ເລີ່ມ</th><th className="pb-2 pr-3">ສິ້ນສຸດ</th>
              <th className="pb-2 pr-3">ສະຖານະ</th><th className="pb-2 text-right">ລາຄາ</th>
            </tr></thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{b.room?.room_number}</td>
                  <td className="py-2 pr-3 text-gray-600">{b.user?.customer?.name}</td>
                  <td className="py-2 pr-3 text-gray-500 text-xs">{formatDateTime(b.start_time)}</td>
                  <td className="py-2 pr-3 text-gray-500 text-xs">{formatDateTime(b.end_time)}</td>
                  <td className="py-2 pr-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{STATUS_LAO[b.status] || b.status}</span></td>
                  <td className="py-2 text-right font-semibold text-[#7B2438]">฿{Number(b.total_price).toLocaleString()}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">ບໍ່ມີຂໍ້ມູນ</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── P6.2 Revenue Report ─────────────────────────────────────────────────────
function RevenueReport() {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/reports/revenue', { params: { month } })
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(load, [load]);

  return (
    <div>
      <div className="flex gap-3 items-center mb-4">
        <label className="text-sm text-gray-600">ເດືອນ</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm" />
      </div>
      {loading ? <p className="text-gray-400 text-sm">ກຳລັງໂຫຼດ...</p> : data && (
        <>
          <div className="bg-rose-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-500">ລາຍຮັບລວມເດືອນນີ້</p>
            <p className="text-3xl font-bold text-[#7B2438]">฿{Number(data.total_revenue).toLocaleString()}</p>
          </div>
          {data.by_day.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">ລາຍຮັບແຍກຕາມວັນ</p>
              <div className="flex flex-col gap-1">
                {data.by_day.map((d) => (
                  <div key={d.date} className="flex justify-between items-center text-sm py-1 border-b">
                    <span className="text-gray-500">{formatDate(d.date)}</span>
                    <span className="font-semibold text-gray-700">฿{Number(d.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400">{data.payments.length} ລາຍການຊຳລະເງິນ</p>
        </>
      )}
    </div>
  );
}

// ─── P6.3 Rooms Report ────────────────────────────────────────────────────────
function RoomsReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/rooms').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h3 className="font-semibold text-gray-600 mb-3">ສະຖິຕິຫ້ອງ (ຮຽງຕາມຄວາມນິຍົມ)</h3>
      {loading ? <p className="text-gray-400 text-sm">ກຳລັງໂຫຼດ...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b text-xs">
              <th className="pb-2 pr-3">ຫ້ອງ</th><th className="pb-2 pr-3">ປະເພດ</th>
              <th className="pb-2 pr-3 text-center">ຈອງທັງໝົດ</th><th className="pb-2 pr-3 text-center">ສຳເລັດ</th>
              <th className="pb-2 text-right">ລາຍຮັບລວມ</th>
            </tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{r.room_number}</td>
                  <td className="py-2 pr-3 text-gray-500">{r.roomType?.name}</td>
                  <td className="py-2 pr-3 text-center">{r.total_bookings}</td>
                  <td className="py-2 pr-3 text-center text-green-600 font-semibold">{r.completed_bookings}</td>
                  <td className="py-2 text-right font-semibold text-[#7B2438]">฿{Number(r.revenue).toLocaleString()}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">ບໍ່ມີຂໍ້ມູນ</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── P6.4 Customers Report ────────────────────────────────────────────────────
function CustomersReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/customers').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h3 className="font-semibold text-gray-600 mb-3">ຂໍ້ມູນລູກຄ້າ ({data.length} ຄົນ)</h3>
      {loading ? <p className="text-gray-400 text-sm">ກຳລັງໂຫຼດ...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b text-xs">
              <th className="pb-2 pr-3">ຊື່</th><th className="pb-2 pr-3">ອີເມລ</th>
              <th className="pb-2 pr-3">ໂທ</th><th className="pb-2 pr-3 text-center">ຈອງທັງໝົດ</th>
              <th className="pb-2 pr-3 text-center">ສຳເລັດ</th><th className="pb-2 text-right">ຍອດໃຊ້ຈ່າຍ</th>
            </tr></thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{u.name}</td>
                  <td className="py-2 pr-3 text-gray-500">{u.email}</td>
                  <td className="py-2 pr-3 text-gray-500">{u.phone || '-'}</td>
                  <td className="py-2 pr-3 text-center">{u.total_bookings}</td>
                  <td className="py-2 pr-3 text-center text-green-600 font-semibold">{u.completed_bookings}</td>
                  <td className="py-2 text-right font-semibold text-[#7B2438]">฿{Number(u.total_spent).toLocaleString()}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">ບໍ່ມີຂໍ້ມູນ</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main ReportsPage ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'bookings', label: 'ການຈອງປະຈຳວັນ (6.1)' },
  { key: 'revenue', label: 'ລາຍຮັບ (6.2)' },
  { key: 'rooms', label: 'ສະຖິຕິຫ້ອງ (6.3)' },
  { key: 'customers', label: 'ຂໍ້ມູນລູກຄ້າ (6.4)' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('bookings');

  return (
    <div className="min-h-screen bg-green-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#7B2438] mb-6">ລາຍງານ (P6)</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.key ? 'bg-[#7B2438] text-white' : 'bg-white text-gray-600 border hover:bg-rose-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {tab === 'bookings' && <BookingsReport />}
          {tab === 'revenue' && <RevenueReport />}
          {tab === 'rooms' && <RoomsReport />}
          {tab === 'customers' && <CustomersReport />}
        </div>
      </div>
    </div>
  );
}
