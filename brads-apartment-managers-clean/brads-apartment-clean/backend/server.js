require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const apartmentRoutes = require('./routes/apartments');
const unitRoutes = require('./routes/units');
const paymentRoutes = require('./routes/payments');
const tenantRoutes = require('./routes/tenants');
const notificationRoutes = require('./routes/notifications');
const { processRentReminders } = require('./utils/reminderService');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI )
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Run rent reminders every day at 8am
cron.schedule('0 8 * * *', () => {
  console.log('Running rent reminder check...');
  processRentReminders();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Brads Apartment Server running on port ${PORT}`));
