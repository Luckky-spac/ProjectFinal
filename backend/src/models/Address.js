const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  add_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  detail: { type: DataTypes.STRING(255) },
  v_id:   { type: DataTypes.INTEGER, allowNull: false },
  d_id:   { type: DataTypes.INTEGER, allowNull: false },
  p_id:   { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'addresses',
  timestamps: false,
});

module.exports = Address;
