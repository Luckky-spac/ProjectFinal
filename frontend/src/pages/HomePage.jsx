import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">ยินดีต้อนรับสู่ Hotel Booking</h1>
        <p className="text-gray-500 mb-8">ค้นหาและจองห้องพักได้ง่ายๆ</p>
        <Link to="/rooms" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
          ดูห้องพัก
        </Link>
      </div>
    </div>
  );
}
