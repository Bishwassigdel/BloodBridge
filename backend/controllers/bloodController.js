// src/controllers/bloodController.js
import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/user.js';
import Donation from '../models/Donation.js';
import { autoResetAvailability } from './authController.js';

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

    res.status(201).json({
      success: true,
      message: urgency === 'emergency'
        ? 'Emergency request saved! WhatsApp will open on frontend.'
        : `Blood request created successfully! ${notifiedCount} matching donor(s) have been notified.`,
      request,
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
