const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all alerts (isolated in tenant DB)
router.get('/', auth, async (req, res) => {
    try {
        const Alert = req.db.model('Alert');
        const alerts = await Alert.find({ isDismissed: { $ne: true } })
            .populate('cowId', 'name tagNumber')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark alert as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const Alert = req.db.model('Alert');
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        res.json(alert);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Dismiss alert
router.put('/:id/dismiss', auth, async (req, res) => {
    try {
        const Alert = req.db.model('Alert');
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { isDismissed: true },
            { new: true }
        );
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        res.json(alert);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
