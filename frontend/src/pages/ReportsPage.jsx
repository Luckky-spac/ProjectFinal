import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaChartBar, FaHome } from 'react-icons/fa';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatUSD } from '../utils/currency';

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
                <tr key={b.b_id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{b.room?.room_number}</td>
                  <td className="py-2 pr-3 text-gray-600">{[b.user?.customer?.fname, b.user?.customer?.lname].filter(Boolean).join(' ')}</td>
                  <td className="py-2 pr-3 text-gray-500 text-xs">{formatDateTime(b.start_time)}</td>
                  <td className="py-2 pr-3 text-gray-500 text-xs">{formatDateTime(b.end_time)}</td>
                  <td className="py-2 pr-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{STATUS_LAO[b.status] || b.status}</span></td>
                  <td className="py-2 text-right font-semibold text-[#7B2438]">{formatUSD(b.total_price)}</td>
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
            <p className="text-3xl font-bold text-[#7B2438]">{formatUSD(data.total_revenue)}</p>
          </div>
          {data.by_day.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">ລາຍຮັບແຍກຕາມວັນ</p>
              <div className="flex flex-col gap-1">
                {data.by_day.map((d) => (
                  <div key={d.date} className="flex justify-between items-center text-sm py-1 border-b">
                    <span className="text-gray-500">{formatDate(d.date)}</span>
                    <span className="font-semibold text-gray-700">{formatUSD(d.amount)}</span>
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
                <tr key={r.r_id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{r.room_number}</td>
                  <td className="py-2 pr-3 text-gray-500">{r.roomType?.name}</td>
                  <td className="py-2 pr-3 text-center">{r.total_bookings}</td>
                  <td className="py-2 pr-3 text-center text-green-600 font-semibold">{r.completed_bookings}</td>
                  <td className="py-2 text-right font-semibold text-[#7B2438]">{formatUSD(r.revenue)}</td>
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
                <tr key={u.u_id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{[u.fname, u.lname].filter(Boolean).join(' ')}</td>
                  <td className="py-2 pr-3 text-gray-500">{u.email}</td>
                  <td className="py-2 pr-3 text-gray-500">{u.phone || '-'}</td>
                  <td className="py-2 pr-3 text-center">{u.total_bookings}</td>
                  <td className="py-2 pr-3 text-center text-green-600 font-semibold">{u.completed_bookings}</td>
                  <td className="py-2 text-right font-semibold text-[#7B2438]">{formatUSD(u.total_spent)}</td>
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
];

const SIDEBAR_NAV = [
  { icon: FaClipboardList, label: 'ການຈອງ', path: '/staff' },
  { icon: FaChartBar, label: 'ລາຍງານ', path: '/reports' },
];

const ADMIN_NAV = [
  { icon: FaHome, label: 'ຫ້ອງ / ສະມາຊິກ', path: '/admin' },
];

export default function ReportsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('bookings');

  return (
    <div className="min-h-screen bg-green-50 flex">

      {/* ─── Sidebar ─── */}
      <aside className="w-52 bg-[#7B2438] min-h-screen shrink-0 flex flex-col">
        <div className="px-5 py-5 border-b border-rose-700">
          <p className="text-white font-bold text-sm tracking-wide">DASHBOARD</p>
          <p className="text-rose-300 text-xs mt-0.5">ລະບົບຈັດການ</p>
        </div>
        <nav className="flex flex-col py-2">
          {SIDEBAR_NAV.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-left px-5 py-3 text-sm font-medium transition border-l-4 flex items-center gap-2 ${
                item.path === '/reports'
                  ? 'bg-rose-900 text-white border-white'
                  : 'text-rose-300 border-transparent hover:bg-rose-900 hover:text-white'
              }`}
            >
              <item.icon /> {item.label}
            </button>
          ))}
          {isAdmin && (
            <>
              <div className="border-t border-rose-700 mt-2 pt-2" />
              {ADMIN_NAV.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="text-left px-5 py-3 text-sm font-medium text-rose-300 border-l-4 border-transparent hover:bg-rose-900 hover:text-white transition flex items-center gap-2"
                >
                  <item.icon /> {item.label}
                </button>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 py-8 px-6">
        <div className="max-w-5xl">
          <h1 className="text-2xl font-bold text-[#7B2438] mb-6">ລາຍງານ</h1>

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
          </div>
        </div>
      </div>
    </div>
  );
}
