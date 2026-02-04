const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const auth = require('../middleware/auth');

// @route   POST api/notifications/subscribe
// @desc    Subscribe a user to push notifications
// @access  Private
router.post('/subscribe', auth, async (req, res) => {
    try {
        const { endpoint, p256dh_key, auth_key } = req.body;

        // Upsert logic: find existing subscription for this endpoint or user?
        // Usually, an endpoint is unique. Let's check for existing endpoint.
        let subscription = await PushSubscription.findOne({ endpoint });

        if (subscription) {
            subscription.userId = req.user.id;
            subscription.isActive = true;
            subscription.p256dh_key = p256dh_key;
            subscription.auth_key = auth_key;
            await subscription.save();
        } else {
            subscription = new PushSubscription({
                userId: req.user.id,
                endpoint,
                p256dh_key,
                auth_key,
                isActive: true
            });
            await subscription.save();
        }

        res.json({ message: 'Subscribed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/notifications/unsubscribe
// @desc    Unsubscribe a user from push notifications
// @access  Private
router.post('/unsubscribe', auth, async (req, res) => {
    try {
        await PushSubscription.updateMany(
            { userId: req.user.id },
            { isActive: false }
        );
        res.json({ message: 'Unsubscribed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/notifications/status
// @desc    Check if a user is subscribed
// @access  Private
router.get('/status', auth, async (req, res) => {
    try {
        const subscription = await PushSubscription.findOne({
            userId: req.user.id,
            isActive: true
        });
        res.json({ isSubscribed: !!subscription });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
