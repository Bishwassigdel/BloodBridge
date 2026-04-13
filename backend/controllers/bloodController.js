// src/controllers/bloodController.js
import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/user.js';
import Donation from '../models/Donation.js';
import { autoResetAvailability } from './authController.js';
import { broadcastToBloodGroup, broadcastToAllBloodGroup, sendToUser } from '../sse.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Create a new blood request (receiver creates request)
 */
export const createBloodRequest = async (req, res) => {
  try {
    const {
      hospital,
      bloodGroup,
      units,
      urgency = 'normal',
      location,
      contactPhone,
      note,
      coordinates, // { lat, lng } — saved silently for future map use
    } = req.body;

    if (!hospital || !bloodGroup || !units || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Hospital, blood group, units, and contact phone are required',
      });
    }

    const request = await BloodRequest.create({
      requester: req.user._id,
      hospital,
      bloodGroup,
      units: Number(units),
      urgency,
      location: location || hospital,
      contactPhone,
      note,
      coordinates: coordinates || { lat: null, lng: null },
      status: 'pending',
    });

    // Safe populate (won't crash if fails)
    try {
      await request.populate('requester', 'username phone email');
    } catch (popErr) {
      console.warn('Populate requester failed:', popErr.message);
    }

    // Notify matching available donors
    let notifiedCount = 0;
    try {
      // Notify ALL matching blood group donors (available first, then unavailable)
      const allMatchingDonors = await User.find({
        role: 'donor',
        bloodGroup: bloodGroup,
        _id: { $ne: req.user._id },
      })
        .select('_id isAvailable')
        .lean();

      if (allMatchingDonors.length > 0) {
        const notifications = allMatchingDonors.map((donor) => ({
          user: donor._id,
          message: donor.isAvailable
            ? `New ${urgency.toUpperCase()} blood request for ${bloodGroup} (${units} units) at ${hospital}. You can donate — check your dashboard!`
            : `New ${urgency.toUpperCase()} blood request for ${bloodGroup} (${units} units) at ${hospital}. You're in cooldown but can view the request.`,
          type: 'new_blood_request',
          data: {
            requestId: request._id.toString(),
            hospital,
            bloodGroup,
            units,
            urgency,
            location,
            contactPhone,
            requesterName: req.user?.username || 'A patient',
          },
        }));

        await Notification.insertMany(notifications);
        notifiedCount = allMatchingDonors.filter(d => d.isAvailable).length;

        console.log(`Notified ${allMatchingDonors.length} donors (${notifiedCount} available) for request ${request._id}`);
      } else {
        console.log(`No matching donors found for blood group: ${bloodGroup}`);
      }
    } catch (notifyErr) {
      console.error('Failed to notify donors (non-fatal):', notifyErr.message);
      // Continue — don't crash the request
    }

    // ── SSE: Instant push to online matching donors ───────────────────────
    try {
      const ssePayload = {
        requestId: request._id.toString(),
        hospital,
        bloodGroup,
        units,
        urgency,
        location: location || hospital,
        contactPhone,
        requesterName: req.user?.username || 'A patient',
        createdAt: request.createdAt,
      };
      broadcastToBloodGroup(bloodGroup, 'new_blood_request', ssePayload, req.user._id);
    } catch (sseErr) {
      console.warn('[SSE] Broadcast failed (non-fatal):', sseErr.message);
    }

    // ── Emergency Email: send to all available matching donors ───────────
    if (urgency === 'emergency') {
      try {
        const emailDonors = await User.find({
          role: 'donor',
          bloodGroup,
          isAvailable: true,
          email: { $exists: true, $ne: '' },
          _id: { $ne: req.user._id },
        }).select('_id email username').lean();

        if (emailDonors.length > 0) {
          const transporter = createTransporter();
          const tokenEntries = [];

          await Promise.allSettled(emailDonors.map(async (donor) => {
            const token = crypto.randomBytes(20).toString('hex');
            tokenEntries.push({ donorId: donor._id, token, used: false, action: null });

            const acceptUrl  = `${FRONTEND_URL}/emergency-respond?token=${token}&action=accept`;
            const rejectUrl  = `${FRONTEND_URL}/emergency-respond?token=${token}&action=reject`;
            const requesterName = req.user?.username || 'A patient';

            const html = `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #fecaca;">
                <!-- Header -->
                <div style="background:#dc2626;padding:28px 32px;text-align:center;">
                  <p style="color:#fff;font-size:13px;margin:0 0 4px;letter-spacing:1px;text-transform:uppercase;">BloodBridge Emergency</p>
                  <h1 style="color:#fff;margin:0;font-size:26px;">🚨 Emergency Blood Needed</h1>
                  <p style="color:#fecaca;margin:8px 0 0;font-size:14px;">Immediate response required</p>
                </div>

                <!-- Body -->
                <div style="padding:28px 32px;">
                  <p style="color:#374151;font-size:15px;margin:0 0 20px;">
                    Hi <strong>${donor.username}</strong>, someone urgently needs your help right now.
                  </p>

                  <!-- Details card -->
                  <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;padding:20px;margin:0 0 24px;">
                    <table style="width:100%;border-collapse:collapse;">
                      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:130px;">Blood Group</td>
                          <td style="padding:5px 0;color:#111827;font-weight:bold;font-size:18px;">${bloodGroup}</td></tr>
                      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Units Needed</td>
                          <td style="padding:5px 0;color:#111827;font-weight:600;">${units} unit${units > 1 ? 's' : ''}</td></tr>
                      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Hospital</td>
                          <td style="padding:5px 0;color:#111827;font-weight:600;">${hospital}</td></tr>
                      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Location</td>
                          <td style="padding:5px 0;color:#111827;">${location || hospital}</td></tr>
                      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Contact</td>
                          <td style="padding:5px 0;color:#dc2626;font-weight:600;">${contactPhone}</td></tr>
                      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Requested by</td>
                          <td style="padding:5px 0;color:#111827;">${requesterName}</td></tr>
                    </table>
                  </div>

                  <p style="color:#374151;font-size:14px;margin:0 0 24px;">
                    Can you donate? Click one of the buttons below — <strong>no login required</strong>.
                  </p>

                  <!-- Action buttons -->
                  <table style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="padding:0 8px 0 0;width:50%;">
                        <a href="${acceptUrl}" style="display:block;text-align:center;padding:16px;background:#16a34a;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;">
                          ✅ Yes, I Can Donate
                        </a>
                      </td>
                      <td style="padding:0 0 0 8px;width:50%;">
                        <a href="${rejectUrl}" style="display:block;text-align:center;padding:16px;background:#6b7280;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;">
                          ❌ Cannot Donate Now
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;text-align:center;">
                    This link is unique to you and expires once used or the request is fulfilled.<br>
                    Emergency hotline: <strong>01-4288485</strong>
                  </p>
                </div>

                <!-- Footer -->
                <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">BloodBridge – Saving lives, one drop at a time 🩸</p>
                </div>
              </div>
            `;

            await transporter.sendMail({
              from: `"BloodBridge 🚨" <${process.env.EMAIL_USER}>`,
              to: donor.email,
              subject: `🚨 URGENT: ${bloodGroup} blood needed at ${hospital} — Can you help?`,
              html,
            });
          }));

          // Save all tokens to the request
          await BloodRequest.findByIdAndUpdate(request._id, {
            $push: { emailTokens: { $each: tokenEntries } },
          });

          console.log(`[Emergency Email] Sent to ${emailDonors.length} donors for request ${request._id}`);
        }
      } catch (emailErr) {
        console.error('[Emergency Email] Failed (non-fatal):', emailErr.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── Auto-escalation: if still pending after 10 min, re-notify cooldown donors ──
    if (urgency === 'emergency') {
      const requestId = request._id;
      const requesterId = req.user._id;
      setTimeout(async () => {
        try {
          const stillPending = await BloodRequest.findOne({ _id: requestId, status: 'pending' });
          if (!stillPending) return; // Already accepted or cancelled

          // Re-notify cooldown donors via DB notifications
          const cooldownDonors = await User.find({
            role: 'donor',
            bloodGroup,
            isAvailable: false,
            _id: { $ne: requesterId },
          }).select('_id').lean();

          if (cooldownDonors.length > 0) {
            await Notification.insertMany(cooldownDonors.map(d => ({
              user: d._id,
              message: `🚨 STILL URGENT — Emergency ${bloodGroup} blood (${units} units) needed at ${hospital}. No donor has responded yet. Can you help?`,
              type: 'new_blood_request',
              severity: 'high',
              data: {
                requestId: requestId.toString(),
                hospital, bloodGroup, units,
                urgency: 'emergency',
                contactPhone,
                isEscalation: true,
              },
            })));

            // SSE escalation push
            broadcastToAllBloodGroup(bloodGroup, 'sos_escalation', {
              requestId: requestId.toString(),
              hospital, bloodGroup, units, contactPhone,
              message: `🚨 STILL URGENT — No donor yet for ${bloodGroup} at ${hospital}`,
            }, requesterId);
          }

          // Notify receiver: still no donor
          sendToUser(requesterId, 'sos_no_response', {
            requestId: requestId.toString(),
            escalatedCount: cooldownDonors.length,
            message: 'No donor accepted yet. Re-notifying more donors...',
          });

          console.log(`[Auto-escalation] SOS ${requestId}: notified ${cooldownDonors.length} cooldown donors`);
        } catch (escErr) {
          console.error('[Auto-escalation] Error:', escErr.message);
        }
      }, 10 * 60 * 1000); // 10 minutes
    }
    // ─────────────────────────────────────────────────────────────────────

    res.status(201).json({
      success: true,
      message: urgency === 'emergency'
        ? 'Emergency request saved! WhatsApp will open on frontend.'
        : `Blood request created successfully! ${notifiedCount} matching donor(s) have been notified.`,
      request,
      notifiedCount,
    });
  } catch (err) {
    console.error('Create blood request CRASH:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      userId: req.user?._id,
    });

    res.status(500).json({
      success: false,
      message: 'Server error while creating blood request. Please try again later.',
      // Only show detailed error in development
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// ────────────────────────────────────────────────────────────────────────
// The rest of your file stays exactly the same
// ────────────────────────────────────────────────────────────────────────

/**
 * Get my own requests (for receiver - shows requests I created)
 */
export const getMyRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requester: req.user._id })
      .sort({ createdAt: -1 })
      .populate('requester', 'username phone email')
      .populate('acceptedBy', 'username phone email')
      .lean();

    res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error('Get my requests error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get matching requests for donors (only shows requests from OTHER users)
 * Also auto-resets availability if the 56-day cooldown has passed.
 */
export const getMatchingRequests = async (req, res) => {
  try {
    const donorBloodGroup = req.user.bloodGroup;

    if (!donorBloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Your blood group is not set in your profile. Please update it.',
      });
    }

    // Auto-reset availability for this donor if cooldown has expired
    const freshUser = await User.findById(req.user._id);
    const updatedUser = await autoResetAvailability(freshUser);
    const donorIsAvailable = updatedUser.isAvailable;

    // Pending requests matching this donor's blood group (open for anyone to accept)
    const pendingRequests = await BloodRequest.find({
      bloodGroup: donorBloodGroup,
      status: 'pending',
      requester: { $ne: req.user._id },
    })
      .sort({ urgency: -1, createdAt: -1 })
      .populate('requester', 'username phone email location')
      .populate('acceptedBy', 'username phone')
      .lean();

    // Accepted requests where THIS donor was assigned (so they can see & track them)
    const myAcceptedRequests = await BloodRequest.find({
      acceptedBy: req.user._id,
      status: 'accepted',
    })
      .sort({ updatedAt: -1 })
      .populate('requester', 'username phone email location')
      .populate('acceptedBy', 'username phone')
      .lean();

    // Merge: accepted ones first (action needed), then pending
    const requests = [...myAcceptedRequests, ...pendingRequests];

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
      donorIsAvailable,
    });
  } catch (err) {
    console.error('Get matching requests error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching matching requests',
    });
  }
};

