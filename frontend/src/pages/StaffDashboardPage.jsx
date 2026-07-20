import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTools, FaChartBar, FaClipboardList, FaUser } from 'react-icons/fa';
import PasswordInput from '../components/PasswordInput';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending: { text: 'ລໍການຢືນຢັນ', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { text: 'ຢືນຢັນແລ້ວ', cls: 'bg-blue-100 text-blue-700' },
  checking_in: { text: 'ລໍຢືນຢັນ check-in', cls: 'bg-indigo-100 text-indigo-700' },
  checked_in: { text: 'ເຊັກອິນແລ້ວ', cls: 'bg-green-100 text-green-700' },
  checking_out: { text: 'ລໍຢືນຢັນ check-out', cls: 'bg-orange-100 text-orange-600' },
  completed: { text: 'ສຳເລັດ', cls: 'bg-gray-100 text-gray-600' },
  cancelled: { text: 'ຍົກເລີກ', cls: 'bg-red-100 text-red-500' },
};

const TABS = [
  { key: '', label: 'ທັງໝົດ' },
  { key: 'confirmed', label: 'ຢືນຢັນແລ້ວ' },
  { key: 'checking_in', label: 'ລໍ check-in' },
  { key: 'checked_in', label: 'ເຊັກອິນແລ້ວ' },
  { key: 'completed', label: 'ສຳເລັດ' },
  { key: 'cancelled', label: 'ຍົກເລີກ' },
];

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ActionButton({ label, color, onClick, disabled }) {
  const colors = {
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    purple: 'bg-[#7B2438] hover:bg-rose-900 text-white',
    gray: 'bg-gray-500 hover:bg-gray-600 text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${colors[color]}`}
    >
      {label}
    </button>
  );
}

