const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Village = sequelize.define('Village', {
  v_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  d_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'villages',
  timestamps: false,
});

module.exports = Village;
