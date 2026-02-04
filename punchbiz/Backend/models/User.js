const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    farmName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String, // In a real app, hash this!
        required: true,
    },
    avatarUrl: {
        type: String,
    },
    role: {
        type: String,
        enum: ['admin', 'staff', 'viewer'],
        default: 'admin'
    },
    tenantDbName: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('User', UserSchema);
