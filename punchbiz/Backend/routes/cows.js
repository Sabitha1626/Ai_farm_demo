const express = require('express');
const router = express.Router();
const auth = require('../middleware/flexAuth');

// Get all cows for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const Cow = req.db.model('Cow');
        const cows = await Cow.find({}); // Data is naturally isolated in the tenant DB
        res.json(cows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create cow for the logged-in user
router.post('/', auth, async (req, res) => {
    try {
        const Cow = req.db.model('Cow');
        const cow = new Cow({
            ...req.body,
            userId: req.user.id // Keep userId for reference/metadata
        });
        const newCow = await cow.save();
        res.status(201).json(newCow);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update cow (ensure it exists in tenant DB)
router.put('/:id', auth, async (req, res) => {
    try {
        const Cow = req.db.model('Cow');
        const updatedCow = await Cow.findOneAndUpdate(
            { _id: req.params.id },
            req.body,
            { new: true }
        );
        if (!updatedCow) {
            return res.status(404).json({ message: 'Cow not found' });
        }
        res.json(updatedCow);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete cow
router.delete('/:id', auth, async (req, res) => {
    try {
        const Cow = req.db.model('Cow');
        const cow = await Cow.findOneAndDelete({ _id: req.params.id });
        if (!cow) {
            return res.status(404).json({ message: 'Cow not found' });
        }
        res.json({ message: 'Cow deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
