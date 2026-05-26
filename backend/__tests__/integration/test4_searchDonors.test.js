/**
 * ============================================================
 * INTEGRATION TEST 4 — GET /api/blood/search-donors
 * ============================================================
 * What this tests:
 *   The donor search endpoint — returns available donors matching
 *   the given blood group. Unavailable donors are excluded.
 *
 * Run: npm test (from backend folder)
 * ============================================================
 */
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.js';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

process.env.JWT_SECRET = 'bloodconnect_test_secret';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('GET /api/blood/search-donors — Search Donors by Blood Group', () => {

  test('Test 1: Returns matching available donors for a blood group', async () => {
    // Create an available A+ donor
    await User.create({
      username: 'A Plus Donor',
      email: 'aplus@test.com',
      bloodGroup: 'A+',
      role: 'donor',
      isAvailable: true,
      isVerified: true,
    });

    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'A+' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.donors.length).toBeGreaterThan(0);
  });

  test('Test 2: Returned donors all have the correct blood group', async () => {
    await User.create({
      username: 'O Neg Donor',
      email: 'oneg@test.com',
      bloodGroup: 'O-',
      role: 'donor',
      isAvailable: true,
      isVerified: true,
    });

    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'O-' });

    // Every donor in results must match the searched blood group
    res.body.donors.forEach(donor => {
      expect(donor.bloodGroup).toBe('O-');
    });
  });

  test('Test 3: Only available donors returned when available=true filter is used', async () => {
    // Create one available and one unavailable donor
    await User.create({
      username: 'Available Donor',
      email: 'avail@test.com',
      bloodGroup: 'B+',
      role: 'donor',
      isAvailable: true,
      isVerified: true,
    });
    await User.create({
      username: 'Busy Donor',
      email: 'busy@test.com',
      bloodGroup: 'B+',
      role: 'donor',
      isAvailable: false,
      isVerified: true,
    });

    // Pass available=true to filter — only available donors returned
    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'B+', available: 'true' });

    expect(res.statusCode).toBe(200);
    // All returned donors must be available
    res.body.donors.forEach(donor => {
      expect(donor.isAvailable).toBe(true);
    });
    // Should not include the unavailable donor
    const names = res.body.donors.map(d => d.username);
    expect(names).not.toContain('Busy Donor');
  });

  test('Test 4: Returns empty array when no donors match', async () => {
    // No AB- donors in the DB
    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'AB-' });

    expect(res.statusCode).toBe(200);
    expect(res.body.donors).toHaveLength(0);
  });

  test('Test 5: Password field is never exposed in donor results', async () => {
    await User.create({
      username: 'Private Donor',
      email: 'priv@test.com',
      bloodGroup: 'A+',
      role: 'donor',
      isAvailable: true,
      isVerified: true,
    });

    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'A+' });

    // Sensitive field must never leak
    res.body.donors.forEach(donor => {
      expect(donor.password).toBeUndefined();
    });
  });

});
