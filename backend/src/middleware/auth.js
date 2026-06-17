const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// เฉพาะลูกค้า (role = member)
const isUser = (req, res, next) => {
  if (req.user?.role !== 'member') {
    return res.status(403).json({ message: 'เฉพาะลูกค้าเท่านั้น' });
  }
  next();
};

// เฉพาะพนักงาน/เจ้าของ (role = admin หรือ staff)
const isEmployee = (req, res, next) => {
  if (!['admin', 'staff'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'เฉพาะพนักงานเท่านั้น' });
  }
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { authenticate, isUser, isEmployee, authorize };
