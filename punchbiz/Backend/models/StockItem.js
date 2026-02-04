const mongoose = require('mongoose');

const StockItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isPurchased: { type: Boolean, default: false },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockItem', StockItemSchema);
