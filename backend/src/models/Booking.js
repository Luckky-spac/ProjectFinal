const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  b_id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  u_id:            { type: DataTypes.INTEGER, allowNull: false },
  r_id:            { type: DataTypes.INTEGER, allowNull: false },
  start_time:      { type: DataTypes.DATE, allowNull: false },
  end_time:        { type: DataTypes.DATE, allowNull: false },
  actual_check_in: { type: DataTypes.DATE },
  actual_check_out:{ type: DataTypes.DATE },
  guests:          { type: DataTypes.INTEGER, defaultValue: 1 },
  total_price:     { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  deposit_amount:  { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  deposit_slip:    { type: DataTypes.STRING(500) },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'checking_in', 'checked_in', 'checking_out', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  note:         { type: DataTypes.TEXT },
  confirmed_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'bookings',
  timestamps: true,
});

module.exports = Booking;
