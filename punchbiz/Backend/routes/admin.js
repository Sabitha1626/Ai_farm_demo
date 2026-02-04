const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const superadmin = require('../middleware/superadmin');
const { getTenantConnection } = require('../utils/tenantManager');

// @route   GET api/admin/stats
// @desc    Get global statistics (total users, total cows)
// @access  Private (Superadmin)
router.get('/stats', [auth, superadmin], async (req, res) => {
    try {
        const users = await User.find({});
        const totalUsers = users.length;

        let totalCows = 0;
        for (const user of users) {
            const tenantDb = await getTenantConnection(user._id);
            const Cow = tenantDb.model('Cow');
            const cowCount = await Cow.countDocuments();
            totalCows += cowCount;
        }

        res.json({
            totalUsers,
            totalCows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/users
// @desc    Get all farmers (users) with their cow counts
// @access  Private (Superadmin)
router.get('/users', [auth, superadmin], async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        const usersWithStats = await Promise.all(users.map(async (user) => {
            try {
                const tenantDb = await getTenantConnection(user._id);
                const Cow = tenantDb.model('Cow');
                const cowCount = await Cow.countDocuments();
                return {
                    ...user._doc,
                    cowCount
                };
            } catch (err) {
                console.error(`Error fetching cows for user ${user.email}:`, err);
                return {
                    ...user._doc,
                    cowCount: 0
                };
            }
        }));

        res.json(usersWithStats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/users/:id/cows
// @desc    Get all cows for a specific user
// @access  Private (Superadmin)
router.get('/users/:id/cows', [auth, superadmin], async (req, res) => {
    try {
        const tenantDb = await getTenantConnection(req.params.id);
        const Cow = tenantDb.model('Cow');
        const cows = await Cow.find({}).sort({ createdAt: -1 });
        res.json(cows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
