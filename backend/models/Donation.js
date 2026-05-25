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

// ── Indexes ──────────────────────────────────────────────────────────────
// Donor history page: all donations by a donor, newest first
donationSchema.index({ donor: 1, donatedAt: -1 });
// Platform stats: total count queries
donationSchema.index({ bloodGroup: 1 });

export default mongoose.model('Donation', donationSchema);