# ระบบจองห้องคาราโอเกะ (Karaoke Booking System)

ระบบจองห้องคาราโอเกะออนไลน์ พัฒนาด้วย React + Node.js + MySQL  
รองรับ 7 กระบวนการ (DFD Level 1): P1–P7

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express, Sequelize ORM |
| Database | MySQL |
| Auth | JWT + bcrypt |
| Upload | Multer (slip ภาพ) |

---

## วิธีติดตั้งและรัน

### ความต้องการของระบบ
- Node.js ≥ 18
- MySQL ≥ 8.0

### 1. Clone / เปิดโปรเจกต์

```bash
cd ProjectFinal
```

### 2. ตั้งค่า Database

สร้างฐานข้อมูลใน MySQL:
```sql
CREATE DATABASE karaokebooking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. ตั้งค่า Backend

```bash
cd backend
npm install
```

คัดลอกไฟล์ `.env`:
```bash
copy .env.example .env
```

แก้ไข `.env` ให้ตรงกับ MySQL ของคุณ:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=karaokebooking
DB_USER=root
DB_PASSWORD=yourpassword
JWT_SECRET=supersecretkey123
JWT_EXPIRES_IN=7d
```

### 4. Seed ข้อมูลทดสอบ

```bash
node src/seed.js
```

### 5. รัน Backend

```bash
npm run dev
```

Backend จะรันที่ `http://localhost:5000`  
Database จะ sync อัตโนมัติเมื่อ server เริ่มต้น

### 6. ตั้งค่าและรัน Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend จะรันที่ `http://localhost:3000`  
API proxy ไปที่ `http://localhost:5000` อัตโนมัติ

---

## บัญชีทดสอบ

| บทบาท | Email | Password | Login ที่ |
|-------|-------|----------|-----------|
| เจ้าของ (Admin) | admin@karaoke.com | admin1234 | หน้า Login (เลือก "พนักงาน") |
| พนักงาน (Staff) | staff@karaoke.com | staff1234 | หน้า Login (เลือก "พนักงาน") |
| ลูกค้า 1 | member@karaoke.com | member1234 | หน้า Login (เลือก "ลูกค้า") |
| ลูกค้า 2 | member2@karaoke.com | member1234 | หน้า Login (เลือก "ลูกค้า") |

---

## ห้องทั้งหมด (3 ห้อง)

| ห้อง | ประเภท | ความจุ | ราคา/ชม. |
|------|--------|--------|----------|
| S | ຫ້ອງນ້ອຍ (เล็ก) | 4 คน | ฿300 |
| M | ຫ້ອງກາງ (กลาง) | 8 คน | ฿500 |
| L | ຫ້ອງໃຫຍ່ (ใหญ่) | 15 คน | ฿800 |

---

## Demo Scenarios (หลัง Seed)

| ห้อง | สถานะ | สำหรับสาธิต |
|------|-------|-------------|
| S | pending | ลูกค้า 1 จองแล้ว ยังไม่ส่ง slip มัดจำ |
| M | confirmed | มัดจำยืนยันแล้ว รอ check-in (ลูกค้า 2) |
| L | checked_in | กำลังใช้งาน (ลูกค้า 1) |
| S | completed + review | การจองเก่า มีรีวิว 5 ดาว (ลูกค้า 2) |

---

## Flow การใช้งานครบวงจร

### ฝั่งลูกค้า
1. **สมัครสมาชิก** → `/register`
2. **เข้าสู่ระบบ** → `/login` (เลือก "ลูกค้า")
3. **ดูห้อง** → `/rooms` (เช็คว่างได้ตามวัน/เวลา)
4. **จองห้อง** → กดปุ่ม "จองห้องนี้"
5. **อัปโหลด slip มัดจำ** → หน้า "การจองของฉัน"
6. **Check-in** → กดปุ่ม "ฉันมาถึงแล้ว" (รอ staff ยืนยัน)
7. **ชำระเงินส่วนที่เหลือ** → อัปโหลด slip
8. **ต่อเวลา** (ถ้าต้องการ) → กดปุ่ม "ต่อเวลาการใช้ห้อง"
9. **Check-out** → กดปุ่ม "ออกจากห้อง"
10. **รีวิว** → `/reviews`

### ฝั่งพนักงาน (Staff/Admin)
1. **เข้าสู่ระบบ** → `/login` (เลือก "พนักงาน")
2. **Staff Dashboard** → `/staff`
   - ยืนยันมัดจำ
   - ยืนยัน check-in / check-out
   - ยืนยันการชำระเงิน
   - ย้ายห้อง
3. **Admin Panel** → `/admin` (admin เท่านั้น)
   - จัดการห้อง / ประเภทห้อง / พนักงาน / สมาชิก
4. **รายงาน** → `/reports` (admin เท่านั้น)
   - รายงานการจองประจำวัน
   - รายงานรายรับ
   - สถิติห้อง
   - ข้อมูลลูกค้า

---

## โครงสร้างโปรเจกต์

```
ProjectFinal/
├── backend/
│   ├── src/
│   │   ├── config/       database.js
│   │   ├── controllers/  authController, bookingController,
│   │   │                 paymentController, roomController,
│   │   │                 adminController, reportController,
│   │   │                 reviewController
│   │   ├── middleware/   auth.js, upload.js
│   │   ├── models/       User, Employee, Room, RoomType,
│   │   │                 Booking, Payment, RoomTransfer, Review
│   │   ├── routes/       auth, rooms, bookings, payments,
│   │   │                 admin, reports, reviews
│   │   ├── app.js
│   │   └── seed.js
│   ├── uploads/          (slip images)
│   └── .env
└── frontend/
    └── src/
        ├── api/          axios.js
        ├── components/   Navbar, ProtectedRoute
        ├── context/      AuthContext
        └── pages/        HomePage, LoginPage, RegisterPage,
                          RoomsPage, BookingPage, MyBookingsPage,
                          ProfilePage, StaffDashboardPage,
                          AdminPage, ReportsPage, ReviewPage
```

---

## API Endpoints สรุป

| Process | Method | Endpoint |
|---------|--------|----------|
| P2 Auth | POST | `/api/auth/register` `/api/auth/login` `/api/auth/employee/login` |
| P2 Profile | GET/PUT | `/api/auth/me` `/api/auth/profile` |
| P1 Rooms | CRUD | `/api/rooms` `/api/rooms/types` |
| P1 Admin | CRUD | `/api/users` `/api/employees` `/api/room-types` |
| P3 Booking | POST | `/api/bookings` |
| P3 Deposit | PATCH | `/api/bookings/:id/deposit` |
| P3 Extend | PATCH | `/api/bookings/:id/extend` |
| P3 Transfer | PATCH | `/api/bookings/:id/transfer` |
| P4 Check-in | PATCH | `/api/bookings/:id/checkin` `/api/bookings/:id/checkin/confirm` |
| P4 Check-out | PATCH | `/api/bookings/:id/checkout` `/api/bookings/:id/checkout/confirm` |
| P5 Payment | POST/PATCH | `/api/payments` `/api/payments/:id/confirm` |
| P6 Reports | GET | `/api/reports/bookings` `/api/reports/revenue` `/api/reports/rooms` `/api/reports/customers` |
| P7 Reviews | POST/GET | `/api/reviews` `/api/reviews/room/:id` `/api/reviews/my` |
