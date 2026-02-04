const mongoose = require('mongoose');

const WeightSensorReadingSchema = new mongoose.Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    weightKg: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now },
    isAutomatic: { type: Boolean, default: true },
    sensorId: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WeightSensorReading', WeightSensorReadingSchema);
