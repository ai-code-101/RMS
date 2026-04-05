const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../models/Payment');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');

const MEGAPAY_URL = 'https://megapay.co.ke/backend/v1';

// Always returns the next upcoming 5th-of-month from today
function getNextRentDueDate() {
  const now = new Date();
  let dueDate = new Date(now.getFullYear(), now.getMonth(), 5);
  if (now.getDate() >= 5) {
    dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  }
  return dueDate;
}

// Initiate STK Push
router.post('/initiate', auth, requireRole('tenant'), async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const unit = await Unit.findById(req.user.assignedUnit)
      .populate('apartment')
      .populate('landlord');
    if (!unit) return res.status(404).json({ message: 'No assigned unit found' });

    // Determine payment type correctly:
    //
    // 'initial' = brand new tenant paying rent + deposit for the first time.
    //             Condition: unit has never had a completed payment AND the
    //             unit is NOT marked as an existing-tenant slot.
    //
    // 'rent'    = continuing tenant (or existing tenant) paying monthly rent only.
    //             This covers:
    //               - Existing tenants (isExistingTenant = true)
    //               - New tenants who already paid the initial amount
    //               - Any tenant whose lastPaymentDate is set
    //
    let resolvedType = 'rent';

    const isContinuing = unit.isExistingTenant || !!unit.lastPaymentDate;

    if (!isContinuing) {
      // Check DB for any prior completed payment on this unit by this tenant
      const priorPayment = await Payment.findOne({
        tenant: req.user._id,
        unit: unit._id,
        status: 'completed',
      });
      resolvedType = priorPayment ? 'rent' : 'initial';
    }

    const amount = resolvedType === 'initial'
      ? unit.rentPrice + (unit.deposit || unit.rentPrice)
      : unit.rentPrice;

    // Format phone to 254XXXXXXXXX
    let formattedPhone = phone.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const reference = `BRAD${Date.now()}`;

    const stkBody = {
      api_key: process.env.MEGAPAY_API_KEY,
      email: process.env.MEGAPAY_EMAIL,
      amount: String(amount),
      msisdn: formattedPhone,
      reference,
    };

    const stkResponse = await axios.post(`${MEGAPAY_URL}/c2b/stk`, stkBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    const stkData = stkResponse.data;

    if (!stkData.transaction_request_id) {
      return res.status(400).json({ message: stkData.message || 'Failed to initiate payment' });
    }

    const payment = new Payment({
      tenant: req.user._id,
      unit: unit._id,
      apartment: unit.apartment._id,
      landlord: unit.landlord._id,
      amount,
      type: resolvedType,
      status: 'pending',
      phone: formattedPhone,
      transactionRequestId: stkData.transaction_request_id,
      megapayReference: reference,
      dueDate: getNextRentDueDate(),
    });
    await payment.save();

    res.json({
      message: 'STK Push sent. Please check your phone.',
      paymentId: payment._id,
      transactionRequestId: stkData.transaction_request_id,
      amount,
      type: resolvedType,
    });
  } catch (err) {
    console.error('Payment initiation error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Payment initiation failed', error: err.message });
  }
});

// Check payment status
router.post('/status/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.status === 'completed') {
      return res.json({ status: 'completed', payment });
    }
    if (payment.status === 'failed' || payment.status === 'cancelled') {
      return res.json({ status: payment.status, payment });
    }

    // Query MegaPay for current status
    const statusBody = {
      api_key: process.env.MEGAPAY_API_KEY,
      email: process.env.MEGAPAY_EMAIL,
      transaction_request_id: payment.transactionRequestId,
    };

    const statusResponse = await axios.post(`${MEGAPAY_URL}/transactionstatus`, statusBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const statusData = statusResponse.data;
    const responseCode = parseInt(statusData.TransactionCode ?? statusData.ResponseCode);

    let newStatus = 'pending';
    if (responseCode === 0 && statusData.TransactionStatus === 'Completed') {
      newStatus = 'completed';
    } else if (responseCode === 1032) {
      newStatus = 'cancelled';
    } else if ([1, 1025, 9999, 2001, 1019, 1001].includes(responseCode)) {
      newStatus = 'failed';
    }

    const updates = {
      status: newStatus,
      responseCode,
      responseDescription: statusData.TransactionStatus || statusData.ResultDesc,
      transactionId: statusData.TransactionID,
      transactionReceipt: statusData.TransactionReceipt,
    };

    if (newStatus === 'completed') {
      updates.paymentDate = new Date();

      // Advance the due date to the next cycle's 5th
      const nextDue = getNextRentDueDate();

      await Unit.findByIdAndUpdate(payment.unit, {
        status: 'occupied',
        paymentStatus: 'paid',
        lastPaymentDate: new Date(),
        nextDueDate: nextDue,
        isExistingTenant: false,   // clear the flag after first payment
      });

      await Notification.create({
        user: payment.tenant,
        title: 'Payment Successful',
        message: `Your payment of KES ${payment.amount.toLocaleString()} has been received. Receipt: ${statusData.TransactionReceipt}. Next rent due: ${nextDue.toDateString()}.`,
        type: 'payment',
        unit: payment.unit,
        payment: payment._id,
      });
    }

    await Payment.findByIdAndUpdate(payment._id, updates);
    const updated = await Payment.findById(payment._id);
    res.json({ status: newStatus, payment: updated });
  } catch (err) {
    console.error('Status check error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Status check failed', error: err.message });
  }
});

// Payment history
router.get('/history', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'tenant'
      ? { tenant: req.user._id }
      : { landlord: req.user._id };

    const payments = await Payment.find(filter)
      .populate('tenant', 'fullName email')
      .populate('unit', 'unitNumber')
      .populate('apartment', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// Landlord overview stats
router.get('/overview', auth, requireRole('landlord'), async (req, res) => {
  try {
    const units = await Unit.find({ landlord: req.user._id, isActive: true });
    const totalUnits = units.length;
    const occupiedUnits = units.filter(u => u.status === 'occupied').length;
    const vacantUnits = units.filter(u => u.status === 'vacant').length;
    const paidUnits = units.filter(u => u.paymentStatus === 'paid').length;
    const unpaidUnits = units.filter(u => u.paymentStatus !== 'paid' && u.status === 'occupied').length;

    const now = new Date();
    const monthlyPayments = await Payment.find({
      landlord: req.user._id,
      status: 'completed',
      paymentDate: {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      },
    });
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({ totalUnits, occupiedUnits, vacantUnits, paidUnits, unpaidUnits, monthlyRevenue });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch overview' });
  }
});

module.exports = router;
