import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoomsPage from './pages/RoomsPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import StaffDashboardPage from './pages/StaffDashboardPage';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/booking" element={
              <ProtectedRoute userOnly>
                <BookingPage />
              </ProtectedRoute>
            } />
            <Route path="/my-bookings" element={
              <ProtectedRoute userOnly>
                <MyBookingsPage />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute employeeOnly>
                <StaffDashboardPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
