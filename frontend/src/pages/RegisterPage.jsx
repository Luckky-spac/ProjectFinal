import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '', gender: '', birthday: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      return setError('ລະຫັດຜ່ານບໍ່ຕົງກັນ');
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        gender: form.gender || undefined,
        birthday: form.birthday || undefined,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300';

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-rose-100">

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎤</div>
          <h1 className="text-2xl font-bold text-[#7B2438]">LatsavongBook</h1>
          <p className="text-rose-400 text-sm mt-1">ສະໝັກສະມາຊິກ</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">👤 ຊື່ ແລະ ນາມສະກຸນ</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required
              className={inputCls} placeholder="ກວດສອບຊື່-ນາມສະກຸນ" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📧 ອີເມລ</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              className={inputCls} placeholder="example@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📞 ເບີໂທ</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} required
              pattern="[0-9]{10,15}" minLength={10} maxLength={15}
              title="ເບີໂທຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວເລກ (ຕົວຢ່າງ: 02012345678)"
              className={inputCls} placeholder="02012345678" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">⚧ ເພດ</label>
              <select name="gender" value={form.gender} onChange={handleChange} className={inputCls}>
                <option value="">-- ບໍ່ລະບຸ --</option>
                <option value="male">ຊາຍ</option>
                <option value="female">ຍິງ</option>
                <option value="other">ອື່ນໆ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🎂 ວັນເດືອນປີເກີດ</label>
              <input type="date" name="birthday" value={form.birthday} onChange={handleChange}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🔒 ລະຫັດຜ່ານ</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required
              className={inputCls} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🔒 ຢືນຢັນລະຫັດຜ່ານ</label>
            <input type="password" name="confirm" value={form.confirm} onChange={handleChange} required
              className={inputCls} placeholder="••••••••" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7B2438] text-white py-2.5 rounded-lg font-semibold hover:bg-rose-900 transition disabled:opacity-50"
          >
            {loading ? 'ກຳລັງສະໝັກ...' : 'ສະໝັກສະມາຊິກ'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ມີບັນຊີແລ້ວ?{' '}
          <Link to="/login" className="text-[#7B2438] hover:underline font-semibold">ເຂົ້າສູ່ລະບົບ</Link>
        </p>
      </div>
    </div>
  );
}
