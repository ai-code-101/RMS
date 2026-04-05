const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, companyName, email, password, role, landlordName, phone } = req.body;

    if (!email || !password || !role || !fullName) {
      return res.status(400).json({ message: 'Full name, email, password, and role are required' });
    }

    if (role === 'tenant' && !landlordName) {
      return res.status(400).json({ message: 'Landlord name is required for tenants' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({ fullName, companyName, email, password, role, landlordName, phone });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    const user = await User.findOne({ email, role });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('assignedUnit');
  res.json(user);
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, phone, companyName } = req.body;
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (phone) updates.phone = phone;
    if (companyName) updates.companyName = companyName;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

// Get landlords list (for tenant registration)
router.get('/landlords', async (req, res) => {
  try {
    const landlords = await User.find({ role: 'landlord', isActive: true })
      .select('fullName companyName email');
    res.json(landlords);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch landlords' });
  }
});

module.exports = router;
