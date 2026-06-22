import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function HomePage() {
  const navigate = useNavigate();
  const [roomL, setRoomL] = useState(null);

  useEffect(() => {
    api.get('/rooms').then((r) => {
      const largest = r.data.reduce((max, room) =>
        (room.roomType?.capacity > (max?.roomType?.capacity ?? 0) ? room : max), null);
      setRoomL(largest);
    }).catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col">

      {/* Background Image */}
      <img
        src="/images/hero.jpeg"
        alt="Latsavong Wanda Vista Hotel"
        className="fixed inset-0 w-full h-full object-cover -z-10"
      />
      <div className="fixed inset-0 bg-black/55 -z-10" />

      {/* Title — top */}
      <div className="flex flex-col items-center pt-12 text-white text-center px-4">
        <h1 className="text-2xl md:text-3xl font-bold drop-shadow mb-1">
          ຍິນດີຕ້ອນຮັບສູ່ລະບົບຈອງຫ້ອງຄາຣາໂອເກະ
        </h1>
        <p className="text-rose-300 text-sm drop-shadow">Latsavong Wanda Vista Hotel</p>
      </div>

      {/* Content — bottom */}
      <div className="flex-1 flex flex-col items-center justify-end px-4 pb-16 text-white text-center">

        {/* Room L Card */}
        {roomL && (
          <p className="text-white text-base font-bold tracking-widest mb-2 drop-shadow">✨ ຫ້ອງແນະນຳ</p>
        )}
        {roomL && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden w-96 mb-5 shadow-xl">
            {roomL.image_url ? (
              <img src={roomL.image_url} alt={`ຫ້ອງ ${roomL.room_number}`} className="w-full h-52 object-cover" />
            ) : (
              <div className="w-full h-52 bg-white/10 flex items-center justify-center text-white/40 text-3xl">🎤</div>
            )}
            <div className="p-4 text-left">
              <h2 className="font-bold text-white text-base mb-1">ຫ້ອງ {roomL.room_number} — {roomL.roomType?.name}</h2>
              <div className="flex gap-4 text-rose-200 text-sm">
                <span>👤 {roomL.roomType?.capacity} ທ່ານ</span>
                <span>💲 ฿{Number(roomL.roomType?.price_per_hour).toLocaleString()}/ຊມ.</span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {roomL && (
            <button
              onClick={() => navigate(`/rooms/${roomL.r_id}`)}
              className="bg-white text-[#7B2438] px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-rose-100 transition shadow-lg"
            >
              ລາຍລະອຽດ →
            </button>
          )}
          <button
            onClick={() => navigate('/rooms')}
            className="border border-white text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition"
          >
            ຫ້ອງທັງໝົດ
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-[#f5f0e8] text-[#7B2438] px-10 py-5">
        <div className="flex justify-between text-xs mb-3">

          {/* Location */}
          <div>
            <p className="font-bold mb-1">Location</p>
            <p className="text-[11px] text-[#5a1a28] leading-4">
              Latsavong Wanda Vista Hotel<br />
              Nongbone Road<br />
              Sikhottabong District<br />
              Vientiane, Laos
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className="font-bold mb-1">Contact Us</p>
            <div className="flex flex-col gap-1 text-[11px] text-[#5a1a28]">
              <span className="flex items-center gap-1.5"><span>📘</span> Facebook : Latsavong Hotel</span>
              <span className="flex items-center gap-1.5"><span>📞</span> Phone : +856 21 123 456</span>
              <span className="flex items-center gap-1.5"><span>✉️</span> latsavong@gmail.com</span>
            </div>
          </div>

          {/* Opening */}
          <div>
            <p className="font-bold mb-1">Opening</p>
            <span className="flex items-center gap-1.5 text-[11px] text-[#5a1a28]">
              <span>🕐</span> 24-hour front desk
            </span>
          </div>
        </div>

        <div className="border-t border-[#d9c9b0] pt-2 text-center text-[10px] text-[#9a6a5a]">
          © 2025 Latsavong Wanda Vista Hotel · All rights reserved
        </div>
      </footer>
    </div>
  );
}
