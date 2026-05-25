import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isEmployee, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-purple-600 text-lg">🎤 KaraokeBook</Link>

        <div className="flex items-center gap-4">
          {!isEmployee && (
            <Link to="/rooms" className="text-sm text-gray-600 hover:text-purple-600">ห้องทั้งหมด</Link>
          )}

          {user ? (
            <>
              {isEmployee ? (
                <Link to="/staff" className="text-sm text-gray-600 hover:text-purple-600">Dashboard</Link>
              ) : (
                <Link to="/my-bookings" className="text-sm text-gray-600 hover:text-purple-600">การจองของฉัน</Link>
              )}

              <span className="text-sm text-gray-500 hidden sm:block">
                {user.name}
                {isEmployee && (
                  <span className="ml-1 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                    {user.role === 'admin' ? 'เจ้าของ' : 'พนักงาน'}
                  </span>
                )}
              </span>

              <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
                ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-purple-600">เข้าสู่ระบบ</Link>
              <Link to="/register" className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition">
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
