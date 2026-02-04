const mongoose = require('mongoose');

const HeatRecordSchema = new mongoose.Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    detectedAt: { type: Date, default: Date.now },
    intensity: { type: String }, // High, Medium, Low
    sensorType: { type: String },
    sensorReading: { type: Number },
    symptoms: [{ type: String }],
    sensorId: { type: String },
    aiConfidence: { type: Number },
    notes: { type: String },
    isDismissed: { type: Boolean, default: false },
    isInseminated: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HeatRecord', HeatRecordSchema);
