// backend/routes/event.js
import express from 'express';
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

// PATCH /api/events/:id  — hospital updates their event
router.patch('/:id', updateEvent);

// DELETE /api/events/:id — hospital cancels their event
router.delete('/:id', cancelEvent);

// POST /api/events/:id/rsvp — donor/receiver RSVPs
router.post('/:id/rsvp', rsvpEvent);

export default router;
