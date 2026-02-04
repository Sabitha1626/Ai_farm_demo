const mongoose = require('mongoose');

const RegistrationTokenSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } // 10 minutes
});

module.exports = mongoose.model('RegistrationToken', RegistrationTokenSchema);
