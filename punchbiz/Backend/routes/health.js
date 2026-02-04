const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/health - Get health records for a cow (isolated)
router.get('/', auth, async (req, res) => {
    try {
        const HealthRecord = req.db.model('HealthRecord');
        const { cowId } = req.query;
        let query = {}; // Isolation handled by req.db
        if (cowId) query.cowId = cowId;

        const records = await HealthRecord.find(query).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/health - Add a new health record (isolated)
router.post('/', auth, async (req, res) => {
    try {
        const HealthRecord = req.db.model('HealthRecord');
        const recordData = {
            ...req.body,
            userId: req.user.id
        };

        const healthRecord = new HealthRecord(recordData);
        const newRecord = await healthRecord.save();
        res.status(201).json(newRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
