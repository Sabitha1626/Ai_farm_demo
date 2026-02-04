const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Receive weight reading (ensure authenticated)
router.post('/weight', auth, async (req, res) => {
    try {
        const { cowId, weight, sensorId } = req.body;
        const WeightSensorReading = req.db.model('WeightSensorReading');
        const Cow = req.db.model('Cow');

        // Save reading
        const reading = new WeightSensorReading({
            cowId,
            weight: weight,
            sensorId,
            userId: req.user.id,
            isAutomatic: true,
            recordedAt: new Date()
        });
        await reading.save();

        // Update cow's current weight (isolated in tenant DB)
        const updatedCow = await Cow.findOneAndUpdate(
            { _id: cowId },
            { weight: weight },
            { new: true }
        );

        if (!updatedCow) {
            return res.status(404).json({ message: 'Cow not found' });
        }

        res.status(201).json({ message: 'Weight recorded successfully', reading });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all weight readings (isolated in tenant DB)
router.get('/weight', auth, async (req, res) => {
    try {
        const WeightSensorReading = req.db.model('WeightSensorReading');
        const readings = await WeightSensorReading.find({})
            .sort({ recordedAt: -1 })
            .limit(100);
        res.json(readings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get weight readings for a cow (isolated in tenant DB)
router.get('/weight/:cowId', auth, async (req, res) => {
    try {
        const WeightSensorReading = req.db.model('WeightSensorReading');
        const readings = await WeightSensorReading.find({
            cowId: req.params.cowId
        }).sort({ recordedAt: -1 });
        res.json(readings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
