const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const ApiKey = require('../models/ApiKey');

/**
 * Generate a secure random API key
 */
function generateApiKey() {
    return 'aifarm_' + crypto.randomBytes(32).toString('hex');
}

/**
 * @route   POST /api/api-keys
 * @desc    Create a new API key for the authenticated user
 * @access  Private (requires JWT authentication)
 */
router.post('/', auth, async (req, res) => {
    try {
        const { name, expiresInDays } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'API key name is required' });
        }

        // Generate unique API key
        const key = generateApiKey();

        // Calculate expiration date if provided
        let expiresAt = null;
        if (expiresInDays && expiresInDays > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        const apiKey = new ApiKey({
            userId: req.user.id,
            key: key,
            name: name,
            expiresAt: expiresAt
        });

        await apiKey.save();

        res.json({
            message: 'API key created successfully',
            apiKey: {
                id: apiKey._id,
                name: apiKey.name,
                key: key, // Only show the key once during creation
                expiresAt: apiKey.expiresAt,
                createdAt: apiKey.createdAt
            },
            warning: 'Save this API key securely. You will not be able to see it again.'
        });
    } catch (err) {
        console.error('Error creating API key:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/api-keys
 * @desc    Get all API keys for the authenticated user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const apiKeys = await ApiKey.find({ userId: req.user.id }).select('-key');

        res.json(apiKeys.map(key => ({
            id: key._id,
            name: key.name,
            lastUsed: key.lastUsed,
            isActive: key.isActive,
            expiresAt: key.expiresAt,
            createdAt: key.createdAt,
            keyPreview: 'aifarm_••••••••' // Show prefix only
        })));
    } catch (err) {
        console.error('Error fetching API keys:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/api-keys/:id
 * @desc    Revoke (delete) an API key
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const apiKey = await ApiKey.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!apiKey) {
            return res.status(404).json({ message: 'API key not found' });
        }

        await apiKey.deleteOne();

        res.json({ message: 'API key revoked successfully' });
    } catch (err) {
        console.error('Error revoking API key:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   PATCH /api/api-keys/:id/deactivate
 * @desc    Deactivate an API key (can be reactivated later)
 * @access  Private
 */
router.patch('/:id/deactivate', auth, async (req, res) => {
    try {
        const apiKey = await ApiKey.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!apiKey) {
            return res.status(404).json({ message: 'API key not found' });
        }

        apiKey.isActive = false;
        await apiKey.save();

        res.json({ message: 'API key deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating API key:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   PATCH /api/api-keys/:id/activate
 * @desc    Reactivate a deactivated API key
 * @access  Private
 */
router.patch('/:id/activate', auth, async (req, res) => {
    try {
        const apiKey = await ApiKey.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!apiKey) {
            return res.status(404).json({ message: 'API key not found' });
        }

        apiKey.isActive = true;
        await apiKey.save();

        res.json({ message: 'API key activated successfully' });
    } catch (err) {
        console.error('Error activating API key:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
