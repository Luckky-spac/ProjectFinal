const sequelize = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Employee = require('./Employee');
const Province = require('./Province');
const District = require('./District');
const Village = require('./Village');
const Address = require('./Address');
const RoomType = require('./RoomType');
const Room = require('./Room');
const Booking = require('./Booking');
const Payment = require('./Payment');
const RoomTransfer = require('./RoomTransfer');
const Review = require('./Review');

// User 1:1 Customer
User.hasOne(Customer, { foreignKey: 'u_id', as: 'customer', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'u_id', as: 'user' });

// User 1:1 Employee
User.hasOne(Employee, { foreignKey: 'u_id', as: 'employee', onDelete: 'CASCADE' });
Employee.belongsTo(User, { foreignKey: 'u_id', as: 'user' });

// Province -> District -> Village -> Address -> Employee
Province.hasMany(District, { foreignKey: 'p_id', as: 'districts' });
District.belongsTo(Province, { foreignKey: 'p_id', as: 'province' });

District.hasMany(Village, { foreignKey: 'd_id', as: 'villages' });
Village.belongsTo(District, { foreignKey: 'd_id', as: 'district' });

Province.hasMany(Address, { foreignKey: 'p_id', as: 'addresses' });
Address.belongsTo(Province, { foreignKey: 'p_id', as: 'province' });

District.hasMany(Address, { foreignKey: 'd_id', as: 'addresses' });
Address.belongsTo(District, { foreignKey: 'd_id', as: 'district' });

Village.hasMany(Address, { foreignKey: 'v_id', as: 'addresses' });
Address.belongsTo(Village, { foreignKey: 'v_id', as: 'village' });

Address.hasMany(Employee, { foreignKey: 'add_id', as: 'employees' });
Employee.belongsTo(Address, { foreignKey: 'add_id', as: 'address' });

// RoomType <-> Room
RoomType.hasMany(Room, { foreignKey: 'rtype_id', as: 'rooms' });
Room.belongsTo(RoomType, { foreignKey: 'rtype_id', as: 'roomType' });

// User (ລູກຄ້າ) <-> Booking
User.hasMany(Booking, { foreignKey: 'u_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'u_id', as: 'user' });

// Room <-> Booking
Room.hasMany(Booking, { foreignKey: 'r_id', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'r_id', as: 'room' });

// User (staff/admin) ທີ່ confirm booking
User.hasMany(Booking, { foreignKey: 'confirmed_by', as: 'confirmedBookings' });
Booking.belongsTo(User, { foreignKey: 'confirmed_by', as: 'confirmedBy' });

// Booking <-> Payment
Booking.hasMany(Payment, { foreignKey: 'b_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'b_id', as: 'booking' });

// User (staff/admin) ທີ່ confirm payment
User.hasMany(Payment, { foreignKey: 'confirmed_by', as: 'confirmedPayments' });
Payment.belongsTo(User, { foreignKey: 'confirmed_by', as: 'confirmedBy' });

// Booking <-> RoomTransfer
Booking.hasMany(RoomTransfer, { foreignKey: 'b_id', as: 'transfers' });
RoomTransfer.belongsTo(Booking, { foreignKey: 'b_id', as: 'booking' });
Room.hasMany(RoomTransfer, { foreignKey: 'from_r_id', as: 'transfersFrom' });
RoomTransfer.belongsTo(Room, { foreignKey: 'from_r_id', as: 'fromRoom' });
Room.hasMany(RoomTransfer, { foreignKey: 'to_r_id', as: 'transfersTo' });
RoomTransfer.belongsTo(Room, { foreignKey: 'to_r_id', as: 'toRoom' });

// User (staff/admin) ທີ່ຍ້າຍຫ້ອງ
User.hasMany(RoomTransfer, { foreignKey: 'transferred_by', as: 'transfers' });
RoomTransfer.belongsTo(User, { foreignKey: 'transferred_by', as: 'transferredBy' });

// Booking <-> Review (1:1)
Booking.hasOne(Review, { foreignKey: 'b_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'b_id', as: 'booking' });
User.hasMany(Review, { foreignKey: 'u_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'u_id', as: 'user' });
Room.hasMany(Review, { foreignKey: 'r_id', as: 'reviews' });
Review.belongsTo(Room, { foreignKey: 'r_id', as: 'room' });

module.exports = { sequelize, User, Customer, Employee, Province, District, Village, Address, RoomType, Room, Booking, Payment, RoomTransfer, Review };
