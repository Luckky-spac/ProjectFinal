const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  detail: { type: DataTypes.STRING(255) },
  village_id: { type: DataTypes.INTEGER, allowNull: false },
  district_id: { type: DataTypes.INTEGER, allowNull: false },
  province_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'addresses',
  timestamps: false,
});

module.exports = Address;
