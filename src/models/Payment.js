const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  telegramId:       { type: Number, required: true, index: true },
  firstName:        { type: String, default: '' },
  plan:             { type: String, required: true },
  amount:           { type: Number, required: true },
  status:           { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  screenshotFileId: { type: String, default: null },
  approvedBy:       { type: Number, default: null },
  approvedAt:       { type: Date,   default: null },
  notes:            { type: String, default: '' },
}, { timestamps: true });
module.exports = mongoose.model('Payment', paymentSchema);
