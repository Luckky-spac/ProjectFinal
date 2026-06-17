const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  cus_id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  u_id:     { type: DataTypes.INTEGER, allowNull: false, unique: true },
  fname:    { type: DataTypes.STRING(100), allowNull: false },
  lname:    { type: DataTypes.STRING(100) },
  phone:    { type: DataTypes.STRING(20) },
  gender:   { type: DataTypes.ENUM('male', 'female', 'other') },
  birthday: { type: DataTypes.DATEONLY },
  address:  { type: DataTypes.TEXT },
}, {
  tableName: 'customers',
  timestamps: true,
});

module.exports = Customer;
