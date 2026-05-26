/**
 * donorHelpers.js
 * Pure helper functions extracted from authController.js
 * These have NO database imports — easy to unit test.
 */

import jwt from 'jsonwebtoken';

// ── Donation cooldown constant ─────────────────────────────────────────
export const DONATION_COOLDOWN_DAYS = 56;

/**
 * Checks if a donor's 56-day cooldown has expired.
 * Returns true if the donor should be reset to available.
 */
export const shouldResetAvailability = (user) => {
  if (!user || user.role !== 'donor') return false;
  if (user.isAvailable) return false;

  if (!user.lastDonation) return true; // no donation record → reset

  const msSinceDonation = Date.now() - new Date(user.lastDonation).getTime();
  const daysSinceDonation = msSinceDonation / (1000 * 60 * 60 * 24);

  return daysSinceDonation >= DONATION_COOLDOWN_DAYS;
};

/**
 * Generate a 6-digit OTP string.
 */
export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Generate a JWT token for a given user id.
 */
export const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in .env file');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Validates blood group string.
 */
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const isValidBloodGroup = (group) => {
  if (!group || typeof group !== 'string') return false;
  return VALID_BLOOD_GROUPS.includes(group.toUpperCase().trim());
};

/**
 * Formats a phone number — strips all non-digits, returns 10-digit string.
 */
export const formatPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? digits : null;
};
