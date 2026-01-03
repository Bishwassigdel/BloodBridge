// models/user.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bloodGroup: { type: String },
  phone: { type: String },
  location: { type: String },
  role: {
    type: String,
    enum: ['donor', 'receiver', 'hospital'],
    required: true
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);