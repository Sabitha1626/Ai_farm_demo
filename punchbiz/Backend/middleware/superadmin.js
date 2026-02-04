const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied. Superadmin role required.' });
        }
        next();
    } catch (err) {
        console.error('Superadmin middleware error:', err);
        res.status(500).send('Server error');
    }
};
