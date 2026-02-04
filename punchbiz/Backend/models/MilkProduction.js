const mongoose = require('mongoose');

const MilkProductionSchema = new mongoose.Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    quantityLiters: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now },
    qualityGrade: { type: String },
    fatPercentage: { type: Number },
    proteinPercentage: { type: Number },
    isAutomatic: { type: Boolean, default: false },
    sensorId: { type: String },
    notes: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MilkProduction', MilkProductionSchema);
