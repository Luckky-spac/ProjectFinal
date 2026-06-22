const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  pay_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  b_id:         { type: DataTypes.INTEGER, allowNull: false },
  amount:       { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  type:         { type: DataTypes.ENUM('deposit', 'final'), allowNull: false },
  method:       { type: DataTypes.ENUM('cash', 'QR'), defaultValue: 'QR' },
  status:       { type: DataTypes.ENUM('pending', 'confirmed', 'rejected'), defaultValue: 'pending' },
}, {
  tableName: 'payments',
  timestamps: true,
});

module.exports = Payment;
