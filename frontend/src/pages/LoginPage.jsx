import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate(data.user.type === 'employee' ? '/staff' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-rose-100">

        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎤</div>
          <h1 className="text-2xl font-bold text-[#7B2438]">LatsavongBook</h1>
          <p className="text-rose-400 text-sm mt-1">ເຂົ້າສູ່ລະບົບ</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📧 ອີເມລ</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="example@email.com"
              className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🔒 ລະຫັດຜ່ານ</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7B2438] text-white py-2.5 rounded-lg font-semibold hover:bg-rose-900 transition disabled:opacity-50"
          >
            {loading ? 'ກຳລັງເຂົ້າສູ່ລະບົບ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ຍັງບໍ່ມີບັນຊີ?{' '}
          <Link to="/register" className="text-[#7B2438] hover:underline font-semibold">ສະໝັກສະມາຊິກ</Link>
        </p>
      </div>
    </div>
  );
}
