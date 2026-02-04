const mongoose = require('mongoose');

const PasswordResetTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 600 } // Expires in 10 minutes for security
});

module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
