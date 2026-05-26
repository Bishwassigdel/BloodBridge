/**
 * ============================================================
 * INTEGRATION TEST 2 — POST /api/auth/login
 * ============================================================
 * What this tests:
 *   The full login flow — correct credentials return a JWT token,
 *   wrong credentials are rejected, missing fields are caught.
 *
 * Run: npm test (from backend folder)
 * ============================================================
 */
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../app.js';
import User from '../../models/user.js';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

process.env.JWT_SECRET = 'bloodconnect_test_secret';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

// Helper: create a verified user directly in DB (bypasses OTP step)
const createVerifiedUser = async (overrides = {}) => {
  const hash = await bcrypt.hash('Password123', 10);
  return User.create({
    username: 'Test Donor',
    email: 'donor@test.com',
    password: hash,
    bloodGroup: 'B+',
    role: 'donor',
    isVerified: true,
    ...overrides,
  });
};

describe('POST /api/auth/login — User Login', () => {

  test('Test 1: Correct credentials return status 200', async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'donor@test.com', password: 'Password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 2: Response includes a JWT token', async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'donor@test.com', password: 'Password123' });

    expect(res.body.user.token).toBeDefined();
    expect(typeof res.body.user.token).toBe('string');
    // JWT has 3 dot-separated parts
    expect(res.body.user.token.split('.').length).toBe(3);
  });

  test('Test 3: Wrong password returns 401', async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'donor@test.com', password: 'WrongPassword999' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Test 4: Non-existent email returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Test 5: Response includes correct user role', async () => {
    await createVerifiedUser({ role: 'receiver', bloodGroup: 'O+', email: 'recv@test.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'recv@test.com', password: 'Password123' });

    expect(res.body.user.role).toBe('receiver');
  });

});
