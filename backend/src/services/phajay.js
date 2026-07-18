const axios = require('axios');
const { io } = require('socket.io-client');

const SECRET_KEY = process.env.PHAJAY_SECRET_KEY;
const GATEWAY_URL = 'https://payment-gateway.phajay.co';

// ตอนนี้ธุรกิจใช้ BCEL One รับเงิน — ถ้าจะรองรับธนาคารอื่นเพิ่ม ให้เปลี่ยน endpoint ตรงนี้
const GENERATE_QR_URL = `${GATEWAY_URL}/v1/api/payment/generate-bcel-qr`;

async function generateQR({ amount, description, tag1, tag2, tag3 }) {
  const { data } = await axios.post(
    GENERATE_QR_URL,
    { amount, description, tag1, tag2, tag3 },
    { headers: { secretKey: SECRET_KEY, 'Content-Type': 'application/json' } }
  );
  return data; // { message, transactionId, qrCode, link }
}

// SocketIO real-time — ใช้แทน webhook เพราะ backend รันบน localhost ยังไม่มี public URL
// onPaymentConfirmed(payload) จะถูกเรียกทุกครั้งที่ PhaJay แจ้งว่ามีการจ่ายเงินสำเร็จ
function startPhajaySocket(onPaymentConfirmed) {
  const socket = io(GATEWAY_URL);

  socket.on('connect', () => {
    console.log('[phajay] socket connected');
  });

  socket.on(`join::${SECRET_KEY}`, (data) => {
    console.log('[phajay] payment event received:', data?.transactionId, data?.status);
    onPaymentConfirmed(data);
  });

  socket.on('disconnect', () => {
    console.log('[phajay] socket disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('[phajay] socket connect_error:', err.message);
  });

  return socket;
}

module.exports = { generateQR, startPhajaySocket };
