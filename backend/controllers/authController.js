import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in .env file');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Signup User  ← FIXED HERE
export const signupUser = async (req, res) => {
  const { username, email, password, phone, bloodGroup, role = 'receiver', hospitalName } = req.body;

  try {
    console.log('Signup request received:', { email, phone, username, role, hospitalName });

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }

    // Hospital validation - use username instead of separate hospitalName
    if (role === 'hospital' && !username.trim()) {
      return res.status(400).json({ success: false, message: 'Hospital/Organization name is required' });
    }

    // Blood group required for donor/receiver
    if (role !== 'hospital' && !bloodGroup) {
      return res.status(400).json({ success: false, message: 'Blood group is required for donors/receivers' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phone: phone || null }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email or phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone: phone || undefined,
      bloodGroup: bloodGroup || undefined,
      role,
      hospitalName: role === 'hospital' ? username : undefined, // Optional: store username as hospitalName
      location: req.body.location || undefined,
    });

    console.log('User created successfully:', user._id);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
        hospitalName: user.hospitalName,
        location: user.location,
        token,
      },
    });
  } catch (error) {
    console.error('FULL SIGNUP ERROR:', error.stack || error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      errorDetail: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ────────────────────────────────────────────────────────────────────────
// Everything below is YOUR ORIGINAL CODE — NO CHANGES
// ────────────────────────────────────────────────────────────────────────

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
        isAvailable: user.isAvailable,
        avatar: user.avatar,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Current User
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      '-password -resetPasswordToken -resetPasswordExpire -__v'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = { ...req.body };

    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    delete updates.email;
    delete updates.role;

    if (updates.newPassword) {
      if (!updates.currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password required' });
      }

      const user = await User.findById(userId).select('+password');
      const isMatch = await bcrypt.compare(updates.currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.newPassword, salt);

      delete updates.currentPassword;
      delete updates.newPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire -__v');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to update profile',
    });
  }
};