const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    key: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    lastUsed: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster lookups
ApiKeySchema.index({ key: 1 });
ApiKeySchema.index({ userId: 1 });

module.exports = mongoose.model('ApiKey', ApiKeySchema);
