import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['request_accepted', 'request_fulfilled', 'request_cancelled', 'general'],
    default: 'general',
  },
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);