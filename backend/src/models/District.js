const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const District = sequelize.define('District', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  province_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'districts',
  timestamps: false,
});

module.exports = District;
