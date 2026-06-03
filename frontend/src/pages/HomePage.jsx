import { useNavigate } from 'react-router-dom';

// ข้อมูลห้องแสดงหน้าแรก (static — ตรงกับ seed)
const ROOMS = [
  {
    num: 1,
    size: 'S',
    nameLao: 'ຫ້ອງນ້ອຍ',
    capacity: '4',
    price: '300',
    // TODO: เปลี่ยน null เป็น path รูปภาพ เช่น '/images/room-s-1.jpg'
    photos: [null, null],
  },
  {
    num: 2,
    size: 'M',
    nameLao: 'ຫ້ອງກາງ',
    capacity: '8',
    price: '500',
    // TODO: เปลี่ยน null เป็น path รูปภาพ เช่น '/images/room-m-1.jpg'
    photos: [null, null],
  },
  {
    num: 3,
    size: 'L',
    nameLao: 'ຫ້ອງໃຫຍ່',
    capacity: '15',
    price: '800',
    // TODO: เปลี่ยน null เป็น path รูปภาพ เช่น '/images/room-l-1.jpg'
    photos: [null, null],
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-green-50">

      {/* ─── Hero Banner ──────────────────────────────────────────────────── */}
      <section>
        {/*
          TODO: ใส่รูปภาพ Hero Banner ของ Latsavong ที่นี่
          เปลี่ยนบล็อก <div className="bg-gray-300 ..."> ด้านล่างเป็น:
          <img src="/images/hero-banner.jpg" alt="Latsavong Hero" className="w-full h-72 object-cover" />
          แนะนำ: วางรูปไว้ที่ frontend/public/images/hero-banner.jpg
        */}
        <div className="bg-gray-300 h-72 flex items-center justify-center overflow-hidden">
          <div className="text-center text-gray-500">
            <div className="text-8xl mb-3">🎤</div>
            <p className="text-sm font-medium tracking-wide">[ รูปภาพ Hero Banner — Latsavong Hotel ]</p>
            <p className="text-xs mt-1 text-gray-400">แนะนำขนาด 1200 × 400 px</p>
          </div>
        </div>

        {/* Welcome Bar */}
        <div className="bg-[#7B2438] py-6 text-center text-white px-4">
          <h1 className="text-xl font-bold tracking-wide">ຍິນດີຕ້ອນຮັບສູ່ລະບົບຈອງຫ້ອງຄາຣາໂອເກະຂອງໂຮງແຮມລາດສະວົງ</h1>
          <button
            onClick={() => navigate('/rooms')}
            className="mt-4 bg-white text-[#7B2438] px-6 py-2 rounded-lg font-bold text-sm hover:bg-rose-100 transition shadow"
          >
            ເບິ່ງຫ້ອງທັງໝົດ →
          </button>
        </div>
      </section>

      {/* ─── Room Cards ───────────────────────────────────────────────────── */}
      <section className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
        {ROOMS.map((room) => (
          <div
            key={room.size}
            className="bg-rose-100 rounded-2xl overflow-hidden shadow-md border border-rose-200"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="font-bold text-[#7B2438] text-base">
                ຫ້ອງຄາຣາໂອເກະຫ້ອງທີ {room.num}
              </h2>
              <button
                onClick={() => navigate('/rooms')}
                title="ເບິ່ງລາຍລະອຽດ ແລະ ຈອງ"
                className="text-[#7B2438] hover:text-rose-900 text-xl transition"
              >
                📅
              </button>
            </div>

            {/* Info Row */}
            <div className="flex gap-4 px-5 pb-3 text-sm text-[#7B2438] font-medium flex-wrap">
              <span>🏠 <strong>SIZE {room.size}</strong></span>
              <span>👤 ບັບຈຸໄດ້ {room.capacity} ທ່ານ</span>
              <span>💲 ຈາກ ฿{room.price}/ຊົ່ວໂມງ</span>
            </div>

            {/* Photos — 2 ช่อง */}
            <div className="grid grid-cols-2 gap-2 px-5 pb-3">
              {room.photos.map((photo, i) => (
                <div
                  key={i}
                  className="bg-gray-300 h-36 rounded-xl flex items-center justify-center overflow-hidden"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={`${room.nameLao} รูปที่ ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /*
                      TODO: ใส่รูปห้อง SIZE {room.size} รูปที่ {i + 1}
                      วิธีใส่รูป:
                        1. วางรูปใน frontend/public/images/
                        2. แก้ photos array ข้างบนใน ROOMS
                           เช่น photos: ['/images/room-s-1.jpg', '/images/room-s-2.jpg']
                    */
                    <span className="text-gray-400 text-xs text-center px-2 leading-5">
                      [ ຮູບຫ້ອງ {room.nameLao} ]
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 flex items-center justify-between">
              <span className="text-xs text-rose-400 italic">{room.nameLao}</span>
              <button
                onClick={() => navigate('/rooms')}
                className="text-sm text-[#7B2438] underline font-semibold hover:text-rose-900 transition"
              >
                ລາຍລະອຽດ →
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#7B2438] text-rose-300 text-center text-xs py-4 mt-4">
        © 2025 Latsavong Booking System · All rights reserved
      </footer>
    </div>
  );
}
