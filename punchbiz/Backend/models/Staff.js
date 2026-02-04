const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    isAbsent: { type: Boolean, default: false },
    absentReason: { type: String },
    absentSince: { type: Date },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Staff', StaffSchema);
