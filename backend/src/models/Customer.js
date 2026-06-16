const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  gender: { type: DataTypes.ENUM('male', 'female', 'other') },
  birthday: { type: DataTypes.DATEONLY },
  address: { type: DataTypes.TEXT },
  avatar_url: { type: DataTypes.STRING(500) },
}, {
  tableName: 'customers',
  timestamps: true,
});

module.exports = Customer;
