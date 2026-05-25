// backend/routes/event.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/authMiddleware.js';
import {
  createEvent,
  getUpcomingEvents,
  getHospitalEvents,
  getPastEvents,
  updateEvent,
  cancelEvent,
  rsvpEvent,
} from '../controllers/eventController.js';

// ── Ensure event upload folder exists ──────────────────────────────────────
const eventUploadDir = 'public/uploads/events/';
if (!fs.existsSync(eventUploadDir)) {
  fs.mkdirSync(eventUploadDir, { recursive: true });
}

// ── Multer setup for event cover images ────────────────────────────────────
const eventStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, eventUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id || 'event'}-${uniqueSuffix}${ext}`);
  },
});

const eventUpload = multer({
  storage: eventStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — event covers can be larger than avatars
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
});

// Multer error -> JSON
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message || 'File upload error' });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message || 'Invalid file' });
  }
  next();
};

const router = express.Router();

// GET /api/events/past — public, no auth needed (for Home page showcase)
router.get('/past', getPastEvents);

// All routes below require authentication
router.use(protect);

// GET  /api/events       — all upcoming events (donors & receivers see this)
router.get('/', getUpcomingEvents);

// GET  /api/events/mine  — hospital's own events
router.get('/mine', getHospitalEvents);

// POST /api/events       — hospital creates an event
router.post('/', createEvent);

// PATCH /api/events/:id  — hospital updates their event (supports optional cover image upload)
router.patch(
  '/:id',
  eventUpload.single('image'),
  handleMulterError,
  updateEvent
);

// DELETE /api/events/:id — hospital cancels their event
router.delete('/:id', cancelEvent);

// POST /api/events/:id/rsvp — donor/receiver RSVPs
router.post('/:id/rsvp', rsvpEvent);

export default router;
