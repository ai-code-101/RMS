const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, trim: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Apartment', apartmentSchema);
