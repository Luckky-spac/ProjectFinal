const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  room_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.TINYINT, allowNull: false },
  comment: { type: DataTypes.TEXT },
}, {
  tableName: 'reviews',
  timestamps: true,
  updatedAt: false,
});

module.exports = Review;
