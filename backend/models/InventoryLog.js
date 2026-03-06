import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  bloodGroup: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ['add', 'subtract', 'transfer_out', 'transfer_in'],
    required: true,
  },
  units: {
    type: Number,
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: String,
  beforeUnits: Number,
  afterUnits: Number,
  expiryDate: { 
    type: Date 
  },
  transferToHospital: String,
  transferFromHospital: String,
  timestamp: { type: Date, default: Date.now, index: true },
});

export default mongoose.model('InventoryLog', logSchema);