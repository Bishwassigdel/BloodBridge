/**
 * ============================================================
 * INTEGRATION TEST 3 — GET /api/auth/me (Protected Route)
 * ============================================================
 * What this tests:
 *   The auth middleware — only logged-in users with a valid JWT
 *   can access protected routes. Invalid tokens are rejected.
 *
 * Run: npm test (from backend folder)
 * ============================================================
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import User from '../../models/user.js';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

process.env.JWT_SECRET = 'bloodconnect_test_secret';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

// Helper: generate a valid JWT for a user
const makeToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

describe('GET /api/auth/me — Get Current User Profile', () => {

  test('Test 1: Valid token returns 200 and user data', async () => {
    const user = await User.create({
      username: 'Bishwas',
      email: 'me@test.com',
      bloodGroup: 'A+',
      role: 'donor',
      isVerified: true,
    });
    const token = makeToken(user._id);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 2: Response contains correct user email', async () => {
    const user = await User.create({
      username: 'Bishwas',
      email: 'me@test.com',
      bloodGroup: 'A+',
      role: 'donor',
      isVerified: true,
    });
    const token = makeToken(user._id);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.user.email).toBe('me@test.com');
  });

  test('Test 3: No token returns 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/auth/me');
    // No Authorization header

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Test 4: Fake/invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.a.fake.token');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Test 5: Password field is NOT included in the response', async () => {
    const user = await User.create({
      username: 'Safe User',
      email: 'safe@test.com',
      bloodGroup: 'B+',
      role: 'receiver',
      isVerified: true,
    });
    const token = makeToken(user._id);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    // Password must never be exposed in API response
    expect(res.body.user.password).toBeUndefined();
  });

});
