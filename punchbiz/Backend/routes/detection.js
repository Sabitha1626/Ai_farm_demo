const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Process heat detection from AI/Sensor (authenticated)
router.post('/heat', auth, async (req, res) => {
    try {
        const { cowId, sensorType, sensorReading, intensity, symptoms, aiConfidence } = req.body;
        const Cow = req.db.model('Cow');
        const HeatRecord = req.db.model('HeatRecord');
        const Alert = req.db.model('Alert');

        if (!cowId) {
            return res.status(400).json({ error: "Missing required fields: cowId" });
        }

        const userId = req.user.id;
        console.log(`Processing heat detection for cow ${cowId} by user ${userId}`);

        // 1. Insert Heat Record
        const heatRecord = new HeatRecord({
            cowId,
            userId,
            sensorType: sensorType || "activity_sensor",
            sensorReading: sensorReading || null,
            intensity: intensity || "medium",
            symptoms: symptoms || [],
            sensorId: req.body.sensorId,
            aiConfidence: aiConfidence || null,
            notes: req.body.notes || (symptoms ? symptoms.join(', ') : ''),
            detectedAt: req.body.detectedAt ? new Date(req.body.detectedAt) : new Date()
        });
        await heatRecord.save();

        // 2. Calculate optimal breeding window (12-18 hours after detection)
        const detectedAt = heatRecord.detectedAt;
        const optimalStart = new Date(detectedAt.getTime() + 12 * 60 * 60 * 1000);
        const optimalEnd = new Date(detectedAt.getTime() + 18 * 60 * 60 * 1000);

        // 3. Get Cow Info (isolated in tenant DB)
        const cow = await Cow.findOne({ _id: cowId });
        const cowName = cow ? (cow.name || cow.tagNumber) : "Unknown Cow";

        // 4. Create Alert
        const severity = intensity === "high" ? "high" : intensity === "low" ? "low" : "medium";
        const alert = new Alert({
            cowId,
            userId,
            heatRecordId: heatRecord._id,
            title: `Heat Detected: ${cowName}`,
            message: `Heat detected with ${intensity || "medium"} intensity. Optimal breeding window: ${optimalStart.toLocaleString()} - ${optimalEnd.toLocaleString()}`,
            alertType: "heat_detected",
            severity,
            sensorType: sensorType || null,
            sensorReading: sensorReading || null,
            optimalBreedingStart: optimalStart,
            optimalBreedingEnd: optimalEnd
        });
        await alert.save();

        // 5. Update Cow Status
        if (cow) {
            cow.status = 'In Heat';
            cow.updatedAt = new Date();
            await cow.save();
        }

        res.status(200).json({
            success: true,
            heatRecord,
            alert,
            optimalBreedingWindow: {
                start: optimalStart,
                end: optimalEnd
            }
        });

    } catch (error) {
        console.error("Heat detection error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
