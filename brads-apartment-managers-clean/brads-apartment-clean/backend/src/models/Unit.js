const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  unitNumber: { type: String, required: true, trim: true },
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rentPrice: { type: Number, required: true, min: 0 },
  deposit: { type: Number },
  status: {
    type: String,
    enum: ['vacant', 'occupied'],
    default: 'vacant'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'pending'],
    default: 'unpaid'
  },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isExistingTenant: { type: Boolean, default: false },
  nextDueDate: { type: Date, default: null },
  lastPaymentDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

unitSchema.virtual('depositAmount').get(function () {
  return this.deposit || this.rentPrice;
});

unitSchema.virtual('initialPaymentAmount').get(function () {
  return this.rentPrice + (this.deposit || this.rentPrice);
});

module.exports = mongoose.model('Unit', unitSchema);
