const jwt = require('jsonwebtoken');
const ApiKey = require('../models/ApiKey');
const { getTenantConnection } = require('../utils/tenantManager');

/**
 * Flexible authentication middleware
 * Accepts either JWT token (x-auth-token) or API key (x-api-key)
 */
module.exports = async function (req, res, next) {
    // Check for API key first
    const apiKey = req.header('x-api-key');

    if (apiKey) {
        try {
            // Find the API key in the database
            const keyRecord = await ApiKey.findOne({ key: apiKey, isActive: true });

            if (!keyRecord) {
                return res.status(401).json({ message: 'Invalid API key' });
            }

            // Check if key has expired
            if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
                return res.status(401).json({ message: 'API key has expired' });
            }

            // Update last used timestamp (don't await to avoid slowing down request)
            keyRecord.lastUsed = new Date();
            keyRecord.save().catch(err => console.error('Error updating API key last used:', err));

            // Attach user info to request
            req.user = { id: keyRecord.userId };

            // Attach tenant database connection
            req.db = await getTenantConnection(keyRecord.userId);

            return next();
        } catch (err) {
            console.error('API Key auth error:', err);
            return res.status(401).json({ message: 'API key authentication failed' });
        }
    }

    // Fall back to JWT token authentication
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: 'No authentication token or API key provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;

        // Attach tenant database connection
        req.db = await getTenantConnection(req.user.id);

        next();
    } catch (err) {
        console.error('JWT auth error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
