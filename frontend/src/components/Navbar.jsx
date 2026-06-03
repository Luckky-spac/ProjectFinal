import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isEmployee, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#7B2438] shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-bold text-white text-base tracking-widest uppercase">
          LATSAVONG
        </Link>

        {/* Links */}
        <div className="flex items-center gap-5 text-xs font-semibold tracking-wide">
          <Link to="/" className="text-rose-200 hover:text-white transition">HOME</Link>
          <Link to="/rooms" className="text-rose-200 hover:text-white transition">ROOM</Link>

          {user ? (
            <>
              {isEmployee ? (
                <>
                  <Link to="/staff" className="text-rose-200 hover:text-white transition">DASHBOARD</Link>
                  {isAdmin && (
                    <>
                      <Link to="/admin" className="text-rose-200 hover:text-white transition">ADMIN</Link>
                      <Link to="/reports" className="text-rose-200 hover:text-white transition">REPORTS</Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link to="/my-bookings" className="text-rose-200 hover:text-white transition">ການຈອງ</Link>
                  <Link to="/reviews" className="text-rose-200 hover:text-white transition">ລີວິວ</Link>
                </>
              )}

              <Link to="/profile" className="flex items-center gap-2 text-white hover:text-rose-200 transition">
                <span className="w-7 h-7 rounded-full bg-rose-700 border-2 border-rose-400 flex items-center justify-center text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </span>
                <span className="hidden sm:inline text-rose-100 text-xs">{user.name}</span>
                {isEmployee && (
                  <span className="text-xs bg-rose-800 border border-rose-600 px-1.5 py-0.5 rounded-full text-rose-200">
                    {user.role === 'admin' ? 'Admin' : 'Staff'}
                  </span>
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="text-xs border border-rose-500 text-rose-300 hover:bg-rose-700 hover:text-white px-3 py-1 rounded-lg transition"
              >
                ອອກ
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-rose-200 hover:text-white transition">LOGIN</Link>
              <Link
                to="/register"
                className="bg-white text-[#7B2438] px-3 py-1.5 rounded-lg font-bold hover:bg-rose-100 transition"
              >
                REGISTER
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
