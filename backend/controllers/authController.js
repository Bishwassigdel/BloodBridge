// controllers/authController.js
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// ── Helper: Generate JWT ────────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ── Signup User ─────────────────────────────────────────────────────────
export const signupUser = async (req, res) => {
  const { username, email, password, phone, bloodGroup, role = 'receiver' } = req.body;

  try {
    // Validation
    if (!username || !email || !password || !phone || !bloodGroup) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      bloodGroup,
      role,
    });

    if (user) {
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
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Login User ──────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
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

// ── Get Current User (GET /api/auth/me) ─────────────────────────────────
export const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const user = await User.findById(req.user._id).select(
      '-password -resetPasswordToken -resetPasswordExpire -__v'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ── Update Profile (PATCH /api/auth/profile) ────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = { ...req.body };

    // Handle avatar upload (multer adds req.file)
    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Optional: prevent changing role or email
    delete updates.email;
    delete updates.role;

    // If changing password
    if (updates.newPassword) {
      if (!updates.currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password',
        });
      }

      const user = await User.findById(userId).select('+password');
      const isMatch = await bcrypt.compare(updates.currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.newPassword, salt);

      // Remove temp fields
      delete updates.currentPassword;
      delete updates.newPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire -__v');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
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