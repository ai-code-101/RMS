const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Unit = require('../models/Unit');
const { auth, requireRole } = require('../middleware/auth');

// Get all tenants for a landlord
router.get('/', auth, requireRole('landlord'), async (req, res) => {
  try {
    const landlordName = req.user.fullName || req.user.companyName;
    const tenants = await User.find({
      role: 'tenant',
      isActive: true,
      $or: [
        { landlordName: { $regex: req.user.fullName, $options: 'i' } },
        { landlordName: { $regex: req.user.companyName, $options: 'i' } },
      ]
    }).populate('assignedUnit');
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tenants' });
  }
});

// Remove tenant from unit
router.delete('/:tenantId/evict', auth, requireRole('landlord'), async (req, res) => {
  try {
    const tenant = await User.findById(req.params.tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    if (tenant.assignedUnit) {
      await Unit.findByIdAndUpdate(tenant.assignedUnit, {
        status: 'vacant',
        tenant: null,
        paymentStatus: 'unpaid',
        nextDueDate: null,
        lastPaymentDate: null,
      });
    }

    await User.findByIdAndUpdate(req.params.tenantId, { assignedUnit: null, isActive: false });
    res.json({ message: 'Tenant removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove tenant' });
  }
});

module.exports = router;
