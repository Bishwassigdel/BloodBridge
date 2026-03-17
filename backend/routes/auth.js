// src/routes/auth.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // ← added for folder creation
import {
  signupUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  googleLogin,
  verifyEmail,
  resendVerificationCode,
  setPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

// ── Ensure upload folder exists ─────────────────────────────────────────
const uploadDir = 'public/uploads/avatars/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Multer setup ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid file',
    });
  }
  next();
};

const router = express.Router();

// ── PUBLIC ROUTES ───────────────────────────────────────────────────────
router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);

// ── PROTECTED ROUTES ────────────────────────────────────────────────────
router.get('/me', protect, getMe);

// ── Update profile with avatar upload ───────────────────────────────────
router.patch(
  '/profile',
  protect,
  upload.single('avatar'),
  handleMulterError,
  updateProfile
);

// ── Password reset ───────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ── Set Password (for unified login - allows users to set password on any account) ─────
router.post('/set-password', protect, setPassword);

// ── Google OAuth ─────────────────────────────────────────────────────────
router.post('/google', googleLogin);

export default router;