const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomTransfer = sequelize.define('RoomTransfer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  from_room_id: { type: DataTypes.INTEGER, allowNull: false },
  to_room_id: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.TEXT },
  transferred_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'room_transfers',
  timestamps: true,
  updatedAt: false,
});

module.exports = RoomTransfer;
