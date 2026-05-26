/**
 * ============================================================
 * INTEGRATION TEST 5 — POST /api/blood/request
 * ============================================================
 * What this tests:
 *   The blood request creation flow — a logged-in receiver can
 *   submit a blood request that gets saved to MongoDB.
 *   Unauthenticated and invalid requests are rejected.
 *
 * Run: npm test (from backend folder)
 * ============================================================
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import User from '../../models/user.js';
import BloodRequest from '../../models/BloodRequest.js';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

process.env.JWT_SECRET = 'bloodconnect_test_secret';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

const makeToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

describe('POST /api/blood/request — Create Blood Request', () => {

  let receiverToken;

  // Create a verified receiver before each test
  beforeEach(async () => {
    const receiver = await User.create({
      username: 'Patient User',
      email: 'patient@test.com',
      bloodGroup: 'O+',
      role: 'receiver',
      isVerified: true,
    });
    receiverToken = makeToken(receiver._id);
  });

  const validRequest = {
    hospital: 'City Hospital Kathmandu',
    bloodGroup: 'O+',
    units: 2,
    urgency: 'emergency',   // valid enum: 'normal' | 'emergency'
    location: 'Kathmandu',
    contactPhone: '9800000001',
    note: 'Needed urgently for surgery',
  };

  test('Test 1: Valid blood request returns 201', async () => {
    const res = await request(app)
      .post('/api/blood/request')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send(validRequest);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('Test 2: Blood request is saved in the database', async () => {
    await request(app)
      .post('/api/blood/request')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send(validRequest);

    const saved = await BloodRequest.findOne({ hospital: 'City Hospital Kathmandu' });
    expect(saved).not.toBeNull();
    expect(saved.bloodGroup).toBe('O+');
  });

  test('Test 3: Response contains the created request details', async () => {
    const res = await request(app)
      .post('/api/blood/request')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send(validRequest);

    expect(res.body.request.hospital).toBe('City Hospital Kathmandu');
    expect(res.body.request.bloodGroup).toBe('O+');
    expect(res.body.request.units).toBe(2);
  });

  test('Test 4: Missing required fields returns 400', async () => {
    const res = await request(app)
      .post('/api/blood/request')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send({
        bloodGroup: 'O+',
        // hospital, units, contactPhone all missing
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 5: Unauthenticated request returns 401', async () => {
    const res = await request(app)
      .post('/api/blood/request')
      // No Authorization header
      .send(validRequest);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

});
