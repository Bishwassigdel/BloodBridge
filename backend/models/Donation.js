import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospital: String,
  bloodGroup: String,
  units: { type: Number, required: true },
  donatedAt: { type: Date, default: Date.now },
  notes: String,
  status: { type: String, default: 'Completed' }
}, { timestamps: true });

export default mongoose.model('Donation', donationSchema);