import BloodTransfer from '../models/BloodTransfer.js';
import User from '../models/user.js';
import Inventory from '../models/Inventory.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ── Shared email transporter ─────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Create Blood Transfer Request
export const createBloodTransfer = async (req, res) => {
  const { toHospitalEmail, bloodGroup, units, reason } = req.body;
  const fromHospitalId = req.user._id;
  const fromHospitalName = req.user.hospitalName || req.user.username;

  if (!toHospitalEmail || !bloodGroup || !units || units <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Hospital email, blood group, and units are required',
    });
  }

  try {
    // Check if receiving email is a hospital account
    const toHospital = await User.findOne({
      email: toHospitalEmail.toLowerCase(),
      role: 'hospital',
    });

    // Only allow transfers to hospital accounts
    if (!toHospital) {
      const checkUser = await User.findOne({
        email: toHospitalEmail.toLowerCase(),
      });

      if (checkUser && checkUser.role !== 'hospital') {
        return res.status(400).json({
          success: false,
          message: `This email (${toHospitalEmail}) is registered as a ${checkUser.role}, not a hospital. Blood transfers can only be made hospital-to-hospital.`,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `No hospital found with email: ${toHospitalEmail}. Make sure the receiving hospital's email is correct.`,
        });
      }
    }

    // Prevent self-transfer
    if (toHospital._id.toString() === fromHospitalId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot transfer blood to your own hospital.',
      });
    }

    // Create transfer record
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const transfer = await BloodTransfer.create({
      fromHospitalId,
      fromHospitalName,
      toHospitalEmail: toHospitalEmail.toLowerCase(),
      toHospitalId: toHospital._id,
      toHospitalName: toHospital.hospitalName,
      bloodGroup,
      units,
      reason: reason || 'Blood inventory transfer',
      confirmationToken,
      tokenExpires,
    });

    console.log('Blood transfer request created:', transfer._id);

    // Send email to receiving hospital
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/blood-transfer?token=${confirmationToken}`;

    try {
      await createTransporter().sendMail({
        from: `"BloodBridge" <${process.env.EMAIL_USER}>`,
        to: toHospitalEmail,
        subject: `BloodBridge – Blood Transfer Request from ${fromHospitalName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #f3f3f3;border-radius:12px;">
            <h2 style="color:#dc2626;text-align:center;">🩸 Blood Transfer Request</h2>
            <p>Hi,</p>
            <p><strong>${fromHospitalName}</strong> has sent you a blood transfer request:</p>

            <div style="background:#f9fafb;padding:20px;border-radius:10px;margin:24px 0;">
              <p style="margin:8px 0;"><strong>Blood Group:</strong> ${bloodGroup}</p>
              <p style="margin:8px 0;"><strong>Units:</strong> ${units}</p>
              <p style="margin:8px 0;"><strong>Reason:</strong> ${reason || 'Blood inventory transfer'}</p>
              <p style="margin:8px 0;"><strong>From:</strong> ${fromHospitalName}</p>
            </div>

            <p style="color:#666;font-size:14px;margin:24px 0;">
              To accept or reject this transfer request, click the button below:
            </p>

            <div style="text-align:center;margin:24px 0;">
              <a href="${confirmationUrl}" style="display:inline-block;padding:14px 32px;background:#dc2626;color:white;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px;">
                View Transfer Request
              </a>
            </div>

            <p style="color:#666;font-size:13px;">
              Or copy this link:<br>
              <span style="color:#dc2626;word-break:break-all;font-size:12px;">${confirmationUrl}</span>
            </p>

            <p style="color:#666;font-size:13px;margin-top:24px;">This link expires in 7 days.</p>

            <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">
            <p style="color:#999;font-size:12px;text-align:center;">BloodBridge Team – Saving lives, one drop at a time.</p>
          </div>
        `,
      });
      console.log('Transfer email sent to:', toHospitalEmail);
    } catch (emailErr) {
      console.error('Failed to send transfer email:', emailErr.message);
      console.log(`[DEV] Transfer confirmation URL: ${confirmationUrl}`);
    }

    res.status(201).json({
      success: true,
      message: `Transfer request sent to ${toHospitalEmail}`,
      transfer: {
        _id: transfer._id,
        bloodGroup: transfer.bloodGroup,
        units: transfer.units,
        toHospitalEmail: transfer.toHospitalEmail,
        status: transfer.status,
        createdAt: transfer.createdAt,
      },
    });
  } catch (error) {
    console.error('Create blood transfer error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer request',
      errorDetail: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Accept Blood Transfer
export const acceptBloodTransfer = async (req, res) => {
  const { token } = req.body;
  const hospitalId = req.user._id;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Confirmation token is required',
    });
  }

  try {
    // Find and validate transfer
    const transfer = await BloodTransfer.findOne({
      confirmationToken: token,
      tokenExpires: { $gt: Date.now() },
      status: 'pending',
    });

    if (!transfer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired transfer token',
      });
    }

    // Verify this hospital is receiving the blood
    const receivingHospital = await User.findOne({
      email: transfer.toHospitalEmail.toLowerCase(),
      role: 'hospital',
    });

    if (!receivingHospital || receivingHospital._id.toString() !== hospitalId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: This transfer is not for your hospital',
      });
    }

    // Accept transfer
    transfer.status = 'accepted';
    transfer.acceptedAt = new Date();
    transfer.toHospitalId = hospitalId;
    transfer.toHospitalName = receivingHospital.hospitalName;
    await transfer.save();

    // Update inventory for both hospitals
    // Decrease from sending hospital
    const fromInventory = await Inventory.findOne({
      hospitalId: transfer.fromHospitalId,
      bloodGroup: transfer.bloodGroup,
    });

    if (fromInventory && fromInventory.units >= transfer.units) {
      fromInventory.units -= transfer.units;
      await fromInventory.save();
    }

    // Increase for receiving hospital
    let toInventory = await Inventory.findOne({
      hospitalId: hospitalId,
      bloodGroup: transfer.bloodGroup,
    });

    if (!toInventory) {
      toInventory = await Inventory.create({
        hospitalId,
        bloodGroup: transfer.bloodGroup,
        units: transfer.units,
      });
    } else {
      toInventory.units += transfer.units;
      await toInventory.save();
    }

    console.log('Blood transfer accepted:', transfer._id);

    // Send confirmation email to sending hospital
    try {
      const sendingHospital = await User.findById(transfer.fromHospitalId);
      if (sendingHospital?.email) {
        await createTransporter().sendMail({
          from: `"BloodBridge" <${process.env.EMAIL_USER}>`,
          to: sendingHospital.email,
          subject: `BloodBridge – Transfer Accepted: ${transfer.bloodGroup}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #f3f3f3;border-radius:12px;">
              <h2 style="color:#10b981;text-align:center;">✓ Transfer Accepted</h2>
              <p>Hi ${sendingHospital.hospitalName || 'Hospital'},</p>
              <p><strong>${receivingHospital.hospitalName || receivingHospital.username}</strong> has accepted your blood transfer request.</p>

              <div style="background:#f0fdf4;padding:20px;border-radius:10px;margin:24px 0;border-left:4px solid #10b981;">
                <p style="margin:8px 0;"><strong>Blood Group:</strong> ${transfer.bloodGroup}</p>
                <p style="margin:8px 0;"><strong>Units Transferred:</strong> ${transfer.units}</p>
                <p style="margin:8px 0;"><strong>Recipient Hospital:</strong> ${receivingHospital.hospitalName || receivingHospital.username}</p>
              </div>

              <p style="color:#666;font-size:14px;">The blood units have been transferred to the recipient hospital's inventory.</p>

              <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">
              <p style="color:#999;font-size:12px;text-align:center;">BloodBridge Team</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send acceptance email:', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Blood transfer accepted successfully',
      transfer: {
        _id: transfer._id,
        bloodGroup: transfer.bloodGroup,
        units: transfer.units,
        status: 'accepted',
        fromHospital: transfer.fromHospitalName,
        toHospital: receivingHospital.hospitalName,
      },
    });
  } catch (error) {
    console.error('Accept blood transfer error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to accept transfer',
    });
  }
};