function RoomTransferForm({ booking, onSuccess, onCancel }) {
  const [rooms, setRooms] = useState([]);
  const [toRoomId, setToRoomId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/rooms').then((r) =>
      setRooms(r.data.filter((rm) => rm.status === 'available' && rm.r_id !== booking.r_id))
    ).catch(() => {});
  }, [booking.r_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toRoomId) return;
    setLoading(true);
    try {
      const res = await api.patch(`/bookings/${booking.b_id}/transfer`, { to_room_id: Number(toRoomId) });
      onSuccess(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-rose-50 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-[#7B2438]">ຍ້າຍຫ້ອງ</p>
      <select value={toRoomId} onChange={(e) => setToRoomId(e.target.value)} required
        className="border rounded-lg px-3 py-2 text-sm">
        <option value="">-- ເລືອກຫ້ອງໃໝ່ (ວ່າງ) --</option>
        {rooms.map((r) => <option key={r.r_id} value={r.r_id}>ຫ້ອງ {r.room_number} — {r.roomType?.name}</option>)}
      </select>
      <div className="flex gap-2">
        <button type="submit" disabled={loading || !toRoomId}
          className="text-xs px-3 py-1.5 bg-[#7B2438] text-white rounded-lg font-semibold disabled:opacity-40">
          {loading ? 'ກຳລັງຍ້າຍ...' : 'ຢືນຢັນຍ້າຍຫ້ອງ'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg font-semibold">
          ຍົກເລີກ
        </button>
      </div>
    </form>
  );
}

function BookingRow({ booking, onUpdate }) {
  const cfg = STATUS_CONFIG[booking.status] || { text: booking.status, cls: 'bg-gray-100 text-gray-500' };
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const pendingDepositPayment = booking.payments?.find((p) => p.type === 'deposit' && p.status === 'pending');
  const pendingFinalPayment = booking.payments?.find((p) => p.type === 'final' && p.status === 'pending');

  const changeStatus = async (status) => {
    setLoading(true);
    try {
      const res = await api.patch(`/bookings/${booking.b_id}/status`, { status });
      onUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const confirmCheckin = async () => {
    setLoading(true);
    try {
      const res = await api.patch(`/bookings/${booking.b_id}/checkin/confirm`);
      onUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const confirmCheckout = async () => {
    setLoading(true);
    try {
      const res = await api.patch(`/bookings/${booking.b_id}/checkout/confirm`);
      onUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (payId) => {
    setLoading(true);
    try {
      const res = await api.patch(`/payments/${payId}/confirm`);
      onUpdate(res.data.booking);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const rejectPayment = async (payId, booking) => {
    setLoading(true);
    try {
      await api.patch(`/payments/${payId}/reject`);
      onUpdate({ ...booking, payments: booking.payments.map((p) => p.pay_id === payId ? { ...p, status: 'rejected' } : p) });
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">ຫ້ອງ {booking.room?.room_number}</span>
            <span className="text-xs text-gray-400">{booking.room?.roomType?.name}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.text}</span>
            {pendingDepositPayment && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                ລໍຢືນຢັນ cash ມັດຈຳ
              </span>
            )}
            {pendingFinalPayment && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                ລໍຢືນຢັນ cash ຊຳລະ
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {[booking.user?.customer?.fname, booking.user?.customer?.lname].filter(Boolean).join(' ')} · {formatDateTime(booking.start_time)} – {formatDateTime(booking.end_time)}
          </p>
        </div>
        <span className="text-sm font-bold text-[#7B2438] whitespace-nowrap">
          ฿{Number(booking.total_price).toLocaleString()}
        </span>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div><span className="text-gray-400">ຜູ້ຈອງ: </span>{[booking.user?.customer?.fname, booking.user?.customer?.lname].filter(Boolean).join(' ')}</div>
            <div><span className="text-gray-400">ໂທ: </span>{booking.user?.customer?.phone || '-'}</div>
            <div><span className="text-gray-400">ຜູ້ເຂົ້າໃຊ້: </span>{booking.guests} ຄົນ</div>
            <div><span className="text-gray-400">ມັດຈຳ: </span>฿{Number(booking.deposit_amount || 0).toLocaleString()}</div>
          </div>

          {/* Payment info */}
          {booking.payments?.length > 0 && (
            <div className="text-xs text-gray-500 flex flex-col gap-1">
              {booking.payments.map((p) => (
                <div key={p.pay_id} className="flex justify-between bg-white rounded-lg px-3 py-1.5 border">
                  <span>{p.type === 'deposit' ? 'ມັດຈຳ' : 'ຊຳລະສ່ວນທີ່ເຫຼືອ'} ({p.method})</span>
                  <span className={p.status === 'confirmed' ? 'text-green-600 font-semibold' : p.status === 'rejected' ? 'text-red-500' : 'text-yellow-600'}>
                    ฿{Number(p.amount).toLocaleString()} — {p.status === 'confirmed' ? 'ຢືນຢັນ' : p.status === 'rejected' ? 'ປະຕິເສດ' : 'ລໍຢືນຢັນ'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ສະຫຼຸບລາຄາ ກ່ອນ check-out */}
          {['checked_in', 'checking_out'].includes(booking.status) && (() => {
            const total = parseFloat(booking.total_price || 0);
            const deposit = parseFloat(booking.deposit_amount || 0);
            const remaining = total - deposit;
            return (
              <div className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-3 flex flex-col gap-1">
                <p className="text-xs font-bold text-orange-700 mb-1">ສະຫຼຸບລາຄາ</p>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>ລາຄາລວມ</span>
                  <span className="font-semibold">฿{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>ມັດຈຳທີ່ຈ່າຍແລ້ວ</span>
                  <span className="text-green-600 font-semibold">- ฿{deposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-orange-200 pt-1 mt-1">
                  <span className="text-orange-700">ຍັງຄ້າງຊຳລະ</span>
                  <span className="text-orange-700">฿{remaining.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {/* ຢືນຢັນ cash ມັດຈຳ */}
            {pendingDepositPayment && (
              <>
                <ActionButton label="ຢືນຢັນ cash ມັດຈຳ" color="blue" disabled={loading}
                  onClick={() => confirmPayment(pendingDepositPayment.pay_id)} />
                <ActionButton label="ປະຕິເສດ" color="red" disabled={loading}
                  onClick={() => rejectPayment(pendingDepositPayment.pay_id, booking)} />
              </>
            )}

            {/* check-in */}
            {booking.status === 'checking_in' && (
              <ActionButton label="ຢືນຢັນ Check-in" color="green" disabled={loading} onClick={confirmCheckin} />
            )}
            {booking.status === 'confirmed' && (
              <ActionButton label="Check-in (ພະນັກງານ)" color="green" disabled={loading} onClick={confirmCheckin} />
            )}

            {/* check-out */}
            {booking.status === 'checking_out' && (
              <ActionButton label="ຢືນຢັນ Check-out" color="purple" disabled={loading} onClick={confirmCheckout} />
            )}
            {booking.status === 'checked_in' && (
              <ActionButton label="Check-out (ພະນັກງານ)" color="purple" disabled={loading} onClick={confirmCheckout} />
            )}

            {/* ຢືນຢັນ cash ຊຳລະສ່ວນທີ່ເຫຼືອ */}
            {pendingFinalPayment && (
              <>
                <ActionButton label="ຢືນຢັນ cash ຊຳລະ" color="purple" disabled={loading}
                  onClick={() => confirmPayment(pendingFinalPayment.pay_id)} />
                <ActionButton label="ປະຕິເສດ" color="red" disabled={loading}
                  onClick={() => rejectPayment(pendingFinalPayment.pay_id, booking)} />
              </>
            )}

            {/* ຍ້າຍຫ້ອງ */}
            {['confirmed', 'checked_in', 'checking_in', 'checking_out'].includes(booking.status) && (
              <ActionButton label="ຍ້າຍຫ້ອງ" color="gray" disabled={loading}
                onClick={() => setShowTransfer((v) => !v)} />
            )}

            {/* ຍົກເລີກ */}
            {['pending', 'confirmed'].includes(booking.status) && (
              <ActionButton label="ຍົກເລີກການຈອງ" color="red" disabled={loading} onClick={() => {
                if (window.confirm('ຢືນຢັນຍົກເລີກການຈອງນີ້?')) changeStatus('cancelled');
              }} />
            )}
          </div>

          {showTransfer && (
            <RoomTransferForm
              booking={booking}
              onSuccess={(updated) => { onUpdate(updated); setShowTransfer(false); }}
              onCancel={() => setShowTransfer(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Member management helpers ────────────────────────────────────────────────
function Btn({ label, color = 'purple', onClick, disabled, small }) {
  const colors = {
    purple: 'bg-[#7B2438] hover:bg-rose-900 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    gray: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${small ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'} rounded-lg font-semibold transition disabled:opacity-40 ${colors[color]}`}>
      {label}
    </button>
  );
}

function Field({ label, name, value, onChange, type = 'text', required, options, ...rest }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}{required && ' *'}</label>
      {options ? (
        <select name={name} value={value} onChange={onChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'password' ? (
        <PasswordInput name={name} value={value} onChange={onChange} required={required}
          {...rest}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
      ) : (
        <input name={name} type={type} value={value} onChange={onChange} required={required}
          {...rest}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
      )}
    </div>
  );
}

const EMPTY_MEMBER = { fname: '', lname: '', email: '', password: '', phone: '', gender: '', birthday: '' };
const GENDER_LABEL = { male: 'ຊາຍ', female: 'ຍິງ', other: 'ອື່ນໆ' };

function MembersPanel() {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fname: '', lname: '', phone: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_MEMBER);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    api.get('/users').then((r) => setUsers(r.data)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const startEdit = (u) => {
    setEditing(u.u_id);
    setAdding(false);
    setViewing(null);
    setForm({ fname: u.customer?.fname || '', lname: u.customer?.lname || '', phone: u.customer?.phone || '', password: '' });
  };

  const save = async () => {
    setLoading(true);
    try {
      await api.put(`/users/${editing}`, form);
      load();
      setEditing(null);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const saveNew = async () => {
    setLoading(true);
    try {
      await api.post('/users', addForm);
      load();
      setAdding(false);
      setAddForm(EMPTY_MEMBER);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('ຢືນຢັນລົບຜູ້ໃຊ້ນີ້?')) return;
    try { await api.delete(`/users/${id}`); load(); }
    catch (err) { alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ'); }
  };

  const toggleView = (id) => setViewing((v) => (v === id ? null : id));

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700">ສະມາຊິກທັງໝົດ ({users.length})</h2>
        <Btn small label="+ ເພີ່ມສະມາຊິກ" onClick={() => { setAdding(true); setEditing(null); setViewing(null); setAddForm(EMPTY_MEMBER); }} />
      </div>

      {adding && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-[#7B2438] mb-3">ເພີ່ມສະມາຊິກໃໝ່ (ສະໝັກແທນລູກຄ້າ)</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Field label="ຊື່ *" name="fname" value={addForm.fname} onChange={(e) => setAddForm(f => ({ ...f, fname: e.target.value }))} required />
            <Field label="ນາມສະກຸນ" name="lname" value={addForm.lname} onChange={(e) => setAddForm(f => ({ ...f, lname: e.target.value }))} />
            <Field label="ອີເມລ *" name="email" type="email" value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))} required />
            <Field label="ລະຫັດຜ່ານ *" name="password" type="password" value={addForm.password} onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))} required />
            <Field label="ເບີໂທ *" name="phone" value={addForm.phone} onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))} required />
            <Field label="ເພດ" name="gender" value={addForm.gender} onChange={(e) => setAddForm(f => ({ ...f, gender: e.target.value }))}
              options={[{ value: '', label: '-- ບໍ່ລະບຸ --' }, { value: 'male', label: 'ຊາຍ' }, { value: 'female', label: 'ຍິງ' }, { value: 'other', label: 'ອື່ນໆ' }]} />
            <Field label="ວັນເດືອນປີເກີດ" name="birthday" type="date" value={addForm.birthday} onChange={(e) => setAddForm(f => ({ ...f, birthday: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Btn small label="ເພີ່ມສະມາຊິກ" onClick={saveNew} disabled={loading} />
            <Btn small label="ຍົກເລີກ" color="gray" onClick={() => setAdding(false)} />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400 border-b text-xs">
            <th className="pb-2 pr-4">ຊື່</th><th className="pb-2 pr-4">ອີເມລ</th>
            <th className="pb-2 pr-4">ໂທ</th><th className="pb-2">ຈັດການ</th>
          </tr></thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} className="py-10 text-center text-gray-400">ຍັງບໍ່ມີສະມາຊິກ</td></tr>
            )}
            {users.map((u) => (
              <React.Fragment key={u.u_id}>
                <tr className="border-b">
                  {editing === u.u_id ? (
                    <td colSpan={4} className="py-3">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Field label="ຊື່" name="fname" value={form.fname} onChange={(e) => setForm(f => ({ ...f, fname: e.target.value }))} required />
                        <Field label="ນາມສະກຸນ" name="lname" value={form.lname} onChange={(e) => setForm(f => ({ ...f, lname: e.target.value }))} />
                        <Field label="ໂທ" name="phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                        <Field label="ລະຫັດຜ່ານໃໝ່ (ບໍ່ບັງຄັບ)" name="password" type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <Btn small label="ບັນທຶກ" onClick={save} disabled={loading} />
                        <Btn small label="ຍົກເລີກ" color="gray" onClick={() => setEditing(null)} />
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="py-2 pr-4 font-medium">{[u.customer?.fname, u.customer?.lname].filter(Boolean).join(' ') || '-'}</td>
                      <td className="py-2 pr-4 text-gray-500">{u.email}</td>
                      <td className="py-2 pr-4 text-gray-500">{u.customer?.phone || '-'}</td>
                      <td className="py-2 flex gap-2">
                        <Btn small label={viewing === u.u_id ? '▲ ປິດ' : 'ລາຍລະອຽດ'} color="gray" onClick={() => toggleView(u.u_id)} />
                        <Btn small label="ແກ້ໄຂ" color="gray" onClick={() => startEdit(u)} />
                        <Btn small label="ລົບ" color="red" onClick={() => del(u.u_id)} />
                      </td>
                    </>
                  )}
                </tr>
                {viewing === u.u_id && editing !== u.u_id && (
                  <tr>
                    <td colSpan={4} className="pb-3">
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-gray-400 block mb-0.5">ຊື່ - ນາມສະກຸນ</span>
                          <span className="font-medium">{[u.customer?.fname, u.customer?.lname].filter(Boolean).join(' ') || '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block mb-0.5">ອີເມລ</span>
                          <span>{u.email}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block mb-0.5">ເບີໂທ</span>
                          <span>{u.customer?.phone || '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block mb-0.5">ເພດ</span>
                          <span>{GENDER_LABEL[u.customer?.gender] || '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block mb-0.5">ວັນເດືອນປີເກີດ</span>
                          <span>{u.customer?.birthday ? new Date(u.customer.birthday).toLocaleDateString('lo-LA') : '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block mb-0.5">ສະຖານະ</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">ສະມາຊິກ</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ADMIN_NAV = [
  { icon: FaTools, label: 'ຈັດການລະບົບ', path: '/admin' },
  { icon: FaChartBar, label: 'ລາຍງານ', path: '/reports' },
];

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [view, setView] = useState('bookings'); // 'bookings' | 'members'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const [error, setError] = useState('');

  const fetchBookings = useCallback((status = '') => {
    setLoading(true);
    setError('');
    const params = status ? { status } : {};
    api.get('/bookings', { params })
      .then((res) => setBookings(res.data))
      .catch((err) => setError(err.response?.data?.message || 'ໂຫຼດຂໍ້ມູນລົ້ມເຫຼວ'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view === 'bookings') fetchBookings(tab);
  }, [tab, view, fetchBookings]);

  const handleUpdate = (updated) => {
    if (!updated) return;
    setBookings((prev) => prev.map((b) => (b.b_id === updated.b_id ? updated : b)));
  };

  const needAttention = bookings.filter(
    (b) => b.status === 'checking_in' ||
           b.status === 'checking_out' ||
           b.payments?.some((p) => p.status === 'pending')
  ).length;

  return (
    <div className="min-h-screen bg-green-50 flex">

      {/* ─── Sidebar ─── */}
      <aside className="w-52 bg-[#7B2438] min-h-screen shrink-0 flex flex-col">
        <div className="px-5 py-5 border-b border-rose-700">
          <p className="text-white font-bold text-sm tracking-wide">DASHBOARD</p>
          <p className="text-rose-300 text-xs mt-0.5">ລະບົບຈັດການ</p>
        </div>
        <nav className="flex flex-col py-2">
          <button
            onClick={() => setView('bookings')}
            className={`text-left px-5 py-3 text-sm font-medium transition border-l-4 flex items-center gap-2 ${
              view === 'bookings' ? 'bg-rose-900 text-white border-white' : 'text-rose-300 border-transparent hover:bg-rose-900 hover:text-white'
            }`}
          >
            <FaClipboardList /> ການຈອງ
            {needAttention > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {needAttention}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('members')}
            className={`text-left px-5 py-3 text-sm font-medium transition border-l-4 flex items-center gap-2 ${
              view === 'members' ? 'bg-rose-900 text-white border-white' : 'text-rose-300 border-transparent hover:bg-rose-900 hover:text-white'
            }`}
          >
            <FaUser /> ສະມາຊິກ
          </button>
          {isAdmin && (
            <>
              <div className="border-t border-rose-700 mt-2 pt-2" />
              {ADMIN_NAV.map((item) => (
                <button
                  key={item.label}
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

        {/* Members View */}
        {view === 'members' && (
          <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-[#7B2438] mb-6 flex items-center gap-2"><FaUser /> ສະມາຊິກ</h1>
            <MembersPanel />
          </div>
        )}

        {/* Bookings View */}
        {view === 'bookings' && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#7B2438]">ການຈອງ</h1>
                {needAttention > 0 && (
                  <p className="text-sm text-orange-600 font-medium mt-0.5">
                    {needAttention} ລາຍການລໍດຳເນີນການ
                  </p>
                )}
              </div>
              <button onClick={() => fetchBookings(tab)}
                className="text-sm text-[#7B2438] hover:underline font-medium">
                ໂຫຼດໃໝ່
              </button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1.5 flex-wrap mb-5">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    tab === t.key
                      ? 'bg-[#7B2438] text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-rose-50'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {loading ? (
              <div className="flex justify-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-20 text-gray-400">ບໍ່ມີການຈອງ</div>
            ) : (
              <div className="flex flex-col gap-3">
                {bookings.map((b) => (
                  <BookingRow key={b.b_id} booking={b} onUpdate={handleUpdate} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