/**
 * Accept a blood request (only donors can accept)
 */
export const acceptBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await BloodRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.requester.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot accept your own blood request',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept: request is already ${request.status}`
      });
    }

    // ── 56-day eligibility guard ──────────────────────────────────────────
    const donor = await User.findById(userId);
    if (donor.lastDonation) {
      const daysSince = (Date.now() - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24);
      if (daysSince < 56) {
        const daysLeft = Math.ceil(56 - daysSince);
        const nextEligible = new Date(new Date(donor.lastDonation).getTime() + 56 * 24 * 60 * 60 * 1000);
        return res.status(403).json({
          success: false,
          message: `You are not eligible to donate yet. Your body needs ${daysLeft} more day${daysLeft !== 1 ? 's' : ''} to recover. You can donate again after ${nextEligible.toDateString()}.`,
          daysLeft,
          nextEligibleDate: nextEligible,
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    request.status = 'accepted';
    request.acceptedBy = userId;
    await request.save();

    // ── Auto-record donation & start 56-day cooldown ──────────────────────
    await Donation.create({
      donor: userId,
      hospital: request.hospital,
      bloodGroup: request.bloodGroup,
      units: request.units,
      notes: `Accepted blood request from ${request.hospital}`,
      donatedAt: new Date(),
    });

    await User.findByIdAndUpdate(userId, {
      lastDonation: new Date(),
      isAvailable: false,
    });
    // ─────────────────────────────────────────────────────────────────────

    // Notify receiver their request was accepted
    await Notification.create({
      user: request.requester,
      message: `Your blood request at ${request.hospital} has been accepted by ${req.user.username}! Please contact them to coordinate.`,
      type: 'request_accepted',
      data: {
        requestId: request._id,
        donorId: userId,
        donorName: req.user.username,
        contactPhone: req.user.phone,
      },
    });

    await request.populate('requester', 'username phone email');
    await request.populate('acceptedBy', 'username phone email');

    // ── SSE: Instantly notify receiver that a donor was found ─────────────
    try {
      sendToUser(request.requester._id, 'sos_accepted', {
        requestId: request._id.toString(),
        donorName: req.user.username,
        donorPhone: req.user.phone,
        donorEmail: req.user.email,
        bloodGroup: request.bloodGroup,
        units: request.units,
        hospital: request.hospital,
        message: `${req.user.username} accepted your blood request!`,
      });
    } catch (sseErr) {
      console.warn('[SSE] Accept push failed (non-fatal):', sseErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────

    res.status(200).json({
      success: true,
      message: 'Request accepted! Donation recorded and 56-day cooldown started.',
      request,
    });
  } catch (err) {
    console.error('Accept blood request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
/**
 * Fulfill a blood request (receiver confirms blood was received)
 * PATCH /api/blood/:id/fulfill
 */
/**
 * Cancel a blood request (receiver cancels their own pending request)
 * PATCH /api/blood/:id/cancel
 */
export const cancelBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a request that is already ${request.status}`,
      });
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({ success: true, message: 'Request cancelled successfully', request });
  } catch (err) {
    console.error('Cancel blood request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Edit a pending blood request (receiver edits their own pending request)
 * PATCH /api/blood/:id/edit
 */
export const editBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { hospital, units, urgency, location, contactPhone, note, bloodGroup } = req.body;

    const request = await BloodRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be edited',
      });
    }

    if (hospital) request.hospital = hospital;
    if (units) request.units = Number(units);
    if (urgency) request.urgency = urgency;
    if (location !== undefined) request.location = location;
    if (contactPhone) request.contactPhone = contactPhone;
    if (note !== undefined) request.note = note;
    if (bloodGroup) request.bloodGroup = bloodGroup;

    await request.save();
    await request.populate('requester', 'username phone email');
    await request.populate('acceptedBy', 'username phone email');

    res.status(200).json({ success: true, message: 'Request updated successfully', request });
  } catch (err) {
    console.error('Edit blood request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const fulfillBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await BloodRequest.findById(id)
      .populate('acceptedBy', 'username phone email _id');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only the original requester (receiver) can mark as fulfilled
    if (request.requester.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the person who made this request can mark it as fulfilled',
      });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: `Request must be in accepted state to fulfill. Current: ${request.status}`,
      });
    }

    request.status = 'fulfilled';
    await request.save();

    // Send heartfelt thank-you notification to the donor
    if (request.acceptedBy) {
      await Notification.create({
        user: request.acceptedBy._id,
        message: `🎉 You saved a life! ${req.user.username} has confirmed they received blood for their request at ${request.hospital}. Thank you from the bottom of their heart ❤️`,
        type: 'request_fulfilled',
        data: {
          requestId: request._id,
          receiverName: req.user.username,
          hospital: request.hospital,
          bloodGroup: request.bloodGroup,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blood request marked as fulfilled. Thank you!',
      request,
    });
  } catch (err) {
    console.error('Fulfill blood request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get donor network list (hospital-only)
 * GET /api/blood/donors?bloodGroup=A%2B&available=true&search=kathmandu
 */
export const getDonors = async (req, res) => {
  try {
    const { bloodGroup, available, search } = req.query;

    const filter = { role: 'donor' };
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (available === 'true') filter.isAvailable = true;
    if (available === 'false') filter.isAvailable = false;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const donors = await User.find(filter)
      .select('username bloodGroup phone location isAvailable lastDonation createdAt')
      .sort({ isAvailable: -1, createdAt: -1 })
      .lean();

    // Compute days left in cooldown for unavailable donors
    const now = Date.now();
    const enriched = donors.map(d => {
      let daysLeft = 0;
      let nextEligible = null;
      if (!d.isAvailable && d.lastDonation) {
        const elapsed = (now - new Date(d.lastDonation)) / 86400000;
        daysLeft = Math.max(0, Math.ceil(56 - elapsed));
        nextEligible = new Date(new Date(d.lastDonation).getTime() + 56 * 86400000);
      }
      return { ...d, daysLeft, nextEligible };
    });

    // Summary stats
    const total = enriched.length;
    const availableCount = enriched.filter(d => d.isAvailable).length;
    const cooldownCount = total - availableCount;

    // Count by blood group
    const byBloodGroup = {};
    enriched.forEach(d => {
      byBloodGroup[d.bloodGroup] = (byBloodGroup[d.bloodGroup] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      donors: enriched,
      stats: { total, available: availableCount, cooldown: cooldownCount, byBloodGroup },
    });
  } catch (err) {
    console.error('Get donors error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Send alert notification to donors of a blood group (hospital-only)
 * POST /api/blood/donors/alert
 * Body: { bloodGroup, message?, allDonors? }
 *   allDonors: if true, also notifies donors currently in cooldown
 */
export const sendDonorAlert = async (req, res) => {
  try {
    const { bloodGroup, message, allDonors = false } = req.body;

    if (!bloodGroup) {
      return res.status(400).json({ success: false, message: 'Blood group is required' });
    }

    const hospitalName = req.user.hospitalName || req.user.username;
    const hospitalPhone = req.user.phone || null;
    const hospitalLocation = req.user.location || null;

    // Build donor filter — optionally include cooldown donors
    const donorFilter = { role: 'donor', bloodGroup };
    if (!allDonors) donorFilter.isAvailable = true;

    const matchingDonors = await User.find(donorFilter)
      .select('_id isAvailable')
      .lean();

    const availableCount = matchingDonors.filter(d => d.isAvailable).length;
    const cooldownCount = matchingDonors.length - availableCount;

    if (matchingDonors.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${allDonors ? '' : 'available '}${bloodGroup} donors found to notify.`,
        notified: 0,
        availableCount: 0,
        cooldownCount: 0,
      });
    }

    const notifications = matchingDonors.map(donor => {
      const defaultMsg = donor.isAvailable
        ? `🏥 ${hospitalName} needs ${bloodGroup} blood donors. You're eligible — please visit or contact us!`
        : `🏥 ${hospitalName} needs ${bloodGroup} blood donors. You're currently in cooldown, but keeping you in the loop.`;
      return {
        user: donor._id,
        message: message?.trim() || defaultMsg,
        type: 'general',
        severity: 'high',
        data: {
          hospitalName,
          bloodGroup,
          type: 'hospital_broadcast',
          hospitalPhone,
          hospitalLocation,
        },
      };
    });

    await Notification.insertMany(notifications);

    const summary = allDonors
      ? `Alert sent to ${matchingDonors.length} ${bloodGroup} donor(s) — ${availableCount} available, ${cooldownCount} in cooldown.`
      : `Alert sent to ${availableCount} available ${bloodGroup} donor(s).`;

    res.status(200).json({
      success: true,
      message: summary,
      notified: matchingDonors.length,
      availableCount,
      cooldownCount,
    });
  } catch (err) {
    console.error('Send donor alert error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get all blood requests on the platform (hospital-only)
 * GET /api/blood/all-requests?bloodGroup=A%2B&urgency=emergency&status=pending&search=kathmandu
 */
export const getAllRequests = async (req, res) => {
  try {
    const { bloodGroup, urgency, status, search } = req.query;

    const filter = {};
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (urgency) filter.urgency = urgency;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { hospital: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const requests = await BloodRequest.find(filter)
      .sort({ urgency: -1, createdAt: -1 })
      .populate('requester', 'username phone email')
      .populate('acceptedBy', 'username phone')
      .lean();

    // Summary stats
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const total = requests.length;
    const emergency = requests.filter(r => r.urgency === 'emergency' && r.status === 'pending').length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const accepted = requests.filter(r => r.status === 'accepted').length;
    const fulfilledToday = requests.filter(r =>
      (r.status === 'fulfilled' || r.status === 'Fulfilled') &&
      new Date(r.updatedAt) >= startOfDay
    ).length;

    res.status(200).json({
      success: true,
      requests,
      stats: { total, emergency, pending, accepted, fulfilledToday },
    });
  } catch (err) {
    console.error('Get all requests error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Assign a specific donor to a pending request — hospital only
 * PATCH /api/blood/:id/assign-donor
 * Body: { donorId }
 */
export const assignDonorToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { donorId } = req.body;
    const hospitalUserId = req.user._id;

    if (!donorId) {
      return res.status(400).json({ success: false, message: 'donorId is required' });
    }

    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only the hospital that posted this request can assign a donor
    if (request.requester.toString() !== hospitalUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the hospital that posted this request can assign a donor',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign donor: request is already ${request.status}`,
      });
    }

    const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }
    if (donor.role !== 'donor') {
      return res.status(400).json({ success: false, message: 'Selected user is not a registered donor' });
    }

    // Blood group must match
    if (donor.bloodGroup !== request.bloodGroup) {
      return res.status(400).json({
        success: false,
        message: `Donor's blood group (${donor.bloodGroup}) does not match this request (${request.bloodGroup})`,
      });
    }

    // 56-day eligibility check
    if (donor.lastDonation) {
      const daysSince = (Date.now() - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24);
      if (daysSince < 56) {
        const daysLeft = Math.ceil(56 - daysSince);
        const nextEligible = new Date(new Date(donor.lastDonation).getTime() + 56 * 24 * 60 * 60 * 1000);
        return res.status(403).json({
          success: false,
          message: `This donor is not eligible yet — they need ${daysLeft} more day${daysLeft !== 1 ? 's' : ''} to recover (eligible after ${nextEligible.toDateString()}).`,
        });
      }
    }

    // Assign the donor
    request.status = 'accepted';
    request.acceptedBy = donorId;
    await request.save();

    // Record the donation and start the 56-day cooldown
    await Donation.create({
      donor: donorId,
      hospital: request.hospital,
      bloodGroup: request.bloodGroup,
      units: request.units,
      notes: `Assigned by hospital for blood request at ${request.hospital}`,
      donatedAt: new Date(),
    });

    await User.findByIdAndUpdate(donorId, {
      lastDonation: new Date(),
      isAvailable: false,
    });

    // Notify the donor
    await Notification.create({
      user: donorId,
      message: `🏥 ${req.user.hospitalName || req.user.username} has confirmed your donation for their blood request (${request.bloodGroup}, ${request.units} unit${request.units > 1 ? 's' : ''}). Thank you for saving a life! ❤️`,
      type: 'request_accepted',
      data: {
        requestId: request._id,
        hospital: request.hospital,
        bloodGroup: request.bloodGroup,
      },
    });

    await request.populate('requester', 'username phone email');
    await request.populate('acceptedBy', 'username phone email');

    res.status(200).json({
      success: true,
      message: `${donor.username} has been assigned as the donor. Donation recorded and 56-day cooldown started.`,
      request,
    });
  } catch (err) {
    console.error('Assign donor error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Public platform stats — no auth required
 * GET /api/blood/stats
 */
export const getPlatformStats = async (req, res) => {
  try {
    // Start of current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalDonors,
      totalHospitals,
      totalDonations,
      acceptedRequests,
      monthlyRequests,
      monthlyFulfilled,
    ] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'hospital' }),
      Donation.countDocuments({}),
      BloodRequest.find({ status: { $in: ['accepted', 'fulfilled'] } })
        .select('createdAt updatedAt')
        .lean(),
      BloodRequest.countDocuments({ createdAt: { $gte: monthStart } }),
      BloodRequest.countDocuments({ status: 'fulfilled', createdAt: { $gte: monthStart } }),
    ]);

    // Average response time in minutes (createdAt → updatedAt on accepted/fulfilled)
    let avgResponseMins = 0;
    if (acceptedRequests.length > 0) {
      const totalMins = acceptedRequests.reduce((sum, r) => {
        const diff = (new Date(r.updatedAt) - new Date(r.createdAt)) / 60000;
        return sum + Math.max(0, diff);
      }, 0);
      avgResponseMins = Math.round(totalMins / acceptedRequests.length);
    }

    // Success rate = fulfilled / total requests this month (0 if no requests yet)
    const successRate = monthlyRequests > 0
      ? Math.round((monthlyFulfilled / monthlyRequests) * 100)
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        donors:          totalDonors,
        hospitals:       totalHospitals,
        donations:       totalDonations,
        responseTime:    avgResponseMins,
        monthlyRequests,
        successRate,
      },
    });
  } catch (err) {
    console.error('Platform stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Handle donor email response (accept / reject) via token — NO auth required
 * GET /api/blood/email-respond?token=xxx&action=accept|reject
 */
export const emailRespondToRequest = async (req, res) => {
  try {
    const { token, action } = req.query;

    if (!token || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid token or action.' });
    }

    // Find request containing this token
    const request = await BloodRequest.findOne({ 'emailTokens.token': token })
      .populate('requester', 'username phone email');

    if (!request) {
      return res.status(404).json({ success: false, message: 'This link is invalid or has expired.' });
    }

    const tokenEntry = request.emailTokens.find(t => t.token === token);

    if (tokenEntry.used) {
      return res.status(400).json({
        success: false,
        message: tokenEntry.action === 'accepted'
          ? 'You already accepted this request. Thank you!'
          : 'You already responded to this request.',
        alreadyUsed: true,
        action: tokenEntry.action,
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request is already ${request.status}. No action needed.`,
        requestStatus: request.status,
      });
    }

    // ── REJECT ────────────────────────────────────────────────────────────
    if (action === 'reject') {
      tokenEntry.used = true;
      tokenEntry.action = 'rejected';
      await request.save();
      return res.status(200).json({
        success: true,
        action: 'rejected',
        message: 'Thank you for letting us know. We will find another donor.',
      });
    }

    // ── ACCEPT ────────────────────────────────────────────────────────────
    const donor = await User.findById(tokenEntry.donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor account not found.' });
    }

    // 56-day eligibility check
    if (donor.lastDonation) {
      const daysSince = (Date.now() - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24);
      if (daysSince < 56) {
        const daysLeft = Math.ceil(56 - daysSince);
        return res.status(403).json({
          success: false,
          message: `You are not eligible yet — ${daysLeft} more day(s) needed before you can donate again.`,
          daysLeft,
        });
      }
    }

    // Accept the request
    request.status   = 'accepted';
    request.acceptedBy = tokenEntry.donorId;
    tokenEntry.used  = true;
    tokenEntry.action = 'accepted';
    await request.save();

    // Auto-record donation + start cooldown
    await Donation.create({
      donor:     tokenEntry.donorId,
      hospital:  request.hospital,
      bloodGroup: request.bloodGroup,
      units:     request.units,
      notes:     'Accepted via emergency email link',
      donatedAt: new Date(),
    });

    await User.findByIdAndUpdate(tokenEntry.donorId, {
      lastDonation: new Date(),
      isAvailable: false,
    });

    // Notify receiver in DB
    await Notification.create({
      user:    request.requester._id,
      message: `Your emergency blood request at ${request.hospital} has been accepted by ${donor.username}! Contact: ${donor.phone}`,
      type:    'request_accepted',
      data: {
        requestId:    request._id,
        donorName:    donor.username,
        contactPhone: donor.phone,
        donorEmail:   donor.email,
      },
    });

    // SSE push to receiver if online
    try {
      sendToUser(request.requester._id, 'sos_accepted', {
        requestId:  request._id.toString(),
        donorName:  donor.username,
        donorPhone: donor.phone,
        donorEmail: donor.email,
        bloodGroup: request.bloodGroup,
        units:      request.units,
        hospital:   request.hospital,
        message:    `${donor.username} accepted your emergency request via email!`,
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      action: 'accepted',
      message: `Thank you ${donor.username}! Your acceptance has been recorded. Please go to ${request.hospital} as soon as possible.`,
      hospital: request.hospital,
      bloodGroup: request.bloodGroup,
      units: request.units,
      contactPhone: request.requester?.phone,
      requesterName: request.requester?.username,
    });

  } catch (err) {
    console.error('Email respond error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};
