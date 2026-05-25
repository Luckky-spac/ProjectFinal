const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  role: { type: DataTypes.ENUM('member'), defaultValue: 'member' },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
