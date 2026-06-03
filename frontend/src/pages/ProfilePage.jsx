import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: user.name || '', phone: user.phone || '' }));
  }, [user]);

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
      const payload = { name: form.name, phone: form.phone };
      if (form.new_password) {
        payload.password = form.password;
        payload.new_password = form.new_password;
      }
      const res = await api.put('/auth/profile', payload);
      login(res.data, localStorage.getItem('token'));
      setSuccess('ບັນທຶກຂໍ້ມູນສຳເລັດ');
      setForm((f) => ({ ...f, password: '', new_password: '', confirm_password: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300';

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
          <div>
            <label className="text-sm text-gray-600 mb-1 block">ຊື່</label>
            <input name="name" value={form.name} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">ເບີໂທ</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} />
          </div>

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
