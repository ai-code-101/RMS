const express = require('express');
const router = express.Router();
const Apartment = require('../models/Apartment');
const Unit = require('../models/Unit');
const { auth, requireRole } = require('../middleware/auth');

// Get all apartments for landlord
router.get('/', auth, requireRole('landlord'), async (req, res) => {
  try {
    const apartments = await Apartment.find({ landlord: req.user._id, isActive: true })
      .sort({ createdAt: -1 });
    res.json(apartments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch apartments' });
  }
});

// Get apartments by landlord name (for tenants)
router.get('/by-landlord', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const landlordName = req.user.landlordName;
    const landlord = await User.findOne({
      role: 'landlord',
      isActive: true,
      $or: [
        { fullName: { $regex: landlordName, $options: 'i' } },
        { companyName: { $regex: landlordName, $options: 'i' } }
      ]
    });

    if (!landlord) return res.status(404).json({ message: 'Landlord not found' });

    const apartments = await Apartment.find({ landlord: landlord._id, isActive: true });
    res.json({ apartments, landlord });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch apartments' });
  }
});

// Create apartment
router.post('/', auth, requireRole('landlord'), async (req, res) => {
  try {
    const { name, address, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Apartment name is required' });

    const apartment = new Apartment({ name, address, description, landlord: req.user._id });
    await apartment.save();
    res.status(201).json(apartment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create apartment', error: err.message });
  }
});

// Update apartment
router.put('/:id', auth, requireRole('landlord'), async (req, res) => {
  try {
    const apartment = await Apartment.findOneAndUpdate(
      { _id: req.params.id, landlord: req.user._id },
      req.body,
      { new: true }
    );
    if (!apartment) return res.status(404).json({ message: 'Apartment not found' });
    res.json(apartment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update apartment' });
  }
});

// Delete apartment
router.delete('/:id', auth, requireRole('landlord'), async (req, res) => {
  try {
    const units = await Unit.find({ apartment: req.params.id, status: 'occupied' });
    if (units.length > 0) {
      return res.status(400).json({ message: 'Cannot delete apartment with occupied units' });
    }
    await Apartment.findOneAndUpdate(
      { _id: req.params.id, landlord: req.user._id },
      { isActive: false }
    );
    await Unit.updateMany({ apartment: req.params.id }, { isActive: false });
    res.json({ message: 'Apartment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete apartment' });
  }
});

module.exports = router;
