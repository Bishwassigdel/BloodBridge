// controllers/authController.js
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in .env file');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ── Shared email transporter ─────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ── Generate a 6-digit OTP ───────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup User – creates account and sends verification OTP
export const signupUser = async (req, res) => {
  const { username, email, password, phone, bloodGroup, role = 'receiver' } = req.body;

  try {
    console.log('Signup request received:', { email, phone, username, role });

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }

    if (role === 'hospital' && !username.trim()) {
      return res.status(400).json({ success: false, message: 'Hospital/Organization name is required' });
    }

    if (role !== 'hospital' && !bloodGroup) {
      return res.status(400).json({ success: false, message: 'Blood group is required for donors/receivers' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phone: phone || null }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email or phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || undefined,
      bloodGroup: bloodGroup || undefined,
      role,
      hospitalName: role === 'hospital' ? username : undefined,
      location: req.body.location || undefined,
      isVerified: false,
      verificationCode: otp,
      verificationCodeExpires: otpExpires,
    });

    console.log('User created (unverified):', user._id);

    // Send OTP email — wrapped separately so a mail failure doesn't break signup
    const roleLabel = role === 'hospital' ? 'Organization' : role.charAt(0).toUpperCase() + role.slice(1);
    try {
      await createTransporter().sendMail({
        from: `"BloodBridge" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'BloodBridge – Verify Your Email',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #f3f3f3;border-radius:12px;">
            <h2 style="color:#dc2626;text-align:center;">Welcome to BloodBridge 🩸</h2>
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>Thank you for registering as a <strong>${roleLabel}</strong>. Please use the verification code below to confirm your email address:</p>
            <div style="text-align:center;margin:32px 0;">
              <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#dc2626;background:#fff5f5;padding:16px 24px;border-radius:10px;border:2px dashed #dc2626;">
                ${otp}
              </span>
            </div>
            <p style="color:#666;font-size:14px;">This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
            <p style="color:#666;font-size:13px;">If you did not create an account, please ignore this email.</p>
            <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">
            <p style="color:#999;font-size:12px;text-align:center;">BloodBridge Team – Saving lives, one drop at a time.</p>
          </div>
        `,
      });
      console.log('Verification email sent to:', user.email);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
      // Don't fail the request — user is created, OTP is saved in DB
      // Log OTP to console for development testing
      console.log(`[DEV] OTP for ${user.email}: ${otp}`);
    }

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for the verification code.',
      email: user.email,
      role: user.role,
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

// Verify Email OTP
export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and verification code are required' });
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationCode: code.trim(),
      verificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    console.log('Email verified for:', user.email);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
        hospitalName: user.hospitalName,
        location: user.location,
        isVerified: true,
        token,
      },
    });
  } catch (error) {
    console.error('Verify email error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// Resend Verification Code
export const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    const otp = generateOTP();
    user.verificationCode = otp;
    user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await createTransporter().sendMail({
      from: `"BloodBridge" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'BloodBridge – New Verification Code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #f3f3f3;border-radius:12px;">
          <h2 style="color:#dc2626;text-align:center;">New Verification Code 🩸</h2>
          <p>Hi <strong>${user.username}</strong>,</p>
          <p>Here is your new verification code:</p>
          <div style="text-align:center;margin:32px 0;">
            <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#dc2626;background:#fff5f5;padding:16px 24px;border-radius:10px;border:2px dashed #dc2626;">
              ${otp}
            </span>
          </div>
          <p style="color:#666;font-size:14px;">This code expires in <strong>15 minutes</strong>.</p>
          <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">
          <p style="color:#999;font-size:12px;text-align:center;">BloodBridge Team</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'New verification code sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// FIXED LOGIN – Now supports email OR phone
export const loginUser = async (req, res) => {
  const { email, phone, password } = req.body;

  console.log('Backend → Login attempt received:', { email, phone, password: '***hidden***' });

  try {
    if ((!email && !phone) || !password) {
      console.log('Backend → Missing identifier or password');
      return res.status(400).json({ success: false, message: 'Email/phone and password are required' });
    }

    // Find user by email OR phone
    const user = await User.findOne({
      $or: [
        email ? { email: email.toLowerCase() } : {},
        phone ? { phone } : {},
      ],
    }).select('+password');

    if (!user) {
      console.log('Backend → No user found for:', { email, phone });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user has a password (some accounts may be Google-only)
    if (!user.password) {
      console.log('Backend → User has no password (Google OAuth account):', user.email || user.phone);
      return res.status(401).json({
        success: false,
        message: 'This account uses Google sign-in. Please sign in with Google or reset your password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Backend → Password mismatch for user:', user.email || user.phone);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Success
    const token = generateToken(user._id);

    console.log('Backend → Login success for:', user.email || user.phone);

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
        token,
      },
    });
  } catch (error) {
    console.error('Backend → Login error:', error.stack || error.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Get Current User (unchanged)
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

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If email exists, reset link sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    try {
      await createTransporter().sendMail({
        from: `"BloodBridge" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'BloodBridge – Reset Your Password',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #f3f3f3;border-radius:12px;">
            <h2 style="color:#dc2626;text-align:center;">Password Reset Request 🩸</h2>
            <p>Hi <strong>${user.username || 'User'}</strong>,</p>
            <p>You requested to reset your BloodBridge password. Click the button below to set a new password:</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#dc2626;color:white;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px;">
                Reset My Password
              </a>
            </div>
            <p style="color:#666;font-size:14px;">This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>
            <p style="color:#999;font-size:13px;margin-top:8px;">Or copy this link into your browser:<br>
              <span style="color:#dc2626;word-break:break-all;">${resetUrl}</span>
            </p>
            <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">
            <p style="color:#999;font-size:12px;text-align:center;">BloodBridge Team – Saving lives, one drop at a time.</p>
          </div>
        `,
      });
      console.log('Password reset email sent to:', user.email);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr.message);
      console.log(`[DEV] Reset URL for ${user.email}: ${resetUrl}`);
      // Still return success — token is saved, user can use the link if printed in logs
    }

    res.json({ success: true, message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  console.log('Backend → Reset password attempt with token:', token.substring(0, 10) + '...');

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    console.log('Backend → User found for reset:', user ? user.email : 'NOT FOUND');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    console.log('Backend → Saving password for user:', user.email);
    await user.save();

    console.log('Backend → Password reset successful for:', user.email);
    res.json({ success: true, message: 'Password updated successfully. Please login.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// Google OAuth Login / Register
export const googleLogin = async (req, res) => {
  const { credential, role: requestedRole } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential is required' });
  }

  // Only allow valid roles; default to 'receiver'
  const allowedRoles = ['receiver', 'donor', 'hospital'];
  const newUserRole = allowedRoles.includes(requestedRole) ? requestedRole : 'receiver';

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link googleId if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar && picture) user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user with the requested role
      user = await User.create({
        username: name,
        email,
        googleId,
        avatar: picture || null,
        role: newUserRole,
        hospitalName: newUserRole === 'hospital' ? name : undefined,
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      isNewUser: !user.bloodGroup && user.role !== 'hospital',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
        isAvailable: user.isAvailable,
        avatar: user.avatar,
        token,
      },
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ success: false, message: 'Invalid Google credential' });
  }
};

// Update Profile (unchanged)
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
      // Validate password length
      if (updates.newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      const user = await User.findById(userId).select('+password');

      // If user has an existing password, verify current password
      if (user.password) {
        if (!updates.currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password required' });
        }

        const isMatch = await bcrypt.compare(updates.currentPassword, user.password);

        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password incorrect' });
        }
      }
      // If user doesn't have a password (Google OAuth), they can set one without verification

      // Hash and set new password
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.newPassword, salt);

      delete updates.currentPassword;
      delete updates.newPassword;

      console.log('Backend → Password updated for user:', userId);
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

// Set Password - Allow users to set/change password (for unified login)
export const setPassword = async (req, res) => {
  const userId = req.user._id;
  const { password, currentPassword } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'New password is required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user already has a password, require current password to change it
    if (user.password && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    // Hash and set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    console.log('Password set successfully for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password set successfully! You can now login with email/password.',
    });
  } catch (error) {
    console.error('Set password error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while setting password' });
  }
};