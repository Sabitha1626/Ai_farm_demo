const mongoose = require('mongoose');

const BreedingEventSchema = new mongoose.Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    eventType: { type: String, required: true }, // Insemination, PregnancyCheck, Calving, etc.
    eventDate: { type: Date, required: true },
    description: { type: String },
    status: { type: String }, // Scheduled, Completed, Failed
    notes: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BreedingEvent', BreedingEventSchema);
