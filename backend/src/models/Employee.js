const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  emp_id:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  u_id:      { type: DataTypes.INTEGER, allowNull: false, unique: true },
  name:      { type: DataTypes.STRING(100), allowNull: false },
  phone:     { type: DataTypes.STRING(20) },
  position:  { type: DataTypes.STRING(100), allowNull: false },
  status:    { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  gender:    { type: DataTypes.ENUM('male', 'female', 'other') },
  birthday:  { type: DataTypes.DATEONLY },
  hire_date: { type: DataTypes.DATEONLY },
  add_id:    { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'employees',
  timestamps: true,
});

module.exports = Employee;
