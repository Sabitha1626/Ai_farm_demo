const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Breeding Events
router.get('/breeding', auth, async (req, res) => {
    try {
        const BreedingEvent = req.db.model('BreedingEvent');
        const events = await BreedingEvent.find({})
            .populate('cowId', 'name tagNumber')
            .sort({ date: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/breeding', auth, async (req, res) => {
    try {
        const BreedingEvent = req.db.model('BreedingEvent');
        const event = new BreedingEvent({
            ...req.body,
            userId: req.user.id
        });
        const newEvent = await event.save();
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Heat Records
router.get('/heat', auth, async (req, res) => {
    try {
        const HeatRecord = req.db.model('HeatRecord');
        const { cowId, startDate } = req.query;
        let query = {};
        if (cowId) query.cowId = cowId;
        if (startDate) query.detectedAt = { $gte: new Date(startDate) };

        const records = await HeatRecord.find(query)
            .populate('cowId', 'name tagNumber')
            .sort({ detectedAt: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/heat', auth, async (req, res) => {
    try {
        const HeatRecord = req.db.model('HeatRecord');
        const record = new HeatRecord({
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
