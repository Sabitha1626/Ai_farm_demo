const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const MilkProduction = req.db.model('MilkProduction');
        const { cowId, startDate } = req.query;
        let query = {}; // Isolation handled by req.db

        if (cowId) {
            query.cowId = cowId;
        }

        if (startDate) {
            query.recordedAt = { $gte: new Date(startDate) };
        }

        const records = await MilkProduction.find(query).sort({ recordedAt: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const MilkProduction = req.db.model('MilkProduction');
        const record = new MilkProduction({
            ...req.body,
            userId: req.user.id
        });
        const newRecord = await record.save();
        res.status(201).json(newRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
