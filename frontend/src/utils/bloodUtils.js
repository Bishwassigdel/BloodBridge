/**
 * bloodUtils.js
 * Pure utility functions for blood group logic used across the app.
 */

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/**
 * Returns true if the blood group is one of the 8 valid types.
 */
export const isValidBloodGroup = (group) => {
  if (!group || typeof group !== 'string') return false;
  return VALID_BLOOD_GROUPS.includes(group.toUpperCase().trim());
};

/**
 * Returns an array of compatible donor blood groups for a given receiver.
 * Based on standard blood transfusion compatibility rules.
 */
export const getCompatibleDonors = (receiverGroup) => {
  const compatibility = {
    'O+':  ['O+', 'O-'],
    'O-':  ['O-'],
    'A+':  ['A+', 'A-', 'O+', 'O-'],
    'A-':  ['A-', 'O-'],
    'B+':  ['B+', 'B-', 'O+', 'O-'],
    'B-':  ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    'AB-': ['A-', 'B-', 'O-', 'AB-'],
  };
  return compatibility[receiverGroup] || [];
};

/**
 * Returns a CSS color class (Tailwind) for a blood group badge.
 */
export const getBloodGroupColor = (group) => {
  const colors = {
    'A+': 'bg-red-100 text-red-700',
    'A-': 'bg-red-200 text-red-800',
    'B+': 'bg-blue-100 text-blue-700',
    'B-': 'bg-blue-200 text-blue-800',
    'O+': 'bg-green-100 text-green-700',
    'O-': 'bg-green-200 text-green-800',
    'AB+': 'bg-purple-100 text-purple-700',
    'AB-': 'bg-purple-200 text-purple-800',
  };
  return colors[group] || 'bg-gray-100 text-gray-600';
};

/**
 * Formats urgency level to a human-readable label.
 */
export const formatUrgency = (urgency) => {
  const labels = {
    normal: 'Normal',
    urgent: 'Urgent',
    critical: '🚨 Critical',
  };
  return labels[urgency] || 'Normal';
};
