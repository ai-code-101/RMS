const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['reminder', 'payment', 'info', 'overdue'],
    default: 'info'
  },
  isRead: { type: Boolean, default: false },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
