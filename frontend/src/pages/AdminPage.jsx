import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaLayerGroup, FaUserTie, FaUser, FaClipboardList, FaChartBar } from 'react-icons/fa';
import PasswordInput from '../components/PasswordInput';
import api from '../api/axios';

// ─── helpers ────────────────────────────────────────────────────────────────
function Btn({ label, color = 'purple', onClick, disabled, small }) {
  const colors = {
    purple: 'bg-[#7B2438] hover:bg-rose-900 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    gray: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
    green: 'bg-green-600 hover:bg-green-700 text-white',
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

// ─── Users Tab ───────────────────────────────────────────────────────────────
const EMPTY_MEMBER = { fname: '', lname: '', email: '', password: '', phone: '', gender: '', birthday: '' };
const GENDER_LABEL = { male: 'ຊາຍ', female: 'ຍິງ', other: 'ອື່ນໆ' };

function UsersTab() {
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
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-700">ສະມາຊິກ ({users.length})</h2>
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

// ─── Employees Tab ───────────────────────────────────────────────────────────
const EMPTY_EMP = { fname: '', lname: '', email: '', password: '', phone: '', gender: '', birthday: '', position: '', role: 'staff', status: 'active', hire_date: '', province_id: '', district_id: '', village_name: '' };

function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_EMP);
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);

  const load = useCallback(() => {
    api.get('/employees').then((r) => setEmployees(r.data)).catch(() => {});
  }, []);
  useEffect(load, [load]);
  useEffect(() => { api.get('/provinces').then((r) => setProvinces(r.data)).catch(() => {}); }, []);

  const onChange = async (e) => {
    const { name, value } = e.target;
    if (name === 'province_id') {
      setForm((f) => ({ ...f, province_id: value, district_id: '', village_name: '' }));
      setDistricts([]);
      if (value) { const r = await api.get(`/districts?province_id=${value}`); setDistricts(r.data); }
    } else if (name === 'district_id') {
      setForm((f) => ({ ...f, district_id: value, village_name: '' }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const startAdd = () => { setAdding(true); setEditing(null); setForm(EMPTY_EMP); setDistricts([]); };
  const startEdit = async (e) => {
    setEditing(e.emp_id); setAdding(false);
    const provinceId = String(e.village?.district?.province?.p_id || '');
    const districtId = String(e.village?.district?.d_id || '');
    setForm({
      fname: e.fname || '', lname: e.lname || '',
      email: e.user?.email || '', password: '', phone: e.phone || '',
      gender: e.gender || '', birthday: e.birthday || '',
      position: e.position, role: e.user?.role || 'staff', status: e.status, hire_date: e.hire_date || '',
      province_id: provinceId,
      district_id: districtId,
      village_name: e.village?.name || '',
    });
    if (provinceId) { const r = await api.get(`/districts?province_id=${provinceId}`); setDistricts(r.data); }
  };

  const save = async () => {
    setLoading(true);
    try {
      if (adding) await api.post('/employees', form);
      else await api.put(`/employees/${editing}`, form);
      load(); setAdding(false); setEditing(null);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('ຢືນຢັນລົບພະນັກງານນີ້?')) return;
    try { await api.delete(`/employees/${id}`); load(); }
    catch (err) { alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-700">ພະນັກງານ ({employees.length})</h2>
        <Btn small label="+ ເພີ່ມພະນັກງານ" onClick={startAdd} />
      </div>
      {(adding || editing) && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Field label="ຊື່ *" name="fname" value={form.fname} onChange={onChange} required />
            <Field label="ນາມສະກຸນ" name="lname" value={form.lname} onChange={onChange} />
            <Field label="ອີເມລ" name="email" type="email" value={form.email} onChange={onChange} required={adding} />
            <Field label={adding ? 'ລະຫັດຜ່ານ *' : 'ລະຫັດຜ່ານໃໝ່ (ບໍ່ບັງຄັບ)'} name="password" type="password" value={form.password} onChange={onChange} />
            <Field label="ໂທ" name="phone" value={form.phone} onChange={onChange}
              pattern="[0-9]{10,15}" minLength={10} maxLength={15}
              title="ເບີໂທຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວເລກ (ຕົວຢ່າງ: 02012345678)" />
            <Field label="ເພດ" name="gender" value={form.gender} onChange={onChange}
              options={[{ value: '', label: '-- ບໍ່ລະບຸ --' }, { value: 'male', label: 'ຊາຍ' }, { value: 'female', label: 'ຍິງ' }, { value: 'other', label: 'ອື່ນໆ' }]} />
            <Field label="ວັນເດືອນປີເກີດ" name="birthday" type="date" value={form.birthday} onChange={onChange} />
            <Field label="ຕຳແໜ່ງ" name="position" value={form.position} onChange={onChange} required />
            <Field label="ວັນທີ່ເລີ່ມງານ" name="hire_date" type="date" value={form.hire_date} onChange={onChange} />
            <Field label="ບົດບາດ" name="role" value={form.role} onChange={onChange}
              options={[{ value: 'staff', label: 'Staff' }, { value: 'admin', label: 'Admin' }]} />
            <Field label="ສະຖານະ" name="status" value={form.status} onChange={onChange}
              options={[{ value: 'active', label: 'ໃຊ້ງານ' }, { value: 'inactive', label: 'ລະງັບ' }]} />
          </div>

          <p className="text-xs text-gray-400 mb-2">ທີ່ຢູ່ (ບໍ່ບັງຄັບ)</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <Field label="ແຂວງ" name="province_id" value={form.province_id} onChange={onChange}
              options={[{ value: '', label: '-- ເລືອກແຂວງ --' }, ...provinces.map((p) => ({ value: String(p.p_id), label: p.name }))]} />
            <Field label="ເມືອງ" name="district_id" value={form.district_id} onChange={onChange}
              options={[{ value: '', label: form.province_id ? '-- ເລືອກເມືອງ --' : '-- ເລືອກແຂວງກ່ອນ --' }, ...districts.map((d) => ({ value: String(d.d_id), label: d.name }))]} />
            <Field label="ບ້ານ (ພິມຊື່)" name="village_name" value={form.village_name} onChange={onChange}
              placeholder={form.district_id ? 'ຕົວຢ່າງ: ບ້ານໂນນສະຫວ່າງ' : '-- ເລືອກເມືອງກ່ອນ --'}
              disabled={!form.district_id} />
          </div>

          <div className="flex gap-2 mt-3">
            <Btn small label={adding ? 'ເພີ່ມພະນັກງານ' : 'ບັນທຶກ'} onClick={save} disabled={loading} />
            <Btn small label="ຍົກເລີກ" color="gray" onClick={() => { setAdding(false); setEditing(null); }} />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400 border-b text-xs">
            <th className="pb-2 pr-3">ຊື່</th><th className="pb-2 pr-3">ອີເມລ</th>
            <th className="pb-2 pr-3">ຕຳແໜ່ງ</th><th className="pb-2 pr-3">ບົດບາດ</th>
            <th className="pb-2 pr-3">ສະຖານະ</th><th className="pb-2">ຈັດການ</th>
          </tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.emp_id} className={`border-b last:border-0 ${editing === e.emp_id ? 'opacity-40' : ''}`}>
                <td className="py-2 pr-3 font-medium">{[e.fname, e.lname].filter(Boolean).join(' ')}</td>
                <td className="py-2 pr-3 text-gray-500">{e.user?.email}</td>
                <td className="py-2 pr-3 text-gray-500">{e.position}</td>
                <td className="py-2 pr-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.user?.role === 'admin' ? 'bg-rose-100 text-[#7B2438]' : 'bg-blue-100 text-blue-700'}`}>{e.user?.role}</span></td>
                <td className="py-2 pr-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{e.status === 'active' ? 'ໃຊ້ງານ' : 'ລະງັບ'}</span></td>
                <td className="py-2 flex gap-2">
                  <Btn small label="ແກ້ໄຂ" color="gray" onClick={() => startEdit(e)} />
                  <Btn small label="ລົບ" color="red" onClick={() => del(e.emp_id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Rooms Tab ───────────────────────────────────────────────────────────────
const EMPTY_ROOM = { room_number: '', room_type_id: '', floor: '1', status: 'available' };

function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [types, setTypes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_ROOM);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFiles, setImageFiles] = useState([null]);
  const [imagePreviews, setImagePreviews] = useState(['']);

  const load = useCallback(() => {
    Promise.all([api.get('/rooms'), api.get('/rooms/types')]).then(([r, t]) => { setRooms(r.data); setTypes(t.data); }).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const resetImages = () => { setImageFile(null); setImagePreview(''); setImageFiles([null]); setImagePreviews(['']); };
  const startAdd = () => { setAdding(true); setEditing(null); setForm(EMPTY_ROOM); resetImages(); };
  const startEdit = (r) => {
    setEditing(r.r_id); setAdding(false);
    setForm({ room_number: r.room_number, room_type_id: String(r.rtype_id), floor: String(r.floor), status: r.status });
    setImageFile(null);
    setImagePreview(r.image_url ? `http://localhost:5000${r.image_url}` : '');
    setImageFiles([null]);
    setImagePreviews([r.image_url2 ? `http://localhost:5000${r.image_url2}` : '']);
  };

  const save = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('room_number', form.room_number);
      fd.append('room_type_id', form.room_type_id);
      fd.append('floor', form.floor);
      fd.append('status', form.status);
      if (imageFile) fd.append('image', imageFile);
      if (imageFiles[0]) fd.append('image2', imageFiles[0]);
      if (adding) await api.post('/rooms', fd);
      else await api.put(`/rooms/${editing}`, fd);
      load(); setAdding(false); setEditing(null); resetImages();
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('ຢືນຢັນລົບຫ້ອງນີ້?')) return;
    try { await api.delete(`/rooms/${id}`); load(); }
    catch (err) { alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ'); }
  };

  const statusColor = { available: 'bg-green-100 text-green-700', occupied: 'bg-red-100 text-red-600', maintenance: 'bg-yellow-100 text-yellow-700' };
  const statusText = { available: 'ວ່າງ', occupied: 'ບໍ່ວ່າງ', maintenance: 'ຊ່ອມ' };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-700">ຫ້ອງທັງໝົດ ({rooms.length})</h2>
        <Btn small label="+ ເພີ່ມຫ້ອງ" onClick={startAdd} />
      </div>
      {(adding || editing) && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Field label="ເລກຫ້ອງ" name="room_number" value={form.room_number} onChange={onChange} required />
            <Field label="ຊັ້ນ" name="floor" type="number" value={form.floor} onChange={onChange} />
            <Field label="ປະເພດຫ້ອງ" name="room_type_id" value={form.room_type_id} onChange={onChange} required
              options={types.map((t) => ({ value: String(t.rtype_id), label: `${t.name} (฿${t.price_per_hour}/ຊມ.)` }))} />
            <Field label="ສະຖານະ" name="status" value={form.status} onChange={onChange}
              options={[{ value: 'available', label: 'ວ່າງ' }, { value: 'occupied', label: 'ບໍ່ວ່າງ' }, { value: 'maintenance', label: 'ຊ່ອມບຳລຸງ' }]} />
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-2 block font-medium">ຮູບພາບຫ້ອງ</label>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((i) => {
                const isMain = i === 0;
                const preview = isMain ? imagePreview : imagePreviews[0];
                const label = `ຮູບ ${i + 1}${isMain ? ' (ໜ້າຫຼັກ)' : ''}`;
                const onChange = isMain
                  ? onImageChange
                  : (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFiles([file]);
                        setImagePreviews([URL.createObjectURL(file)]);
                      }
                    };
                return (
                  <div key={i} className="border rounded-xl p-2 bg-white">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    {preview && <img src={preview} alt={label} className="h-24 w-full rounded-lg object-cover mb-2 border" />}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange}
                      className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-rose-50 file:text-[#7B2438] hover:file:bg-rose-100 cursor-pointer" />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP — ບໍ່ເກີນ 5MB ຕໍ່ຮູບ</p>
          </div>
          <div className="flex gap-2">
            <Btn small label={adding ? 'ເພີ່ມຫ້ອງ' : 'ບັນທຶກ'} onClick={save} disabled={loading} />
            <Btn small label="ຍົກເລີກ" color="gray" onClick={() => { setAdding(false); setEditing(null); }} />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400 border-b text-xs">
            <th className="pb-2 pr-3">ຫ້ອງ</th><th className="pb-2 pr-3">ປະເພດ</th>
            <th className="pb-2 pr-3">ຊັ້ນ</th><th className="pb-2 pr-3">ສະຖານະ</th><th className="pb-2">ຈັດການ</th>
          </tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.r_id} className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium">{r.room_number}</td>
                <td className="py-2 pr-3 text-gray-500">{r.roomType?.name}</td>
                <td className="py-2 pr-3 text-gray-500">{r.floor}</td>
                <td className="py-2 pr-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor[r.status]}`}>{statusText[r.status]}</span></td>
                <td className="py-2 flex gap-2">
                  <Btn small label="ແກ້ໄຂ" color="gray" onClick={() => startEdit(r)} />
                  <Btn small label="ລົບ" color="red" onClick={() => del(r.r_id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RoomTypes Tab ────────────────────────────────────────────────────────────
const EMPTY_TYPE = { name: '', description: '', capacity: '4', price_per_hour: '', overtime_price_per_hour: '' };

function RoomTypesTab() {
  const [types, setTypes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_TYPE);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    api.get('/rooms/types').then((r) => setTypes(r.data)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const startAdd = () => { setAdding(true); setEditing(null); setForm(EMPTY_TYPE); };
  const startEdit = (t) => { setEditing(t.rtype_id); setAdding(false); setForm({ name: t.name, description: t.description || '', capacity: String(t.capacity), price_per_hour: String(t.price_per_hour), overtime_price_per_hour: String(t.overtime_price_per_hour) }); };

  const save = async () => {
    setLoading(true);
    try {
      if (adding) await api.post('/room-types', form);
      else await api.put(`/room-types/${editing}`, form);
      load(); setAdding(false); setEditing(null);
    } catch (err) {
      alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('ຢືນຢັນລົບປະເພດຫ້ອງນີ້?')) return;
    try { await api.delete(`/room-types/${id}`); load(); }
    catch (err) { alert(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-700">ປະເພດຫ້ອງ ({types.length})</h2>
        <Btn small label="+ ເພີ່ມປະເພດ" onClick={startAdd} />
      </div>
      {(adding || editing) && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Field label="ຊື່ປະເພດ" name="name" value={form.name} onChange={onChange} required />
            <Field label="ຄວາມຈຸ (ຄົນ)" name="capacity" type="number" value={form.capacity} onChange={onChange} />
            <Field label="ລາຄາ/ຊົ່ວໂມງ (ບາດ)" name="price_per_hour" type="number" value={form.price_per_hour} onChange={onChange} required />
            <Field label="ລາຄາຕໍ່ ຊມ. ເມື່ອເກີນເວລາ (ບາດ)" name="overtime_price_per_hour" type="number" value={form.overtime_price_per_hour} onChange={onChange} required />
            <Field label="ຄຳອະທິບາຍ" name="description" value={form.description} onChange={onChange} />
          </div>
          <div className="flex gap-2">
            <Btn small label={adding ? 'ເພີ່ມປະເພດ' : 'ບັນທຶກ'} onClick={save} disabled={loading} />
            <Btn small label="ຍົກເລີກ" color="gray" onClick={() => { setAdding(false); setEditing(null); }} />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400 border-b text-xs">
            <th className="pb-2 pr-4">ຊື່</th><th className="pb-2 pr-4">ຄວາມຈຸ</th>
            <th className="pb-2 pr-4">ລາຄາ/ຊມ.</th><th className="pb-2 pr-4">ລາຄາເກີນເວລາ/ຊມ.</th><th className="pb-2">ຈັດການ</th>
          </tr></thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.rtype_id} className="border-b last:border-0">
                <td className="py-2 pr-4 font-medium">{t.name}</td>
                <td className="py-2 pr-4 text-gray-500">{t.capacity} ຄົນ</td>
                <td className="py-2 pr-4 text-gray-500">฿{Number(t.price_per_hour).toLocaleString()}</td>
                <td className="py-2 pr-4 text-gray-500">฿{Number(t.overtime_price_per_hour).toLocaleString()}</td>
                <td className="py-2 flex gap-2">
                  <Btn small label="ແກ້ໄຂ" color="gray" onClick={() => startEdit(t)} />
                  <Btn small label="ລົບ" color="red" onClick={() => del(t.rtype_id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'rooms', icon: FaHome, label: 'ຫ້ອງ' },
  { key: 'room-types', icon: FaLayerGroup, label: 'ປະເພດຫ້ອງ' },
  { key: 'employees', icon: FaUserTie, label: 'ພະນັກງານ' },
  { key: 'users', icon: FaUser, label: 'ສະມາຊິກ' },
];

const ADMIN_SIDEBAR_NAV = [
  { icon: FaClipboardList, label: 'ການຈອງ', path: '/staff' },
  { icon: FaChartBar, label: 'ລາຍງານ', path: '/reports' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('rooms');

  return (
    <div className="min-h-screen bg-green-50 flex">

      {/* ─── Sidebar ─── */}
      <aside className="w-52 bg-[#7B2438] min-h-screen shrink-0 flex flex-col">
        <div className="px-5 py-5 border-b border-rose-700">
          <p className="text-white font-bold text-sm tracking-wide">ADMIN</p>
          <p className="text-rose-300 text-xs mt-0.5">ຈັດການລະບົບ</p>
        </div>
        <nav className="flex flex-col py-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-left px-5 py-3 text-sm font-medium transition border-l-4 flex items-center gap-2 ${
                tab === t.key
                  ? 'bg-rose-900 text-white border-white'
                  : 'text-rose-300 border-transparent hover:bg-rose-900 hover:text-white'
              }`}
            >
              <t.icon /> {t.label}
            </button>
          ))}
          <div className="border-t border-rose-700 mt-2 pt-2">
            {ADMIN_SIDEBAR_NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="text-left w-full px-5 py-3 text-sm font-medium text-rose-300 border-l-4 border-transparent hover:bg-rose-900 hover:text-white transition flex items-center gap-2"
              >
                <item.icon /> {item.label}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 py-8 px-6">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold text-[#7B2438] mb-6">
            {TABS.find((t) => t.key === tab)?.label}
          </h1>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            {tab === 'rooms' && <RoomsTab />}
            {tab === 'room-types' && <RoomTypesTab />}
            {tab === 'employees' && <EmployeesTab />}
            {tab === 'users' && <UsersTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
