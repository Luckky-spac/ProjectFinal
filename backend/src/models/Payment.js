const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  type: { type: DataTypes.ENUM('deposit', 'final'), allowNull: false },
  method: { type: DataTypes.ENUM('cash', 'transfer'), defaultValue: 'transfer' },
  slip_url: { type: DataTypes.STRING(500) },
  confirmed_by: { type: DataTypes.INTEGER },
  confirmed_at: { type: DataTypes.DATE },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'rejected'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'payments',
  timestamps: true,
});

module.exports = Payment;
