import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },  // optional for Google users
  googleId: { type: String },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] 
  },
  phone: { type: String },
  location: { type: String },           // ← changed: removed required: true
  role: { 
    type: String, 
    enum: ['donor', 'receiver', 'hospital'], 
    required: true 
  },
  isAvailable: { type: Boolean, default: true },
  lastDonation: Date,
  hospitalName: String,

  // Added fields for profile edit
  avatar: { type: String, default: null },
  address: { type: String, default: '' },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' }
  },

  // GPS coordinates — set when user pins their location in Edit Profile
  // Used to plot donors on the map in SearchDonors and dashboard
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },

  // Email Verification fields
  isVerified: { type: Boolean, default: false },
  verificationCode: String,
  verificationCodeExpires: Date,

  // Forgot/Reset Password fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// ── Indexes for fast donor/request queries ──────────────────────────────
// Speeds up: User.find({ role: 'donor', bloodGroup: 'A+', isAvailable: true })
userSchema.index({ role: 1, bloodGroup: 1, isAvailable: 1 });
// Speeds up: User.find({ role: 'donor', bloodGroup: 'A+' })
userSchema.index({ role: 1, bloodGroup: 1 });
// Speeds up password-reset token lookups
userSchema.index({ resetPasswordToken: 1 });
// Speeds up Google OAuth lookups
userSchema.index({ googleId: 1 });

// Singleton pattern (safe in development)
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;