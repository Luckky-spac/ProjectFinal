const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomType = sequelize.define('RoomType', {
  rtype_id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:         { type: DataTypes.STRING(100), allowNull: false },
  description:  { type: DataTypes.TEXT },
  capacity:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 },
  price_per_hour: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  amenities:    { type: DataTypes.TEXT },
  image_url:    { type: DataTypes.STRING(500) },
}, {
  tableName: 'room_types',
  timestamps: true,
});

module.exports = RoomType;
