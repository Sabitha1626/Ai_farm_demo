const mongoose = require('mongoose');

const HealthRecordSchema = new mongoose.Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    recordType: { type: String, required: true }, // Vaccination, Checkup, Surgery, etc.
    date: { type: Date, default: Date.now },
    diagnosis: { type: String },
    treatment: { type: String },
    medications: { type: String }, // Can be array of strings if structure allows
    veterinarian: { type: String },
    cost: { type: Number },
    notes: { type: String },
    followUpDate: { type: Date },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthRecord', HealthRecordSchema);
