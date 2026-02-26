// src/controllers/bloodController.js
import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/user.js';           // ← THIS WAS MISSING → caused 500 crash

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
      const matchingDonors = await User.find({
        role: 'donor',
        bloodGroup: bloodGroup,
        isAvailable: true,
        _id: { $ne: req.user._id },
      })
        .select('_id')
        .lean();

      if (matchingDonors.length > 0) {
        const notifications = matchingDonors.map((donor) => ({
          user: donor._id,
          message: `New ${urgency.toUpperCase()} blood request for ${bloodGroup} (${units} units) at ${hospital}. Urgently needed! Check dashboard now.`,
          type: 'new_blood_request',
          data: {
            requestId: request._id.toString(),
            hospital,
            bloodGroup,
            units,
            urgency,
            requesterName: req.user?.username || 'A patient',
          },
        }));

        await Notification.insertMany(notifications);
        notifiedCount = matchingDonors.length;

        console.log(`Successfully notified ${notifiedCount} donors for request ${request._id}`);
      } else {
        console.log(`No available donors found for blood group: ${bloodGroup}`);
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

    const requests = await BloodRequest.find({
      bloodGroup: donorBloodGroup,
      status: 'pending',
      requester: { $ne: req.user._id },
    })
      .sort({ urgency: -1, createdAt: -1 })
      .populate('requester', 'username phone email location')
      .lean();

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
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

    request.status = 'accepted';
    request.acceptedBy = userId;
    await request.save();

    await Notification.create({
      user: request.requester,
      message: `Your blood request at ${request.hospital} has been accepted by ${req.user.username}!`,
      type: 'request_accepted',
      data: { requestId: request._id, donorId: userId },
    });

    await request.populate('requester', 'username phone email');
    await request.populate('acceptedBy', 'username phone email');

    res.status(200).json({
      success: true,
      message: 'Request accepted successfully',
      request,
    });
  } catch (err) {
    console.error('Accept blood request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};