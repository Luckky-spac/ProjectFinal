const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  position: { type: DataTypes.STRING(100), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'staff'), defaultValue: 'staff' },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  hire_date: { type: DataTypes.DATEONLY },
}, {
  tableName: 'employees',
  timestamps: true,
});

module.exports = Employee;
