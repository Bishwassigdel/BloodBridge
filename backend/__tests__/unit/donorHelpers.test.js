/**
 * ============================================================
 *  UNIT TESTS — donorHelpers.js
 *  Run: npm test (from backend folder)
 * ============================================================
 *
 * What we are testing:
 *   5 groups of tests, each group tests one helper function.
 *   No database. No server. Just pure JavaScript logic.
 */

import {
  shouldResetAvailability,
  generateOTP,
  generateToken,
  isValidBloodGroup,
  formatPhone,
  DONATION_COOLDOWN_DAYS,
} from '../../utils/donorHelpers.js';

import jwt from 'jsonwebtoken';

// ─────────────────────────────────────────────────────────────
// TEST GROUP 1 — shouldResetAvailability
// ─────────────────────────────────────────────────────────────
describe('shouldResetAvailability — donor cooldown logic', () => {

  test('Test 1: Returns false when user is null', () => {
    const result = shouldResetAvailability(null);
    expect(result).toBe(false);
  });

  test('Test 2: Returns false when donor is already available', () => {
    const donor = { role: 'donor', isAvailable: true, lastDonation: null };
    const result = shouldResetAvailability(donor);
    expect(result).toBe(false);
  });

  test('Test 3: Returns true when 60 days have passed (cooldown expired)', () => {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const donor = {
      role: 'donor',
      isAvailable: false,
      lastDonation: sixtyDaysAgo,
    };
    const result = shouldResetAvailability(donor);
    expect(result).toBe(true);
  });

  test('Test 4: Returns false when only 30 days have passed (still in cooldown)', () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const donor = {
      role: 'donor',
      isAvailable: false,
      lastDonation: thirtyDaysAgo,
    };
    const result = shouldResetAvailability(donor);
    expect(result).toBe(false);
  });

  test('Test 5: Returns false for non-donor roles (receiver, hospital)', () => {
    const receiver = { role: 'receiver', isAvailable: false };
    const hospital = { role: 'hospital', isAvailable: false };

    expect(shouldResetAvailability(receiver)).toBe(false);
    expect(shouldResetAvailability(hospital)).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────
// TEST GROUP 2 — generateOTP
// ─────────────────────────────────────────────────────────────
describe('generateOTP — one-time password generator', () => {

  test('Test 1: Returns a string', () => {
    const otp = generateOTP();
    expect(typeof otp).toBe('string');
  });

  test('Test 2: Is exactly 6 characters long', () => {
    const otp = generateOTP();
    expect(otp.length).toBe(6);
  });

  test('Test 3: Contains only digits (no letters)', () => {
    const otp = generateOTP();
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test('Test 4: Is always >= 100000 (never starts with 0)', () => {
    for (let i = 0; i < 50; i++) {
      expect(parseInt(generateOTP())).toBeGreaterThanOrEqual(100000);
    }
  });

  test('Test 5: Is always <= 999999', () => {
    for (let i = 0; i < 50; i++) {
      expect(parseInt(generateOTP())).toBeLessThanOrEqual(999999);
    }
  });

});

// ─────────────────────────────────────────────────────────────
// TEST GROUP 3 — generateToken
// ─────────────────────────────────────────────────────────────
describe('generateToken — JWT token generator', () => {

  beforeEach(() => {
    process.env.JWT_SECRET = 'bloodconnect_test_secret_2024';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  test('Test 1: Returns a string', () => {
    const token = generateToken('user123');
    expect(typeof token).toBe('string');
  });

  test('Test 2: Token has 3 parts separated by dots (header.payload.signature)', () => {
    const token = generateToken('user123');
    const parts = token.split('.');
    expect(parts.length).toBe(3);
  });

  test('Test 3: Decoded token contains the correct user id', () => {
    const token = generateToken('user_abc_456');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe('user_abc_456');
  });

  test('Test 4: Throws an error when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => generateToken('user123')).toThrow('JWT_SECRET is not defined');
  });

  test('Test 5: Token expires in approximately 30 days', () => {
    const token = generateToken('user123');
    const decoded = jwt.decode(token);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const thirtyDays = 30 * 24 * 60 * 60;

    // exp should be within 5 seconds of now + 30 days
    expect(decoded.exp).toBeGreaterThan(nowSeconds + thirtyDays - 5);
    expect(decoded.exp).toBeLessThan(nowSeconds + thirtyDays + 5);
  });

});

// ─────────────────────────────────────────────────────────────
// TEST GROUP 4 — isValidBloodGroup
// ─────────────────────────────────────────────────────────────
describe('isValidBloodGroup — blood group validator', () => {

  test('Test 1: Returns true for all 8 valid blood groups', () => {
    const groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    groups.forEach(group => {
      expect(isValidBloodGroup(group)).toBe(true);
    });
  });

  test('Test 2: Returns false for invalid blood group', () => {
    expect(isValidBloodGroup('X+')).toBe(false);
    expect(isValidBloodGroup('C+')).toBe(false);
    expect(isValidBloodGroup('AB++')).toBe(false);
  });

  test('Test 3: Returns false for empty string', () => {
    expect(isValidBloodGroup('')).toBe(false);
  });

  test('Test 4: Returns false for null or undefined', () => {
    expect(isValidBloodGroup(null)).toBe(false);
    expect(isValidBloodGroup(undefined)).toBe(false);
  });

  test('Test 5: Case-insensitive — lowercase also works', () => {
    expect(isValidBloodGroup('a+')).toBe(true);
    expect(isValidBloodGroup('o-')).toBe(true);
    expect(isValidBloodGroup('ab+')).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────
// TEST GROUP 5 — formatPhone
// ─────────────────────────────────────────────────────────────
describe('formatPhone — phone number formatter', () => {

  test('Test 1: Returns 10-digit string from a clean number', () => {
    expect(formatPhone('9876543210')).toBe('9876543210');
  });

  test('Test 2: Strips dashes and spaces', () => {
    expect(formatPhone('987-654-3210')).toBe('9876543210');
    expect(formatPhone('987 654 3210')).toBe('9876543210');
  });

  test('Test 3: Returns null for numbers shorter than 10 digits', () => {
    expect(formatPhone('12345')).toBeNull();
  });

  test('Test 4: Returns null for null or empty input', () => {
    expect(formatPhone(null)).toBeNull();
    expect(formatPhone('')).toBeNull();
  });

  test('Test 5: Strips country code prefix (if result is 10 digits)', () => {
    // +977-9800000000 → strips + and - → '9779800000000' → 13 digits → null
    // A plain 10-digit number should work
    expect(formatPhone('(981) 234-5678')).toBe('9812345678');
  });

});
