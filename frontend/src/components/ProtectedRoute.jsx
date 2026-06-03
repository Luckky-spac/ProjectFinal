import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// roles: ['admin', 'staff'] ตรวจ role
// employeeOnly: true  ตรวจว่าต้องเป็น employee
// userOnly: true      ตรวจว่าต้องเป็น user (ลูกค้า)
export default function ProtectedRoute({ children, roles, employeeOnly, userOnly, adminOnly }) {
  const { user, loading, isEmployee, isAdmin } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">กำลังโหลด...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (employeeOnly && !isEmployee) return <Navigate to="/" replace />;
  if (userOnly && isEmployee) return <Navigate to="/staff" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
