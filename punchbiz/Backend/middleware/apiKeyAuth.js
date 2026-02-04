const ApiKey = require('../models/ApiKey');
const { getTenantConnection } = require('../utils/tenantManager');

/**
 * Middleware to authenticate requests using API keys
 * Checks for API key in x-api-key header
 * Falls back to JWT auth if no API key is provided
 */
module.exports = async function (req, res, next) {
    // Check for API key in header
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
        // No API key provided, continue to next middleware (could be JWT auth)
        return next();
    }

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

        // Update last used timestamp
        keyRecord.lastUsed = new Date();
        await keyRecord.save();

        // Attach user info to request
        req.user = { id: keyRecord.userId };

        // Attach tenant database connection
        req.db = await getTenantConnection(keyRecord.userId);

        next();
    } catch (err) {
        console.error('API Key auth error:', err);
        res.status(401).json({ message: 'API key authentication failed' });
    }
};
