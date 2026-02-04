const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const RegistrationToken = require('../models/RegistrationToken');
const auth = require('../middleware/auth');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Validate if an email is a likely "fake" or "dummy" email
 */
const isFakeEmail = (email) => {
    if (!email) return true;

    // 1. Basic format check (more strict than just presence of @)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return true;

    const domain = email.split('@')[1].toLowerCase();

    // 2. Blacklist of known dummy/temporary email domains
    const blacklist = [
        'test.com', 'example.com', 'dummy.com', 'temp.com', 'mailinator.com',
        'yopmail.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com',
        'trashmail.com', 'getnada.com', 'dispostable.com', 'fake.com', 'none.com',
        'noemail.com', 'abc.com', 'xyz.com'
    ];

    if (blacklist.includes(domain)) return true;

    // 3. Sequential or repetitive char check (e.g., aaaaa@gmail.com)
    const username = email.split('@')[0].toLowerCase();
    if (/^(.)\1{4,}$/.test(username)) return true; // 5+ same chars
    if (/^(12345|asdfg|qwerty)$/.test(username)) return true;

    return false;
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, farmName } = req.body;

        if (isFakeEmail(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // In a real app, hash password here using bcrypt
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);
        // For simplicity/speed in this demo, storing plain (as per previous User model comment)
        // Check if encryption requested? User didn't specify security level, but best practice...
        // Let's use bcrypt since I installed it.
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nameSlug = fullName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
        // Add random suffix to ensure uniqueness
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        const tenantDbName = `AI_FARM_user_${nameSlug}_${uniqueSuffix}`;

        user = new User({
            fullName,
            farmName: farmName || 'My Farm',
            email,
            password: hashedPassword,
            role: 'admin',
            tenantDbName: tenantDbName
        });

        await user.save();

        const jwt = require('jsonwebtoken');
        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
        });

    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (isFakeEmail(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not registered' });
        }

        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const jwt = require('jsonwebtoken');
        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (isFakeEmail(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not registered' });
        }

        // Generate OTP (6-digit)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Remove any existing tokens for this user
        await PasswordResetToken.deleteMany({ userId: user._id });

        const resetToken = new PasswordResetToken({
            userId: user._id,
            otp: otp
        });
        await resetToken.save();

        // In dev mode or if email password is missing, log the OTP anyway so testing is possible
        if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_PASS) {
            console.log("------------------------------------------");
            console.log(`PASSWORD RESET OTP FOR ${user.email}: ${otp}`);
            console.log("------------------------------------------");
        }

        const mailOptions = {
            from: process.env.EMAIL_USER || 'bentenabcd005@gmail.com',
            to: user.email,
            subject: 'Password Reset OTP - PunchBiz',
            text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`
        };

        try {
            // Only attempt to send email if password is provided
            if (!process.env.EMAIL_PASS) {
                return res.json({
                    message: 'Development mode: OTP is logged to console.',
                    devMode: true
                });
            }

            await transporter.sendMail(mailOptions);
            res.json({ message: 'OTP sent to email' });
        } catch (emailErr) {
            console.error("Email send error:", emailErr.message);

            // In development, we return success but notify that it was logged to console
            if (process.env.NODE_ENV === 'development') {
                return res.json({
                    message: 'Email failed to send, but OTP was logged to server console (Dev Mode)',
                    devMode: true
                });
            }

            res.status(500).json({
                message: 'Error sending email. Please contact support.',
                error: process.env.NODE_ENV === 'development' ? emailErr.message : undefined
            });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetEntry = await PasswordResetToken.findOne({
            userId: user._id,
            otp: otp
        });

        if (!resetEntry) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        resetEntry.isVerified = true;
        await resetEntry.save();

        res.json({ message: 'OTP verified successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetEntry = await PasswordResetToken.findOne({
            userId: user._id,
            otp: otp,
            isVerified: true
        });

        if (!resetEntry) {
            return res.status(400).json({ message: 'OTP not verified or expired' });
        }

        // Update password
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        // Delete the entry
        await resetEntry.deleteOne();

        res.json({ message: 'Password reset successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update current user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { fullName, farmName } = req.body;
        const user = await User.findById(req.user.id);

        if (fullName) user.fullName = fullName;
        if (farmName) user.farmName = farmName;

        await user.save();
        res.json({ message: 'Profile updated successfully', user: { id: user.id, fullName: user.fullName, farmName: user.farmName, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get current tenant database name (for debugging)
router.get('/debug-db', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            userId: req.user.id,
            userName: user ? user.fullName : 'Unknown User',
            databaseName: req.db.name
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
