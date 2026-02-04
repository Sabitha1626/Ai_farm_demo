const jwt = require('jsonwebtoken');
const { getTenantConnection } = require('../utils/tenantManager');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;

        // Attach tenant database connection
        req.db = await getTenantConnection(req.user.id);

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).json({ message: 'Token is not valid or database connection failed' });
    }
};
