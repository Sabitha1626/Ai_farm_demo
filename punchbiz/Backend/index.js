const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const userRoutes = require('./routes/users');
const cowRoutes = require('./routes/cows');
const staffRoutes = require('./routes/staff');
const eventRoutes = require('./routes/events');
const milkRoutes = require('./routes/milk');
const sensorRoutes = require('./routes/sensors');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cows', cowRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/stock', require('./routes/stock'));
app.use('/api/detection', require('./routes/detection'));
app.use('/api/health', require('./routes/health'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/api-keys', require('./routes/apiKeys'));

app.get('/', (req, res) => {
    res.send('PunchBiz Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
