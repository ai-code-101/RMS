const express = require('express');
const router = express.Router();
const Unit = require('../models/Unit');
const Apartment = require('../models/Apartment');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// Get all units for landlord
router.get('/', auth, requireRole('landlord'), async (req, res) => {
  try {
    const units = await Unit.find({ landlord: req.user._id, isActive: true })
      .populate('apartment', 'name')
      .populate('tenant', 'fullName email phone')
      .sort({ createdAt: -1 });
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch units' });
  }
});

// Get units by apartment (for tenants and landlords)
router.get('/apartment/:apartmentId', auth, async (req, res) => {
  try {
    const filter = { apartment: req.params.apartmentId, isActive: true };
    if (req.user.role === 'landlord') {
      filter.landlord = req.user._id;
    }
    const units = await Unit.find(filter)
      .populate('tenant', 'fullName email phone')
      .sort({ unitNumber: 1 });
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch units' });
  }
});

// Get single unit
router.get('/:id', auth, async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate('apartment', 'name address')
      .populate('tenant', 'fullName email phone')
      .populate('landlord', 'fullName companyName email');
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch unit' });
  }
});

// Create unit
router.post('/', auth, requireRole('landlord'), async (req, res) => {
  try {
    const { unitNumber, apartmentId, rentPrice, deposit } = req.body;
    if (!unitNumber || !apartmentId || !rentPrice) {
      return res.status(400).json({ message: 'Unit number, apartment, and rent price are required' });
    }

    const apartment = await Apartment.findOne({ _id: apartmentId, landlord: req.user._id });
    if (!apartment) return res.status(404).json({ message: 'Apartment not found' });

    const unit = new Unit({
      unitNumber,
      apartment: apartmentId,
      landlord: req.user._id,
      rentPrice,
      deposit: deposit || rentPrice,
    });
    await unit.save();
    await unit.populate('apartment', 'name');
    res.status(201).json(unit);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create unit', error: err.message });
  }
});

// Update unit
router.put('/:id', auth, requireRole('landlord'), async (req, res) => {
  try {
    const { rentPrice, deposit, unitNumber } = req.body;
    const updates = {};
    if (rentPrice) updates.rentPrice = rentPrice;
    if (deposit !== undefined) updates.deposit = deposit;
    if (unitNumber) updates.unitNumber = unitNumber;

    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, landlord: req.user._id },
      updates,
      { new: true }
    ).populate('apartment', 'name').populate('tenant', 'fullName email phone');

    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update unit' });
  }
});

// Mark unit as pre-occupied (existing tenant)
router.put('/:id/mark-occupied', auth, requireRole('landlord'), async (req, res) => {
  try {
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, landlord: req.user._id },
      {
        status: 'occupied',
        isExistingTenant: true,
        paymentStatus: 'paid',
        nextDueDate: getNextRentDueDate(),
      },
      { new: true }
    ).populate('apartment', 'name');

    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark unit' });
  }
});

// Mark pre-occupied unit back to vacant
router.put('/:id/mark-vacant', auth, requireRole('landlord'), async (req, res) => {
  try {
    const unit = await Unit.findOne({ _id: req.params.id, landlord: req.user._id });
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    if (unit.tenant) return res.status(400).json({ message: 'Cannot mark as vacant while tenant is assigned' });

    const updated = await Unit.findByIdAndUpdate(
      req.params.id,
      { status: 'vacant', isExistingTenant: false, paymentStatus: 'unpaid', nextDueDate: null },
      { new: true }
    ).populate('apartment', 'name');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark unit as vacant' });
  }
});

// Delete unit
router.delete('/:id', auth, requireRole('landlord'), async (req, res) => {
  try {
    const unit = await Unit.findOne({ _id: req.params.id, landlord: req.user._id });
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    if (unit.status === 'occupied') {
      return res.status(400).json({ message: 'Cannot delete an occupied unit' });
    }
    await Unit.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Unit deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete unit' });
  }
});

// Tenant selects unit
router.post('/:id/select', auth, requireRole('tenant'), async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit || !unit.isActive) return res.status(404).json({ message: 'Unit not found' });

    if (unit.status === 'occupied' && unit.isExistingTenant) {
      // Existing tenant slot - allow selection and assign
      await Unit.findByIdAndUpdate(req.params.id, { tenant: req.user._id });
      await User.findByIdAndUpdate(req.user._id, { assignedUnit: req.params.id });
      const updated = await Unit.findById(req.params.id)
        .populate('apartment', 'name address')
        .populate('tenant', 'fullName email phone')
        .populate('landlord', 'fullName companyName');
      return res.json({ unit: updated, isExistingTenant: true });
    }

    if (unit.status === 'occupied') {
      return res.status(400).json({ message: 'Unit is already occupied' });
    }

    // Vacant unit - assign tenant
    await Unit.findByIdAndUpdate(req.params.id, { tenant: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { assignedUnit: req.params.id });

    const updated = await Unit.findById(req.params.id)
      .populate('apartment', 'name address')
      .populate('tenant', 'fullName email phone')
      .populate('landlord', 'fullName companyName');
    res.json({ unit: updated, isExistingTenant: false });
  } catch (err) {
    res.status(500).json({ message: 'Failed to select unit', error: err.message });
  }
});

function getNextRentDueDate() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  return next;
}

module.exports = router;
