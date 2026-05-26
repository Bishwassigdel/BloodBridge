/**
 * ============================================================
 *  UNIT TESTS — bloodUtils.js (Frontend Utility Functions)
 *  Run: npm test (from frontend folder)
 * ============================================================
 */

import { describe, test, expect } from 'vitest';
import {
  isValidBloodGroup,
  getCompatibleDonors,
  getBloodGroupColor,
  formatUrgency,
} from '../../utils/bloodUtils.js';

// ─────────────────────────────────────────────────────────────
// TEST GROUP 1 — isValidBloodGroup
// ─────────────────────────────────────────────────────────────
describe('isValidBloodGroup — validate blood group input', () => {

  test('Test 1: All 8 valid blood groups return true', () => {
    const groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    groups.forEach(group => {
      expect(isValidBloodGroup(group)).toBe(true);
    });
  });

  test('Test 2: Invalid blood groups return false', () => {
    expect(isValidBloodGroup('X+')).toBe(false);
    expect(isValidBloodGroup('C+')).toBe(false);
    expect(isValidBloodGroup('AB++')).toBe(false);
  });

  test('Test 3: Empty string returns false', () => {
    expect(isValidBloodGroup('')).toBe(false);
  });

  test('Test 4: null and undefined return false (no crash)', () => {
    expect(isValidBloodGroup(null)).toBe(false);
    expect(isValidBloodGroup(undefined)).toBe(false);
  });

  test('Test 5: Lowercase input is accepted (case-insensitive)', () => {
    expect(isValidBloodGroup('a+')).toBe(true);
    expect(isValidBloodGroup('o-')).toBe(true);
    expect(isValidBloodGroup('ab+')).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────
// TEST GROUP 2 — getCompatibleDonors
// ─────────────────────────────────────────────────────────────
describe('getCompatibleDonors — blood compatibility rules', () => {

  test('Test 1: O- can only receive from O- (most restrictive)', () => {
    const donors = getCompatibleDonors('O-');
    expect(donors).toEqual(['O-']);
  });

  test('Test 2: AB+ can receive from all 8 blood groups (universal receiver)', () => {
    const donors = getCompatibleDonors('AB+');
    expect(donors.length).toBe(8);
  });

  test('Test 3: A+ can receive from A+, A-, O+, O-', () => {
    const donors = getCompatibleDonors('A+');
    expect(donors).toContain('A+');
    expect(donors).toContain('A-');
    expect(donors).toContain('O+');
    expect(donors).toContain('O-');
    expect(donors).not.toContain('B+');
  });

  test('Test 4: O+ cannot receive from A+', () => {
    const donors = getCompatibleDonors('O+');
    expect(donors).not.toContain('A+');
    expect(donors).not.toContain('B+');
    expect(donors).not.toContain('AB+');
  });

  test('Test 5: Unknown blood group returns empty array (safe fallback)', () => {
    const donors = getCompatibleDonors('X+');
    expect(donors).toEqual([]);
  });

});

// ─────────────────────────────────────────────────────────────
// TEST GROUP 3 — getBloodGroupColor
// ─────────────────────────────────────────────────────────────
describe('getBloodGroupColor — Tailwind CSS class mapper', () => {

  test('Test 1: A+ returns a red color class', () => {
    const color = getBloodGroupColor('A+');
    expect(color).toContain('red');
  });

  test('Test 2: B+ returns a blue color class', () => {
    const color = getBloodGroupColor('B+');
    expect(color).toContain('blue');
  });

  test('Test 3: O+ returns a green color class', () => {
    const color = getBloodGroupColor('O+');
    expect(color).toContain('green');
  });

  test('Test 4: AB+ returns a purple color class', () => {
    const color = getBloodGroupColor('AB+');
    expect(color).toContain('purple');
  });

  test('Test 5: Unknown group returns gray fallback (no crash)', () => {
    const color = getBloodGroupColor('UNKNOWN');
    expect(color).toContain('gray');
  });

});

// ─────────────────────────────────────────────────────────────
// TEST GROUP 4 — formatUrgency
// ─────────────────────────────────────────────────────────────
describe('formatUrgency — urgency level formatter', () => {

  test('Test 1: "normal" returns "Normal"', () => {
    expect(formatUrgency('normal')).toBe('Normal');
  });

  test('Test 2: "urgent" returns "Urgent"', () => {
    expect(formatUrgency('urgent')).toBe('Urgent');
  });

  test('Test 3: "critical" returns label with emoji', () => {
    expect(formatUrgency('critical')).toContain('Critical');
  });

  test('Test 4: Unknown value returns "Normal" as safe fallback', () => {
    expect(formatUrgency('unknown_level')).toBe('Normal');
  });

  test('Test 5: Empty string returns "Normal" (no crash)', () => {
    expect(formatUrgency('')).toBe('Normal');
  });

});
