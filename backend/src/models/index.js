const sequelize = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Employee = require('./Employee');
const Province = require('./Province');
const District = require('./District');
const Village = require('./Village');
const RoomType = require('./RoomType');
const Room = require('./Room');
const Booking = require('./Booking');
const Payment = require('./Payment');
const Review = require('./Review');

// User 1:1 Customer
User.hasOne(Customer, { foreignKey: 'u_id', as: 'customer', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'u_id', as: 'user' });

// User 1:1 Employee
User.hasOne(Employee, { foreignKey: 'u_id', as: 'employee', onDelete: 'CASCADE' });
Employee.belongsTo(User, { foreignKey: 'u_id', as: 'user' });

// Province -> District -> Village
Province.hasMany(District, { foreignKey: 'p_id', as: 'districts' });
District.belongsTo(Province, { foreignKey: 'p_id', as: 'province' });

District.hasMany(Village, { foreignKey: 'd_id', as: 'villages' });
Village.belongsTo(District, { foreignKey: 'd_id', as: 'district' });

// Village -> Employee
Village.hasMany(Employee, { foreignKey: 'v_id', as: 'employees' });
Employee.belongsTo(Village, { foreignKey: 'v_id', as: 'village' });

// RoomType <-> Room
RoomType.hasMany(Room, { foreignKey: 'rtype_id', as: 'rooms' });
Room.belongsTo(RoomType, { foreignKey: 'rtype_id', as: 'roomType' });

// User <-> Booking
User.hasMany(Booking, { foreignKey: 'u_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'u_id', as: 'user' });

// Room <-> Booking
Room.hasMany(Booking, { foreignKey: 'r_id', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'r_id', as: 'room' });

// Booking <-> Payment
Booking.hasMany(Payment, { foreignKey: 'b_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'b_id', as: 'booking' });

// Booking <-> Review (1:1)
Booking.hasOne(Review, { foreignKey: 'b_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'b_id', as: 'booking' });
User.hasMany(Review, { foreignKey: 'u_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'u_id', as: 'user' });
Room.hasMany(Review, { foreignKey: 'r_id', as: 'reviews' });
Review.belongsTo(Room, { foreignKey: 'r_id', as: 'room' });

module.exports = { sequelize, User, Customer, Employee, Province, District, Village, RoomType, Room, Booking, Payment, Review };
