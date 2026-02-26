// src/routes/auth.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  signupUser,
  loginUser,
  getMe,
  updateProfile,          // ← NEW controller function
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

// ── Multer setup for avatar upload ──────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/avatars/');
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
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const router = express.Router();

// ── PUBLIC ROUTES (no authentication required) ──────────────────────────
router.post('/signup', signupUser);
router.post('/login', loginUser);

// ── PROTECTED ROUTES (require valid JWT) ────────────────────────────────
router.get('/me', protect, getMe);

// ── NEW: Update profile (including avatar, phone, blood group, etc.) ────
router.patch(
  '/profile',
  protect,                    // must be logged in
  upload.single('avatar'),    // handle file upload (field name: avatar)
  updateProfile               // controller function
);

export default router;