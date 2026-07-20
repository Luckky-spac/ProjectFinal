import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

function NavLinks({ onNavigate, className = '' }) {
  const { user, logout, isEmployee } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || (user?.fname ? `${user.fname} ${user.lname || ''}`.trim() : null);

  const handleLogout = () => {
    onNavigate?.();
    logout();
    navigate('/login');
  };

  return (
    <div className={className}>
      <Link to="/" onClick={onNavigate} className="text-rose-200 hover:text-white transition">HOME</Link>
      <Link to="/rooms" onClick={onNavigate} className="text-rose-200 hover:text-white transition">ROOM</Link>

      {user ? (
        <>
          {isEmployee ? (
            <Link to="/staff" onClick={onNavigate} className="text-rose-200 hover:text-white transition">DASHBOARD</Link>
          ) : (
            <>
              <Link to="/my-bookings" onClick={onNavigate} className="text-rose-200 hover:text-white transition">ການຈອງ</Link>
              <Link to="/reviews" onClick={onNavigate} className="text-rose-200 hover:text-white transition">ລີວິວ</Link>
            </>
          )}

          <Link to="/profile" onClick={onNavigate} className="flex items-center gap-2 text-white hover:text-rose-200 transition">
            <span className="w-7 h-7 rounded-full bg-rose-700 border-2 border-rose-400 flex items-center justify-center text-xs shrink-0">
              <FaUser />
            </span>
            <span className="text-rose-100 text-xs">{displayName}</span>
            {isEmployee && (
              <span className="text-xs bg-rose-800 border border-rose-600 px-1.5 py-0.5 rounded-full text-rose-200">
                {user.role === 'admin' ? 'Admin' : 'Staff'}
              </span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs border border-rose-500 text-rose-300 hover:bg-rose-700 hover:text-white px-3 py-1.5 rounded-lg transition text-left"
          >
            ອອກ
          </button>
        </>
      ) : (
        <>
          <Link to="/login" onClick={onNavigate} className="text-rose-200 hover:text-white transition">LOGIN</Link>
          <Link
            to="/register"
            onClick={onNavigate}
            className="bg-white text-[#7B2438] px-3 py-1.5 rounded-lg font-bold hover:bg-rose-100 transition text-center"
          >
            REGISTER
          </Link>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#7B2438] shadow-lg relative">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-bold text-white text-base tracking-widest uppercase" onClick={() => setMenuOpen(false)}>
          LATSAVONG
        </Link>

        {/* Links — desktop */}
        <NavLinks className="hidden md:flex items-center gap-5 text-xs font-semibold tracking-wide" />

        {/* Hamburger — mobile */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden text-white text-xl p-1"
          aria-label="ເປີດ/ປິດ ເມນູ"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Links — mobile dropdown */}
      {menuOpen && (
        <NavLinks
          onNavigate={() => setMenuOpen(false)}
          className="md:hidden flex flex-col items-stretch gap-3 px-4 pb-4 pt-1 text-sm font-semibold tracking-wide border-t border-rose-700"
        />
      )}
    </nav>
  );
}
