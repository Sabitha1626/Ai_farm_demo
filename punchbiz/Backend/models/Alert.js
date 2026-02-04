const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    heatRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeatRecord' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    alertType: { type: String, required: true }, // heat_detected, health_issue, etc.
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    sensorType: { type: String },
    sensorReading: { type: String },
    optimalBreedingStart: { type: Date },
    optimalBreedingEnd: { type: Date },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', AlertSchema);
