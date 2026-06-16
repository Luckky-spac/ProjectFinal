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
User.hasOne(Customer, { foreignKey: 'user_id', as: 'customer', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Province -> District -> Village -> Address -> Employee
Province.hasMany(District, { foreignKey: 'province_id', as: 'districts' });
District.belongsTo(Province, { foreignKey: 'province_id', as: 'province' });

District.hasMany(Village, { foreignKey: 'district_id', as: 'villages' });
Village.belongsTo(District, { foreignKey: 'district_id', as: 'district' });

Province.hasMany(Address, { foreignKey: 'province_id', as: 'addresses' });
Address.belongsTo(Province, { foreignKey: 'province_id', as: 'province' });

District.hasMany(Address, { foreignKey: 'district_id', as: 'addresses' });
Address.belongsTo(District, { foreignKey: 'district_id', as: 'district' });

Village.hasMany(Address, { foreignKey: 'village_id', as: 'addresses' });
Address.belongsTo(Village, { foreignKey: 'village_id', as: 'village' });

Address.hasMany(Employee, { foreignKey: 'address_id', as: 'employees' });
Employee.belongsTo(Address, { foreignKey: 'address_id', as: 'address' });

// RoomType <-> Room
RoomType.hasMany(Room, { foreignKey: 'room_type_id', as: 'rooms' });
Room.belongsTo(RoomType, { foreignKey: 'room_type_id', as: 'roomType' });

// User (ลูกค้า) <-> Booking
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Room <-> Booking
Room.hasMany(Booking, { foreignKey: 'room_id', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// Employee (พนักงาน) ที่ confirm booking
Employee.hasMany(Booking, { foreignKey: 'confirmed_by', as: 'confirmedBookings' });
Booking.belongsTo(Employee, { foreignKey: 'confirmed_by', as: 'confirmedByEmployee' });

// Booking <-> Payment
Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Employee ที่ confirm payment
Employee.hasMany(Payment, { foreignKey: 'confirmed_by', as: 'confirmedPayments' });
Payment.belongsTo(Employee, { foreignKey: 'confirmed_by', as: 'confirmedByEmployee' });

// Booking <-> RoomTransfer
Booking.hasMany(RoomTransfer, { foreignKey: 'booking_id', as: 'transfers' });
RoomTransfer.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
Room.hasMany(RoomTransfer, { foreignKey: 'from_room_id', as: 'transfersFrom' });
Room.hasMany(RoomTransfer, { foreignKey: 'to_room_id', as: 'transfersTo' });

// Employee ที่ย้ายห้อง
Employee.hasMany(RoomTransfer, { foreignKey: 'transferred_by', as: 'transfers' });
RoomTransfer.belongsTo(Employee, { foreignKey: 'transferred_by', as: 'transferredByEmployee' });

// Booking <-> Review (1:1)
Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Room.hasMany(Review, { foreignKey: 'room_id', as: 'reviews' });
Review.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

module.exports = { sequelize, User, Customer, Employee, Province, District, Village, Address, RoomType, Room, Booking, Payment, RoomTransfer, Review };
