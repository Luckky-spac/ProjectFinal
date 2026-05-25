const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  room_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  room_type_id: { type: DataTypes.INTEGER, allowNull: false },
  floor: { type: DataTypes.INTEGER, defaultValue: 1 },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'maintenance'),
    defaultValue: 'available',
  },
  image_url: { type: DataTypes.STRING(500) },
}, {
  tableName: 'rooms',
  timestamps: true,
});

module.exports = Room;
