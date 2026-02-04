const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemas = {};

// Cow Schema
schemas.Cow = new Schema({
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

// Staff Schema
schemas.Staff = new Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    isAbsent: { type: Boolean, default: false },
    absentReason: { type: String },
    absentSince: { type: Date },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// AttendanceRecord Schema
schemas.AttendanceRecord = new Schema({
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    checkIn: { type: Date, default: Date.now },
    checkOut: { type: Date },
    biometricType: { type: String },
    biometricId: { type: String },
    status: { type: String, enum: ['present', 'late', 'absent', 'early_out'], default: 'present' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// BreedingEvent Schema
schemas.BreedingEvent = new Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    type: { type: String, enum: ['Insemination', 'Pregnancy Check', 'Calving', 'Heat Detection'], required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'Pending' },
    notes: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// MilkProduction Schema
schemas.MilkProduction = new Schema({
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
    detectedAt: { type: Date, default: Date.now }, // Added for consistency with queries
    createdAt: { type: Date, default: Date.now }
});

// HealthRecord Schema
schemas.HealthRecord = new Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    date: { type: Date, default: Date.now },
    condition: { type: String, required: true },
    treatment: { type: String },
    medication: { type: String },
    dosage: { type: String },
    administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    cost: { type: Number },
    notes: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// HeatRecord Schema
schemas.HeatRecord = new Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    startTime: { type: Date }, // Optional now that detectedAt is used
    endTime: { type: Date },
    intensity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }, // Match route case
    confidence: { type: Number },
    aiConfidence: { type: Number }, // Added
    sensorType: { type: String }, // Added
    sensorReading: { type: Number }, // Added
    sensorId: { type: String }, // Added
    symptoms: [{ type: String }], // Added
    notes: { type: String }, // Added
    detectedBy: { type: String, enum: ['Manual', 'Sensor', 'AI'], default: 'Manual' },
    status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    detectedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Alert Schema
schemas.Alert = new Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow' },
    type: { type: String, enum: ['Health', 'Breeding', 'System'], default: 'Breeding' },
    alertType: { type: String }, // Added (e.g., 'heat_detected')
    title: { type: String }, // Added
    heatRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeatRecord' }, // Added
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
    sensorType: { type: String }, // Added
    sensorReading: { type: Number }, // Added
    optimalBreedingStart: { type: Date }, // Added
    optimalBreedingEnd: { type: Date }, // Added
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// StockItem Schema
schemas.StockItem = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    minStockLevel: { type: Number },
    price: { type: Number },
    supplier: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// ChatMessage Schema
schemas.ChatMessage = new Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// Sensor Schema (WeightSensorReading as proxy)
schemas.WeightSensorReading = new Schema({
    cowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
    weight: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    sensorId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAutomatic: { type: Boolean, default: false }, // Added
    recordedAt: { type: Date, default: Date.now }, // Added for consistency with queries
    createdAt: { type: Date, default: Date.now }
});

module.exports = schemas;
