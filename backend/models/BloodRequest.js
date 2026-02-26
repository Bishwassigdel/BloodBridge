import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospital: { type: String, required: true },
  bloodGroup: { 
    type: String, 
    required: true,
    enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-']
  },
  units: { type: Number, required: true, min: 1 },
  urgency: { 
    type: String, 
    enum: ['normal', 'emergency'], 
    default: 'normal' 
  },
  location: String,
  contactPhone: String,
  note: String,
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'fulfilled', 'cancelled'], 
    default: 'pending' 
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

export default mongoose.model('BloodRequest', bloodRequestSchema);