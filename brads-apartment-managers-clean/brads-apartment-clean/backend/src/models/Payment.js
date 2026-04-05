const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ['initial', 'rent'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  phone: { type: String, required: true },
  transactionRequestId: { type: String },
  transactionId: { type: String },
  transactionReceipt: { type: String },
  responseCode: { type: Number },
  responseDescription: { type: String },
  megapayReference: { type: String },
  paymentDate: { type: Date },
  dueDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
