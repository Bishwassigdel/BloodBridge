import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  phone: { type: String },
  location: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['donor', 'receiver', 'hospital'], 
    required: true 
  },
  isAvailable: { type: Boolean, default: true },
  lastDonation: Date,
  hospitalName: String,

  // Forgot/Reset Password fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// Singleton pattern (safe in development)
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;