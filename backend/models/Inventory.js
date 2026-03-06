import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  bloodGroup: { 
    type: String, 
    required: true,
    enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-'],
  },
  units: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  earliestExpiryDate: { 
    type: Date 
  },
  lastRestockDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

inventorySchema.index({ hospital: 1, bloodGroup: 1 }, { unique: true });

export default mongoose.model('Inventory', inventorySchema);