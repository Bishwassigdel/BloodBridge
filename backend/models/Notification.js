import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: { 
    type: String, 
    required: true 
  },
  type: {
    type: String,
    enum: [
      'request_accepted',
      'request_fulfilled',
      'request_cancelled',
      'general',
      'low_stock',           // ← added
      'near_expiry',         // ← added
      'critical_inventory'   // ← optional – good for future use
    ],
    default: 'general',
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  data: { 
    type: mongoose.Schema.Types.Mixed 
  },
  severity: {                // ← optional but useful
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);