import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodGroup: { 
    type: String, 
    required: true,
    enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-']
  },
  units: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('Inventory', inventorySchema);