// backend/controllers/eventController.js
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import User from '../models/user.js';
import { broadcastToAllDonorsReceivers } from '../sse.js';

// Lazy transporter — initialised on first email send, not at startup
let _transporter = null;
const getTransporter = async () => {
  if (!_transporter) {
    const nodemailer = (await import('nodemailer')).default;
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return _transporter;
};

// ── Helper: event email HTML ─────────────────────────────────────────────────
const buildEventEmail = (event, recipientName) => {
  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const groupsText = event.bloodGroupsNeeded.includes('All')
    ? 'All blood groups welcome'
    : `Needed: ${event.bloodGroupsNeeded.join(', ')}`;

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8" /></head>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:30px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626,#be123c);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🩸</div>
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">Blood Donation Drive</h1>
              <p style="margin:8px 0 0;color:#fecdd3;font-size:15px;">Hosted by ${event.hospitalName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#374151;font-size:16px;margin:0 0 20px;">Hi ${recipientName},</p>
              <p style="color:#374151;font-size:16px;margin:0 0 24px;">
                <strong>${event.hospitalName}</strong> is hosting a blood donation event and your help could save lives!
              </p>

              <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                <h2 style="margin:0 0 16px;color:#991b1b;font-size:20px;">${event.title}</h2>
                ${event.description ? `<p style="color:#6b7280;margin:0 0 16px;font-size:14px;">${event.description}</p>` : ''}
                <table cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;">📅 <strong>Date:</strong> ${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;">⏰ <strong>Time:</strong> ${event.time}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;">📍 <strong>Location:</strong> ${event.location}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;">🩸 <strong>${groupsText}</strong></td>
                  </tr>
                  ${event.targetDonors ? `<tr><td style="padding:6px 0;color:#374151;font-size:14px;">🎯 <strong>Target:</strong> ${event.targetDonors} donors</td></tr>` : ''}
                  ${event.contactPhone ? `<tr><td style="padding:6px 0;color:#374151;font-size:14px;">📞 <strong>Contact:</strong> ${event.contactPhone}</td></tr>` : ''}
                </table>
              </div>

              <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">
                Log in to BloodConnect to RSVP and confirm your attendance.
              </p>
              <p style="color:#6b7280;font-size:13px;margin:0;">
                One donation can save up to 3 lives. Thank you for being a hero! ❤️
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">BloodConnect • Saving lives across Nepal</p>
              <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">bloodbridge10@gmail.com</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Hospital creates a new blood donation event
// @route  POST /api/events
// @access Hospital only
// ─────────────────────────────────────────────────────────────────────────────
export const createEvent = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ success: false, message: 'Only hospitals can create events.' });
    }

    const { title, description, date, time, location, contactPhone, bloodGroupsNeeded, targetDonors } = req.body;

    if (!title || !date || !time || !location) {
      return res.status(400).json({ success: false, message: 'Title, date, time, and location are required.' });
    }

    const event = await Event.create({
      title,
      description: description || '',
      date: new Date(date),
      time,
      location,
      contactPhone: contactPhone || '',
      bloodGroupsNeeded: bloodGroupsNeeded?.length ? bloodGroupsNeeded : ['All'],
      targetDonors: targetDonors || 0,
      hospital: req.user._id,
      hospitalName: req.user.hospitalName || req.user.username,
    });

    // ── Phase 2: In-app notifications for all donors + receivers ────────────
    const recipients = await User.find({
      role: { $in: ['donor', 'receiver'] },
      isVerified: true,
    }).select('_id email username').lean();

    const notifDocs = recipients.map(u => ({
      user: u._id,
      type: 'event_notification',
      message: `📅 New blood donation drive: "${title}" at ${location} on ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
      severity: 'medium',
      data: { eventId: event._id, hospitalName: event.hospitalName },
    }));

    if (notifDocs.length) await Notification.insertMany(notifDocs);

    // ── Phase 2: SSE real-time push ─────────────────────────────────────────
    broadcastToAllDonorsReceivers('new_event', {
      eventId:      event._id,
      title:        event.title,
      hospitalName: event.hospitalName,
      date:         event.date,
      time:         event.time,
      location:     event.location,
      bloodGroupsNeeded: event.bloodGroupsNeeded,
    });

    // ── Phase 3: Email notifications (non-blocking) ─────────────────────────
    let emailsSent = 0;
    const recipientsWithEmail = recipients.filter(u => u.email);
    if (recipientsWithEmail.length > 0) {
      const emailPromises = recipientsWithEmail.map(async u =>
        (await getTransporter()).sendMail({
          from: `"BloodConnect" <${process.env.EMAIL_USER}>`,
          to: u.email,
          subject: `🩸 Blood Donation Drive: ${title} — ${event.hospitalName}`,
          html: buildEventEmail(event, u.username || 'Valued Member'),
        }).catch(err => {
          console.error(`[Event Email] Failed to send to ${u.email}:`, err.message);
        })
      );
      const results = await Promise.allSettled(emailPromises);
      emailsSent = results.filter(r => r.status === 'fulfilled').length;
    }

    // Save notified count
    event.notifiedCount = emailsSent;
    await event.save();

    res.status(201).json({
      success: true,
      message: `Event created! ${notifDocs.length} in-app notifications sent, ${emailsSent} emails sent.`,
      event,
    });
  } catch (err) {
    console.error('[createEvent] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Get all upcoming events (for donors/receivers to see)
// @route  GET /api/events
// @access All authenticated users
// ─────────────────────────────────────────────────────────────────────────────
export const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      status: { $in: ['upcoming', 'ongoing'] },
      date: { $gte: new Date(now.setHours(0, 0, 0, 0)) },
    })
      .sort({ date: 1 })
      .lean();

    res.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('[getUpcomingEvents]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch events.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Get all events by this hospital (including past/cancelled)
// @route  GET /api/events/mine
// @access Hospital only
// ─────────────────────────────────────────────────────────────────────────────
export const getHospitalEvents = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ success: false, message: 'Hospitals only.' });
    }
    const events = await Event.find({ hospital: req.user._id })
      .populate({
        path: 'rsvps.user',
        select: 'username email phone bloodGroup avatar location role',
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('[getHospitalEvents]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch hospital events.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Hospital updates their event
// @route  PATCH /api/events/:id
// @access Hospital only (event owner)
// ─────────────────────────────────────────────────────────────────────────────
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (event.hospital.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot edit a cancelled event.' });
    }
    // Allow editing completed events only for showcase fields (story, quote, image, stats)
    const showcaseOnlyFields = ['image', 'story', 'quote', 'quoteName', 'unitsCollected', 'totalDonors'];
    const nonShowcaseFields = Object.keys(req.body).filter(k => !showcaseOnlyFields.includes(k));
    if (event.status === 'completed' && nonShowcaseFields.length > 0) {
      return res.status(400).json({ success: false, message: 'Completed events can only have showcase details updated.' });
    }

    const allowed = ['title', 'description', 'date', 'time', 'location', 'contactPhone', 'bloodGroupsNeeded', 'targetDonors', 'status', 'image', 'story', 'quote', 'quoteName', 'unitsCollected', 'totalDonors'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    // If a cover image file was uploaded via multer, override the image field
    // with the public path. This takes precedence over any image URL in the body.
    if (req.file) {
      event.image = `/uploads/events/${req.file.filename}`;
    }

    await event.save();

    res.json({ success: true, message: 'Event updated.', event });
  } catch (err) {
    console.error('[updateEvent]', err);
    res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Hospital cancels their event
// @route  DELETE /api/events/:id
// @access Hospital only (event owner)
// ─────────────────────────────────────────────────────────────────────────────
export const cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (event.hospital.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    event.status = 'cancelled';
    await event.save();

    res.json({ success: true, message: 'Event cancelled.' });
  } catch (err) {
    console.error('[cancelEvent]', err);
    res.status(500).json({ success: false, message: 'Failed to cancel event.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Get all completed events for the public Past Events showcase
// @route  GET /api/events/past
// @access Public (no auth required)
// ─────────────────────────────────────────────────────────────────────────────
export const getPastEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'completed' })
      .sort({ date: -1 })
      .select('title description date location hospitalName image story quote quoteName unitsCollected totalDonors rsvps bloodGroupsNeeded')
      .lean();

    res.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('[getPastEvents]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch past events.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Donor/receiver RSVPs to an event
// @route  POST /api/events/:id/rsvp
// @access Donor or Receiver
// ─────────────────────────────────────────────────────────────────────────────
export const rsvpEvent = async (req, res) => {
  try {
    const { status } = req.body; // 'attending' | 'declined'
    if (!['attending', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'attending' or 'declined'." });
    }
    if (!['donor', 'receiver'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only donors and receivers can RSVP.' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot RSVP to a cancelled event.' });
    }

    const existing = event.rsvps.find(r => r.user.toString() === req.user._id.toString());
    if (existing) {
      existing.status = status;
    } else {
      event.rsvps.push({ user: req.user._id, status });
    }
    await event.save();

    res.json({
      success: true,
      message: status === 'attending' ? "You're marked as attending!" : "RSVP updated.",
      attendingCount: event.rsvps.filter(r => r.status === 'attending').length,
    });
  } catch (err) {
    console.error('[rsvpEvent]', err);
    res.status(500).json({ success: false, message: 'Failed to RSVP.' });
  }
};