// Reject Blood Transfer
export const rejectBloodTransfer = async (req, res) => {
  const { token, reason } = req.body;
  const hospitalId = req.user._id;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Confirmation token is required',
    });
  }

  try {
    const transfer = await BloodTransfer.findOne({
      confirmationToken: token,
      tokenExpires: { $gt: Date.now() },
      status: 'pending',
    });

    if (!transfer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired transfer token',
      });
    }

    // Verify authorization
    const receivingHospital = await User.findOne({
      email: transfer.toHospitalEmail.toLowerCase(),
      role: 'hospital',
    });

    if (!receivingHospital || receivingHospital._id.toString() !== hospitalId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Reject transfer
    transfer.status = 'rejected';
    transfer.rejectedAt = new Date();
    transfer.rejectionReason = reason || 'No reason provided';
    await transfer.save();

    console.log('Blood transfer rejected:', transfer._id);

    res.json({
      success: true,
      message: 'Transfer request rejected',
    });
  } catch (error) {
    console.error('Reject blood transfer error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to reject transfer' });
  }
};

// Get Transfer History
export const getTransferHistory = async (req, res) => {
  const hospitalId = req.user._id;

  try {
    const transfers = await BloodTransfer.find({
      $or: [{ fromHospitalId: hospitalId }, { toHospitalId: hospitalId }],
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      transfers: transfers.map(t => ({
        _id: t._id,
        fromHospital: t.fromHospitalName,
        toHospital: t.toHospitalName || t.toHospitalEmail,
        bloodGroup: t.bloodGroup,
        units: t.units,
        status: t.status,
        reason: t.reason,
        createdAt: t.createdAt,
        acceptedAt: t.acceptedAt,
      })),
    });
  } catch (error) {
    console.error('Get transfer history error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch transfer history' });
  }
};
