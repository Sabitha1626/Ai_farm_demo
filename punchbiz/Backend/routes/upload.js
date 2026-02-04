const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/cow-photos');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const cowId = req.params.cowId || 'unknown';
        const ext = path.extname(file.originalname);
        cb(null, `cow-${cowId}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Upload cow photo
router.post('/cow-photo/:cowId', auth, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const Cow = req.db.model('Cow');
        const cowId = req.params.cowId;

        // Construct the URL (assuming server runs on http://localhost:5000)
        // In a real app, this should be configurable
        const photoUrl = `/uploads/cow-photos/${req.file.filename}`;

        const cow = await Cow.findByIdAndUpdate(
            cowId,
            { imageUrl: photoUrl },
            { new: true }
        );

        if (!cow) {
            return res.status(404).json({ message: 'Cow not found' });
        }

        res.json({ message: 'Photo uploaded successfully', url: photoUrl, cow });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Remove cow photo
router.delete('/cow-photo/:cowId', auth, async (req, res) => {
    try {
        const Cow = req.db.model('Cow');
        const cowId = req.params.cowId;

        const cow = await Cow.findById(cowId);
        if (!cow) return res.status(404).json({ message: 'Cow not found' });

        // Optionally delete the file from disk here

        cow.imageUrl = null;
        await cow.save();

        res.json({ message: 'Photo removed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
