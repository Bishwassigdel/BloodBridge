import Donation from '../models/Donation.js';
import User from '../models/user.js';

export const recordDonation = async (req, res) => {
  try {
    const { hospital, bloodGroup, units, notes } = req.body;

    const donation = await Donation.create({
      donor: req.user._id,
      hospital,
      bloodGroup,
      units: Number(units),
      notes,
    });

    // Update donor availability
    await User.findByIdAndUpdate(req.user._id, {
      lastDonation: new Date(),
      isAvailable: false,
    });

    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully! Thank you ❤️',
      donation,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDonationHistory = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .sort({ donatedAt: -1 })
      .lean();
    res.json({ success: true, donations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};