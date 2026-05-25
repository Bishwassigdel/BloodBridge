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
  // Coordinates saved silently for future map integration — no rework needed later
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'fulfilled', 'cancelled'], 
    default: 'pending' 
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Per-donor email tokens for accept/reject via email (no login required)
  emailTokens: [{
    donorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token:    { type: String },
    used:     { type: Boolean, default: false },
    action:   { type: String, default: null }, // 'accepted' | 'rejected'
  }],
}, { timestamps: true });

// ── Indexes for fast blood request queries ──────────────────────────────
// Donor dashboard: pending requests matching blood group, sorted by urgency+date
bloodRequestSchema.index({ bloodGroup: 1, status: 1, createdAt: -1 });
// Receiver "my requests" panel
bloodRequestSchema.index({ requester: 1, createdAt: -1 });
// Donor "my accepted" panel
bloodRequestSchema.index({ acceptedBy: 1, status: 1 });
// Hospital "all requests" with filters
bloodRequestSchema.index({ status: 1, urgency: -1, createdAt: -1 });
// Map: active requests in last 48h with GPS coords
bloodRequestSchema.index({ status: 1, createdAt: -1, 'coordinates.lat': 1, 'coordinates.lng': 1 });
// Email token lookup (emergency email accept/reject)
bloodRequestSchema.index({ 'emailTokens.token': 1 });

export default mongoose.model('BloodRequest', bloodRequestSchema);