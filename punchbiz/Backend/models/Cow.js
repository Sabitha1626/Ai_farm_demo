const mongoose = require('mongoose');

const CowSchema = new mongoose.Schema({
    name: { type: String, required: true },
    tagNumber: { type: String, required: true, unique: true },
    breed: { type: String },
    dateOfBirth: { type: Date },
    weight: { type: Number },
    status: {
        type: String,
        enum: ['Healthy', 'Sick', 'Pregnant', 'Dry', 'Lactating', 'In Heat'],
        default: 'Healthy'
    },
    imageUrl: { type: String },
    notes: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cow', CowSchema);
