import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, refreshUser, isEmployee } = useAuth();
  const [form, setForm] = useState({
    fname: '', lname: '', name: '',
    phone: '', gender: '', birthday: '', address: '',
    password: '', new_password: '', confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setForm((f) => ({
        ...f,
        fname: data.fname || '',
        lname: data.lname || '',
        name: data.name || '',
        phone: data.phone || '',
        gender: data.gender || '',
        birthday: data.birthday || '',
        address: data.address || '',
      }));
    }).finally(() => setFetching(false));
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (form.new_password && form.new_password !== form.confirm_password) {
      setError('ລະຫັດຜ່ານໃໝ່ບໍ່ຕົງກັນ');
      return;
    }

    setLoading(true);
    try {
      const payload = isEmployee
        ? {
            name: form.name,
            phone: form.phone,
            gender: form.gender || undefined,
            birthday: form.birthday || undefined,
          }
        : {
            fname: form.fname,
            lname: form.lname || undefined,
            phone: form.phone,
            gender: form.gender || undefined,
            birthday: form.birthday || undefined,
            address: form.address || undefined,
          };

      if (form.new_password) {
        payload.password = form.password;
        payload.new_password = form.new_password;
      }
      await api.put('/auth/profile', payload);
      await refreshUser();
      setSuccess('✅ ບັນທຶກຂໍ້ມູນສຳເລັດ!');
      setForm((f) => ({ ...f, password: '', new_password: '', confirm_password: '' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300';

  if (fetching) {
    return <div className="min-h-screen bg-green-50 flex items-center justify-center text-gray-400">ກຳລັງໂຫຼດ...</div>;
  }

  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-8 border border-rose-100">
        <h1 className="text-2xl font-bold text-[#7B2438] mb-6">ຂໍ້ມູນສ່ວນຕົວ</h1>

        {success && <div className="mb-4 bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg">{success}</div>}
        {error && <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="text-sm text-gray-600 mb-1 block">ອີເມລ</label>
            <input value={user?.email || ''} disabled
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>

          {isEmployee ? (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">ຊື່</label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputCls} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ຊື່</label>
                <input name="fname" value={form.fname} onChange={handleChange} required className={inputCls} placeholder="ຊື່" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ນາມສະກຸນ</label>
                <input name="lname" value={form.lname} onChange={handleChange} className={inputCls} placeholder="ນາມສະກຸນ" />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 mb-1 block">ເບີໂທ</label>
            <input name="phone" value={form.phone} onChange={handleChange} required className={inputCls} placeholder="020-xxx-xxxx" />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">ເພດ</label>
            <select name="gender" value={form.gender} onChange={handleChange} className={inputCls}>
              <option value="">-- ບໍ່ລະບຸ --</option>
              <option value="male">ຊາຍ</option>
              <option value="female">ຍິງ</option>
              <option value="other">ອື່ນໆ</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">ວັນເດືອນປີເກີດ</label>
            <input name="birthday" type="date" value={form.birthday} onChange={handleChange} className={inputCls} />
          </div>

          {!isEmployee && (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">ທີ່ຢູ່</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                className={inputCls} placeholder="ບ້ານ, ເມືອງ, ແຂວງ..." />
            </div>
          )}

          <hr className="my-1" />
          <p className="text-sm text-gray-400">ປ່ຽນລະຫັດຜ່ານ (ບໍ່ບັງຄັບ)</p>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">ລະຫັດຜ່ານເກົ່າ</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">ລະຫັດຜ່ານໃໝ່</label>
            <input name="new_password" type="password" value={form.new_password} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">ຢືນຢັນລະຫັດຜ່ານໃໝ່</label>
            <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} className={inputCls} />
          </div>

          <button type="submit" disabled={loading}
            className="mt-2 bg-[#7B2438] hover:bg-rose-900 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50">
            {loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກຂໍ້ມູນ'}
          </button>
        </form>
      </div>
    </div>
  );
}
