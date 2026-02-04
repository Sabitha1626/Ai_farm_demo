const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const Staff = req.db.model('Staff');
        const { isAbsent } = req.query;
        let query = {}; // Isolation handled by req.db
        if (isAbsent !== undefined) query.isAbsent = isAbsent === 'true';

        const staff = await Staff.find(query);
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const Staff = req.db.model('Staff');
        const staffMember = new Staff({
            ...req.body,
            userId: req.user.id
        });
        const newStaff = await staffMember.save();
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Attendance Records
router.get('/attendance', auth, async (req, res) => {
    try {
        const AttendanceRecord = req.db.model('AttendanceRecord');
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.checkIn = {};
            if (startDate) query.checkIn.$gte = new Date(startDate);
            if (endDate) query.checkIn.$lte = new Date(endDate);
        }

        const records = await AttendanceRecord.find(query)
            .populate('staffId', 'name role')
            .sort({ checkIn: -1 });

        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Check-in
router.post('/check-in', auth, async (req, res) => {
    try {
        const AttendanceRecord = req.db.model('AttendanceRecord');
        const { staffId, biometricType, biometricId } = req.body;

        const record = new AttendanceRecord({
            staffId,
            biometricType,
            biometricId,
            status: 'present',
            userId: req.user.id
        });

        await record.save();
        res.status(201).json(record);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Check-out
router.put('/check-out/:id', auth, async (req, res) => {
    try {
        const AttendanceRecord = req.db.model('AttendanceRecord');
        const record = await AttendanceRecord.findByIdAndUpdate(
            req.params.id,
            { checkOut: new Date() },
            { new: true }
        );

        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
