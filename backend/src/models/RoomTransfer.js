const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomTransfer = sequelize.define('RoomTransfer', {
  tr_id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  b_id:           { type: DataTypes.INTEGER, allowNull: false },
  from_r_id:      { type: DataTypes.INTEGER, allowNull: false },
  to_r_id:        { type: DataTypes.INTEGER, allowNull: false },
  reason:         { type: DataTypes.TEXT },
  transferred_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'room_transfers',
  timestamps: true,
});

module.exports = RoomTransfer;
