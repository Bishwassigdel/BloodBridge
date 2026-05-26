/**
 * ============================================================
 * INTEGRATION TEST 1 — POST /api/auth/signup
 * ============================================================
 * What this tests:
 *   The full signup flow — HTTP request → route → controller → MongoDB
 *   Tests that new users can register and that validation works.
 *
 * Run: npm test (from backend folder)
 * ============================================================
 */
import request from 'supertest';
import app from '../../app.js';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

// Set JWT secret for tests
process.env.JWT_SECRET = 'bloodconnect_test_secret';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('POST /api/auth/signup — User Registration', () => {

  const validUser = {
    username: 'Bishwas Sigdel',
    email: 'bishwas@test.com',
    password: 'Password123',
    phone: '9800000001',
    bloodGroup: 'A+',
    role: 'donor',
  };

  test('Test 1: Valid signup returns 201 and success message', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('Test 2: Response includes message about OTP/verification', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(validUser);

    // Should mention OTP or verification
    expect(res.body.message.toLowerCase()).toMatch(/otp|verif|code/);
  });

  test('Test 3: Duplicate email returns 400 error', async () => {
    // Register once
    await request(app).post('/api/auth/signup').send(validUser);
    // Try same email again
    const res = await request(app)
      .post('/api/auth/signup')
      .send(validUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 4: Missing required fields returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'incomplete@test.com' }); // no username, password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 5: Donor without blood group returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'NoBG',
        email: 'nobg@test.com',
        password: 'Password123',
        role: 'donor',
        // bloodGroup intentionally missing
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

});
