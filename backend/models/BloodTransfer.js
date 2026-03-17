import mongoose from 'mongoose';

const bloodTransferSchema = new mongoose.Schema({
  fromHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fromHospitalName: {
    type: String,
    required: true,
  },
  toHospitalEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  toHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  toHospitalName: {
    type: String,
    default: null,
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    required: true,
  },
  units: {
    type: Number,
    required: true,
    min: 1,
  },
  reason: {
    type: String,
    default: 'Blood inventory transfer',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  confirmationToken: String,
  tokenExpires: Date,
}, { timestamps: true });

const BloodTransfer = mongoose.models.BloodTransfer || mongoose.model('BloodTransfer', bloodTransferSchema);

export default BloodTransfer;
