const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  re_id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  b_id:    { type: DataTypes.INTEGER, allowNull: false, unique: true },
  u_id:    { type: DataTypes.INTEGER, allowNull: false },
  r_id:    { type: DataTypes.INTEGER, allowNull: false },
  rating:  { type: DataTypes.TINYINT, allowNull: false },
  comment: { type: DataTypes.TEXT },
}, {
  tableName: 'reviews',
  timestamps: true,
  updatedAt: false,
});

module.exports = Review;
