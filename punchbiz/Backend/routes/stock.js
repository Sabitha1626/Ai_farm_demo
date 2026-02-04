const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get stock items for a specific month and year (isolated)
router.get('/', auth, async (req, res) => {
    try {
        const StockItem = req.db.model('StockItem');
        const { month, year } = req.query;
        let query = {}; // Isolation handled by req.db
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);

        const items = await StockItem.find(query);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create stock items (single or bulk)
router.post('/', auth, async (req, res) => {
    try {
        const StockItem = req.db.model('StockItem');
        if (Array.isArray(req.body)) {
            const itemsWithUser = req.body.map(item => ({ ...item, userId: req.user.id }));
            const items = await StockItem.insertMany(itemsWithUser);
            res.status(201).json(items);
        } else {
            const item = new StockItem({ ...req.body, userId: req.user.id });
            const newItem = await item.save();
            res.status(201).json(newItem);
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update stock item (ensure it exists in tenant DB)
router.put('/:id', auth, async (req, res) => {
    try {
        const StockItem = req.db.model('StockItem');
        const updatedItem = await StockItem.findOneAndUpdate(
            { _id: req.params.id },
            req.body,
            { new: true }
        );
        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete stock item
router.delete('/:id', auth, async (req, res) => {
    try {
        const StockItem = req.db.model('StockItem');
        const deletedItem = await StockItem.findOneAndDelete({ _id: req.params.id });
        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
