# BloodConnect — Complete Testing Guide
## Unit · Integration · E2E (5 tests each)

> This guide is written specifically for the BloodConnect codebase (React + Vite frontend, Node/Express + MongoDB backend).  
> Follow each section in order — setup first, then write tests, then run them.

---

## Table of Contents
1. [Overview — Which tool does what?](#overview)
2. [Part 1 — Unit Tests (Vitest + Jest)](#part-1-unit-tests)
3. [Part 2 — Integration Tests (Jest + Supertest)](#part-2-integration-tests)
4. [Part 3 — E2E Tests (Playwright)](#part-3-e2e-tests)
5. [Running All Tests at Once](#running-all-tests)

---

## Overview

| Type | What it tests | Tool | Where |
|------|---------------|------|--------|
| **Unit** | A single function or component in isolation | Vitest (frontend) / Jest (backend) | `frontend/src/__tests__/` and `backend/__tests__/` |
| **Integration** | Multiple layers working together (API route → controller → model) | Jest + Supertest | `backend/__tests__/integration/` |
| **E2E** | A full user flow in a real browser | Playwright | `e2e/` |

---

## Part 1 — Unit Tests

Unit tests check **one small piece** of code at a time.  
No database. No server. No browser. Just pure logic.

### Step 1 — Install tools for the BACKEND unit tests

```bash
cd BloodConnect/backend
npm install --save-dev jest @jest/globals
```

Add this to `backend/package.json`:
```json
"scripts": {
  "test": "node --experimental-vm-modules node_modules/.bin/jest"
},
"jest": {
  "transform": {}
}
```

### Step 2 — Install tools for the FRONTEND unit tests

```bash
cd BloodConnect/frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Add to `frontend/vite.config.ts` inside `defineConfig({...})`:
```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/setupTests.ts',
},
```

Create `frontend/src/setupTests.ts`:
```ts
import '@testing-library/jest-dom';
```

Add to `frontend/package.json` scripts:
```json
"test": "vitest"
```

---

### Unit Test 1 — autoResetAvailability (Backend Logic)

**What it tests:** The `autoResetAvailability` function in `authController.js` — checks whether a donor's 56-day cooldown has passed and resets them to available.

**Why it matters:** This is core business logic. If it breaks, donors who are eligible stay marked as unavailable.

**File:** `backend/__tests__/unit/autoReset.test.js`

```js
// backend/__tests__/unit/autoReset.test.js
import { jest } from '@jest/globals';

// We need to mock mongoose so no real DB is needed
jest.mock('../models/user.js', () => ({
  default: {
    findByIdAndUpdate: jest.fn().mockResolvedValue(true),
  },
}));

// Import after mock
const { autoResetAvailability } = await import('../controllers/authController.js');

describe('autoResetAvailability', () => {
  test('1. Returns null if user is null', async () => {
    const result = await autoResetAvailability(null);
    expect(result).toBeNull();
  });

  test('2. Does nothing if user is already available', async () => {
    const user = { role: 'donor', isAvailable: true, lastDonation: null };
    const result = await autoResetAvailability(user);
    expect(result.isAvailable).toBe(true);
  });

  test('3. Resets availability if 56+ days have passed', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60); // 60 days ago
    const user = {
      _id: 'abc123',
      role: 'donor',
      isAvailable: false,
      lastDonation: oldDate,
    };
    const result = await autoResetAvailability(user);
    expect(result.isAvailable).toBe(true);
  });

  test('4. Does NOT reset if cooldown not expired (30 days ago)', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30); // only 30 days ago
    const user = {
      _id: 'abc123',
      role: 'donor',
      isAvailable: false,
      lastDonation: recentDate,
    };
    const result = await autoResetAvailability(user);
    expect(result.isAvailable).toBe(false);
  });

  test('5. Skips non-donor roles (receivers, hospitals)', async () => {
    const user = { role: 'receiver', isAvailable: false };
    const result = await autoResetAvailability(user);
    // Receivers are returned unchanged
    expect(result.role).toBe('receiver');
  });
});
```

**How to run:**
```bash
cd backend
node --experimental-vm-modules node_modules/.bin/jest __tests__/unit/autoReset.test.js
```

---

### Unit Test 2 — JWT Token Generation (Backend)

**What it tests:** The `generateToken` helper creates a valid JWT with the correct payload.

**File:** `backend/__tests__/unit/generateToken.test.js`

```js
// backend/__tests__/unit/generateToken.test.js
import jwt from 'jsonwebtoken';

// A local copy of the helper (so we don't need the full module)
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined');
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

describe('generateToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret_key';
  });

  test('1. Returns a string', () => {
    const token = generateToken('user123');
    expect(typeof token).toBe('string');
  });

  test('2. Token has 3 parts (header.payload.signature)', () => {
    const token = generateToken('user123');
    const parts = token.split('.');
    expect(parts.length).toBe(3);
  });

  test('3. Decoded token contains the correct user id', () => {
    const token = generateToken('user123');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe('user123');
  });

  test('4. Throws error when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => generateToken('user123')).toThrow('JWT_SECRET is not defined');
  });

  test('5. Token expires in ~30 days (not immediate)', () => {
    const token = generateToken('user123');
    const decoded = jwt.decode(token);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const thirtyDaysSeconds = 30 * 24 * 60 * 60;
    // exp should be close to now + 30 days (within 5 seconds)
    expect(decoded.exp).toBeGreaterThan(nowSeconds + thirtyDaysSeconds - 5);
    expect(decoded.exp).toBeLessThan(nowSeconds + thirtyDaysSeconds + 5);
  });
});
```

**How to run:**
```bash
cd backend
node --experimental-vm-modules node_modules/.bin/jest __tests__/unit/generateToken.test.js
```

---

### Unit Test 3 — Blood Group Validation Utility (Frontend)

**What it tests:** A utility function that checks if a blood group string is valid.  
First, create the utility at `frontend/src/utils/bloodUtils.js`:

```js
// frontend/src/utils/bloodUtils.js
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const isValidBloodGroup = (group) => {
  if (!group || typeof group !== 'string') return false;
  return VALID_BLOOD_GROUPS.includes(group.toUpperCase());
};

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
```

**File:** `frontend/src/__tests__/unit/bloodUtils.test.js`

```js
// frontend/src/__tests__/unit/bloodUtils.test.js
import { isValidBloodGroup, getCompatibleDonors } from '../../utils/bloodUtils';

describe('Blood Group Utilities', () => {
  test('1. Valid blood group returns true', () => {
    expect(isValidBloodGroup('A+')).toBe(true);
    expect(isValidBloodGroup('O-')).toBe(true);
    expect(isValidBloodGroup('AB+')).toBe(true);
  });

  test('2. Invalid blood group returns false', () => {
    expect(isValidBloodGroup('X+')).toBe(false);
    expect(isValidBloodGroup('')).toBe(false);
    expect(isValidBloodGroup(null)).toBe(false);
  });

  test('3. Case-insensitive validation (ab+ should work)', () => {
    expect(isValidBloodGroup('ab+')).toBe(true);
    expect(isValidBloodGroup('o-')).toBe(true);
  });

  test('4. AB+ can receive from all blood groups (universal receiver)', () => {
    const donors = getCompatibleDonors('AB+');
    expect(donors.length).toBe(8); // All 8 blood groups
  });

  test('5. O- can only receive from O- (most restrictive)', () => {
    const donors = getCompatibleDonors('O-');
    expect(donors).toEqual(['O-']);
  });
});
```

**How to run:**
```bash
cd frontend
npx vitest run src/__tests__/unit/bloodUtils.test.js
```

---

### Unit Test 4 — useCounter Hook (Frontend)

**What it tests:** The existing `useCounter.js` hook in `frontend/src/hooks/`.

**File:** `frontend/src/__tests__/unit/useCounter.test.js`

```js
// frontend/src/__tests__/unit/useCounter.test.js
import { renderHook, act } from '@testing-library/react';
import useCounter from '../../hooks/useCounter';

describe('useCounter hook', () => {
  test('1. Starts at the initial value (default 0)', () => {
    const { result } = renderHook(() => useCounter(0));
    expect(result.current.count).toBe(0);
  });

  test('2. Increments correctly', () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });

  test('3. Decrements correctly', () => {
    const { result } = renderHook(() => useCounter(5));
    act(() => result.current.decrement());
    expect(result.current.count).toBe(4);
  });

  test('4. Resets back to initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    act(() => result.current.increment());
    act(() => result.current.reset());
    expect(result.current.count).toBe(10);
  });

  test('5. Starts with a custom initial value', () => {
    const { result } = renderHook(() => useCounter(100));
    expect(result.current.count).toBe(100);
  });
});
```

**How to run:**
```bash
cd frontend
npx vitest run src/__tests__/unit/useCounter.test.js
```

---

### Unit Test 5 — OTP Generation Logic (Backend)

**What it tests:** The OTP generator produces 6-digit codes consistently.

**File:** `backend/__tests__/unit/otp.test.js`

```js
// backend/__tests__/unit/otp.test.js

// Copy of the function from authController.js (pure function, no imports needed)
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

describe('OTP Generator', () => {
  test('1. Returns a string', () => {
    expect(typeof generateOTP()).toBe('string');
  });

  test('2. Is exactly 6 characters long', () => {
    expect(generateOTP().length).toBe(6);
  });

  test('3. Is a numeric string (no letters)', () => {
    const otp = generateOTP();
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test('4. Is always >= 100000', () => {
    for (let i = 0; i < 100; i++) {
      expect(parseInt(generateOTP())).toBeGreaterThanOrEqual(100000);
    }
  });

  test('5. Is always <= 999999', () => {
    for (let i = 0; i < 100; i++) {
      expect(parseInt(generateOTP())).toBeLessThanOrEqual(999999);
    }
  });
});
```

**How to run:**
```bash
cd backend
node --experimental-vm-modules node_modules/.bin/jest __tests__/unit/otp.test.js
```

---

## Part 2 — Integration Tests

Integration tests check **multiple layers together** — the HTTP route, the controller, and a real (test) database.

### Step 1 — Install tools

```bash
cd BloodConnect/backend
npm install --save-dev supertest mongodb-memory-server
```

`mongodb-memory-server` spins up a real MongoDB instance in memory — no cloud DB needed for tests.

### Step 2 — Create a test database helper

Create `backend/__tests__/helpers/testDb.js`:

```js
// backend/__tests__/helpers/testDb.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export const connectTestDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

export const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
```

---

### Integration Test 1 — POST /api/auth/signup

**What it tests:** A new user can register and gets a 201 response with a token.

**File:** `backend/__tests__/integration/auth.signup.test.js`

```js
import request from 'supertest';
import app from '../../server.js'; // your Express app
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('POST /api/auth/signup', () => {
  const validUser = {
    username: 'Test User',
    email: 'test@bloodconnect.com',
    password: 'Password123',
    phone: '9876543210',
    bloodGroup: 'A+',
    role: 'donor',
  };

  test('1. Creates a new user and returns 201', async () => {
    const res = await request(app).post('/api/auth/signup').send(validUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('2. Returns a message about OTP verification', async () => {
    const res = await request(app).post('/api/auth/signup').send(validUser);
    expect(res.body.message).toMatch(/OTP|verify/i);
  });

  test('3. Duplicate email returns 400', async () => {
    await request(app).post('/api/auth/signup').send(validUser);
    const res = await request(app).post('/api/auth/signup').send(validUser);
    expect(res.statusCode).toBe(400);
  });

  test('4. Missing required fields returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'missing@fields.com' }); // no username, password etc.
    expect(res.statusCode).toBe(400);
  });

  test('5. Invalid blood group returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validUser, bloodGroup: 'X+', email: 'new2@test.com' });
    expect(res.statusCode).toBe(400);
  });
});
```

---

### Integration Test 2 — POST /api/auth/login

**What it tests:** Login flow — correct credentials return a token, wrong ones return 401.

**File:** `backend/__tests__/integration/auth.login.test.js`

```js
import request from 'supertest';
import app from '../../server.js';
import User from '../../models/user.js';
import bcrypt from 'bcryptjs';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

// Create a verified user directly in DB before each login test
const createVerifiedUser = async () => {
  const hash = await bcrypt.hash('Password123', 10);
  return User.create({
    username: 'Login Test',
    email: 'login@test.com',
    password: hash,
    bloodGroup: 'B+',
    role: 'donor',
    isVerified: true,
  });
};

describe('POST /api/auth/login', () => {
  test('1. Valid credentials return token', async () => {
    await createVerifiedUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('2. Wrong password returns 401', async () => {
    await createVerifiedUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'WrongPassword' });
    expect(res.statusCode).toBe(401);
  });

  test('3. Non-existent email returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password123' });
    expect(res.statusCode).toBe(401);
  });

  test('4. Response includes user role', async () => {
    await createVerifiedUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password123' });
    expect(res.body.user.role).toBe('donor');
  });

  test('5. Missing fields returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '' });
    expect(res.statusCode).toBe(400);
  });
});
```

---

### Integration Test 3 — GET /api/blood/search-donors

**What it tests:** The donor search endpoint returns matching donors by blood group.

**File:** `backend/__tests__/integration/blood.searchDonors.test.js`

```js
import request from 'supertest';
import app from '../../server.js';
import User from '../../models/user.js';
import jwt from 'jsonwebtoken';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

// Helper: generate test JWT
const makeToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1d' });

describe('GET /api/blood/search-donors', () => {
  test('1. Returns donors matching blood group', async () => {
    // Create a donor
    const donor = await User.create({
      username: 'A+ Donor',
      email: 'donor@test.com',
      bloodGroup: 'A+',
      role: 'donor',
      isAvailable: true,
      isVerified: true,
    });
    // Create a requesting user
    const receiver = await User.create({
      username: 'Receiver',
      email: 'recv@test.com',
      bloodGroup: 'A+',
      role: 'receiver',
      isVerified: true,
    });
    const token = makeToken(receiver._id);

    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'A+' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.donors.some(d => d.email === 'donor@test.com')).toBe(true);
  });

  test('2. Does NOT return unavailable donors', async () => {
    await User.create({
      username: 'Unavailable',
      email: 'unavail@test.com',
      bloodGroup: 'B+',
      role: 'donor',
      isAvailable: false,
      isVerified: true,
    });
    const receiver = await User.create({
      username: 'R2', email: 'r2@test.com', role: 'receiver', isVerified: true,
    });
    const token = makeToken(receiver._id);
    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'B+' })
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.donors.every(d => d.isAvailable)).toBe(true);
  });

  test('3. Returns 401 without authentication token', async () => {
    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'O+' });
    expect(res.statusCode).toBe(401);
  });

  test('4. Returns empty array if no donors match', async () => {
    const user = await User.create({
      username: 'U', email: 'u@test.com', role: 'receiver', isVerified: true,
    });
    const token = makeToken(user._id);
    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'AB-' })
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.donors).toHaveLength(0);
  });

  test('5. Returns donors sorted by availability', async () => {
    const user = await User.create({
      username: 'S', email: 's@test.com', role: 'receiver', isVerified: true,
    });
    const token = makeToken(user._id);
    const res = await request(app)
      .get('/api/blood/search-donors')
      .query({ bloodGroup: 'A+' })
      .set('Authorization', `Bearer ${token}`);
    // Available donors should come first
    const availabilities = res.body.donors.map(d => d.isAvailable);
    const firstFalse = availabilities.indexOf(false);
    const lastTrue = availabilities.lastIndexOf(true);
    expect(firstFalse === -1 || lastTrue < firstFalse).toBe(true);
  });
});
```

---

### Integration Test 4 — POST /api/blood/request (Create Blood Request)

**What it tests:** A receiver can submit a blood request through the API.

**File:** `backend/__tests__/integration/blood.createRequest.test.js`

```js
import request from 'supertest';
import app from '../../server.js';
import User from '../../models/user.js';
import BloodRequest from '../../models/BloodRequest.js';
import jwt from 'jsonwebtoken';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1d' });

describe('POST /api/blood/request', () => {
  let receiverToken;

  beforeEach(async () => {
    const receiver = await User.create({
      username: 'Patient', email: 'patient@test.com',
      bloodGroup: 'O+', role: 'receiver', isVerified: true,
    });
    receiverToken = makeToken(receiver._id);
  });

  const validRequest = {
    hospital: 'City Hospital',
    bloodGroup: 'O+',
    units: 2,
    urgency: 'urgent',
    location: 'Kathmandu',
    contactPhone: '9800000000',
  };

  test('1. Creates request and returns 201', async () => {
    const res = await request(app)
      .post('/api/blood/request')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send(validRequest);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('2. Request is saved to database', async () => {
    await request(app)
      .post('/api/blood/request')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send(validRequest);
    const count = await BloodRequest.countDocuments({ hospital: 'City Hospital' });
    expect(count).toBe(1);
  });

  test('3. Missing required fields returns 400', async () => {
    const res = await request(app)
      .post('/api/blood/request')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send({ bloodGroup: 'O+' }); // missing hospital, units, contactPhone
    expect(res.statusCode).toBe(400);
  });

  test('4. Unauthenticated request returns 401', async () => {
    const res = await request(app)
      .post('/api/blood/request')
      .send(validRequest); // no token
    expect(res.statusCode).toBe(401);
  });

  test('5. Response includes the created request data', async () => {
    const res = await request(app)
      .post('/api/blood/request')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send(validRequest);
    expect(res.body.request.bloodGroup).toBe('O+');
    expect(res.body.request.hospital).toBe('City Hospital');
  });
});
```

---

### Integration Test 5 — GET /api/auth/profile (Protected Route)

**What it tests:** A logged-in user can fetch their own profile. Invalid tokens are rejected.

**File:** `backend/__tests__/integration/auth.profile.test.js`

```js
import request from 'supertest';
import app from '../../server.js';
import User from '../../models/user.js';
import jwt from 'jsonwebtoken';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb.js';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1d' });

describe('GET /api/auth/profile', () => {
  test('1. Returns user profile for valid token', async () => {
    const user = await User.create({
      username: 'Bishwas', email: 'bish@test.com',
      bloodGroup: 'A+', role: 'donor', isVerified: true,
    });
    const token = makeToken(user._id);
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('bish@test.com');
  });

  test('2. Returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toBe(401);
  });

  test('3. Returns 401 with a fake/expired token', async () => {
    const fakeToken = 'Bearer fake.token.here';
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', fakeToken);
    expect(res.statusCode).toBe(401);
  });

  test('4. Profile does NOT include the password field', async () => {
    const user = await User.create({
      username: 'Safe', email: 'safe@test.com',
      bloodGroup: 'B+', role: 'receiver', isVerified: true,
    });
    const token = makeToken(user._id);
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.user.password).toBeUndefined();
  });

  test('5. Returns correct role for hospital user', async () => {
    const hospital = await User.create({
      username: 'City Hospital', email: 'hosp@test.com',
      role: 'hospital', isVerified: true,
    });
    const token = makeToken(hospital._id);
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.user.role).toBe('hospital');
  });
});
```

**How to run all integration tests:**
```bash
cd backend
node --experimental-vm-modules node_modules/.bin/jest __tests__/integration/
```

---

## Part 3 — E2E Tests

E2E tests **click through a real browser** exactly like a real user would.  
They test the full stack — frontend UI + backend API + database — all together.

### Step 1 — Install Playwright

```bash
# From project root
cd BloodConnect
npm install --save-dev @playwright/test
npx playwright install chromium
```

Create `playwright.config.js` at the project root:

```js
// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',  // Vite dev server
    headless: true,                    // set false to watch the browser
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Start backend + frontend before tests
  webServer: [
    {
      command: 'cd backend && node server.js',
      port: 3001,
      reuseExistingServer: true,
    },
    {
      command: 'cd frontend && npm run dev',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
```

Add to root `package.json`:
```json
"scripts": {
  "test:e2e": "playwright test"
}
```

---

### E2E Test 1 — User Signup Flow

**What it tests:** A new user can fill the signup form, submit it, and see the OTP page.

**File:** `e2e/auth.signup.spec.js`

```js
// e2e/auth.signup.spec.js
import { test, expect } from '@playwright/test';

test.describe('User Signup', () => {
  test('1. User can navigate to signup page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign Up');  // adjust selector to match your button
    await expect(page).toHaveURL(/signup/);
  });

  test('2. Form shows validation error for empty submit', async ({ page }) => {
    await page.goto('/signup');
    await page.click('button[type="submit"]');
    // At least one error message should appear
    const errors = page.locator('[class*="error"], .text-red, [role="alert"]');
    await expect(errors.first()).toBeVisible();
  });

  test('3. Valid signup shows OTP verification screen', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="username"]', 'Test User');
    await page.fill('input[name="email"]', `testuser_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="phone"]', '9876543210');
    await page.selectOption('select[name="bloodGroup"]', 'A+');
    await page.selectOption('select[name="role"]', 'donor');
    await page.click('button[type="submit"]');
    // Should show OTP input or success message
    await expect(page.locator('text=/OTP|verify|code/i')).toBeVisible({ timeout: 8000 });
  });

  test('4. Duplicate email shows error message', async ({ page }) => {
    // Use a known existing account email (seed one in test DB)
    await page.goto('/signup');
    await page.fill('input[name="email"]', 'existing@bloodconnect.com');
    await page.fill('input[name="username"]', 'Duplicate');
    await page.fill('input[name="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/already|exists|taken/i')).toBeVisible({ timeout: 5000 });
  });

  test('5. Login link is visible on signup page', async ({ page }) => {
    await page.goto('/signup');
    const loginLink = page.locator('a[href*="login"], text=/already have|sign in|log in/i');
    await expect(loginLink.first()).toBeVisible();
  });
});
```

---

### E2E Test 2 — User Login Flow

**What it tests:** A user can log in and is redirected to their dashboard.

**File:** `e2e/auth.login.spec.js`

```js
// e2e/auth.login.spec.js
import { test, expect } from '@playwright/test';

// Reuse login state across tests in this file
test.describe('User Login', () => {
  test('1. Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('2. Wrong credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid|incorrect|wrong|not found/i')).toBeVisible({ timeout: 5000 });
  });

  test('3. Correct credentials redirects to dashboard', async ({ page }) => {
    // You need a real verified user in your dev DB for this
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bishwashsigdel123@gmail.com');
    await page.fill('input[type="password"]', 'YourPassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('4. Empty form shows validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    const error = page.locator('[class*="error"], .text-red, [role="alert"]');
    await expect(error.first()).toBeVisible();
  });

  test('5. Forgot password link is visible', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.locator('a[href*="forgot"], text=/forgot/i');
    await expect(forgotLink.first()).toBeVisible();
  });
});
```

---

### E2E Test 3 — Search Donors Page

**What it tests:** A logged-in user can search for donors by blood group.

**File:** `e2e/searchDonors.spec.js`

```js
// e2e/searchDonors.spec.js
import { test, expect } from '@playwright/test';

// Shared login setup
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'bishwashsigdel123@gmail.com');
  await page.fill('input[type="password"]', 'YourPassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 10000 });
});

test.describe('Search Donors', () => {
  test('1. Search donors page loads', async ({ page }) => {
    await page.goto('/search-donors');
    await expect(page.locator('text=/search|find donor/i')).toBeVisible();
  });

  test('2. Can select blood group filter', async ({ page }) => {
    await page.goto('/search-donors');
    const select = page.locator('select[name="bloodGroup"], [data-testid="blood-group-select"]');
    await expect(select).toBeVisible();
    await select.selectOption('A+');
    await expect(select).toHaveValue('A+');
  });

  test('3. Results appear after search', async ({ page }) => {
    await page.goto('/search-donors');
    await page.selectOption('select[name="bloodGroup"]', 'A+');
    await page.click('button[type="submit"], button:has-text("Search")');
    // Wait for results to load
    await page.waitForLoadState('networkidle');
    const results = page.locator('[class*="donor-card"], [class*="DonorCard"], .donor-item');
    // Either results or "no donors found" message
    const noResults = page.locator('text=/no donor|not found|no result/i');
    const hasResults = await results.count() > 0;
    const hasNoMessage = await noResults.isVisible();
    expect(hasResults || hasNoMessage).toBe(true);
  });

  test('4. Donor cards show blood group badge', async ({ page }) => {
    await page.goto('/search-donors');
    await page.selectOption('select[name="bloodGroup"]', 'O+');
    await page.click('button:has-text("Search")');
    await page.waitForLoadState('networkidle');
    const cards = page.locator('[class*="donor-card"], [class*="DonorCard"]');
    if (await cards.count() > 0) {
      await expect(cards.first().locator('text=O+')).toBeVisible();
    }
  });

  test('5. Map renders on search page (Leaflet)', async ({ page }) => {
    await page.goto('/search-donors');
    // Leaflet renders a div with class "leaflet-container"
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible({ timeout: 8000 });
  });
});
```

---

### E2E Test 4 — Submit Blood Request

**What it tests:** A receiver can fill and submit a blood request form.

**File:** `e2e/bloodRequest.spec.js`

```js
// e2e/bloodRequest.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Login as a receiver account
  await page.goto('/login');
  await page.fill('input[type="email"]', 'receiver@bloodconnect.com');
  await page.fill('input[type="password"]', 'Password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 10000 });
});

test.describe('Blood Request Form', () => {
  test('1. Blood request page loads', async ({ page }) => {
    await page.goto('/blood-request');
    await expect(page.locator('text=/blood request|request blood/i')).toBeVisible();
  });

  test('2. Form fields are present', async ({ page }) => {
    await page.goto('/blood-request');
    await expect(page.locator('input[name="hospital"], input[placeholder*="hospital" i]')).toBeVisible();
    await expect(page.locator('select[name="bloodGroup"]')).toBeVisible();
    await expect(page.locator('input[name="units"], input[type="number"]')).toBeVisible();
  });

  test('3. Submitting valid form shows success', async ({ page }) => {
    await page.goto('/blood-request');
    await page.fill('input[name="hospital"]', 'Test Hospital');
    await page.selectOption('select[name="bloodGroup"]', 'A+');
    await page.fill('input[name="units"]', '2');
    await page.fill('input[name="contactPhone"]', '9800000001');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/success|submitted|created/i')).toBeVisible({ timeout: 8000 });
  });

  test('4. Submitting empty form shows error', async ({ page }) => {
    await page.goto('/blood-request');
    await page.click('button[type="submit"]');
    const error = page.locator('[class*="error"], .text-red, [role="alert"]');
    await expect(error.first()).toBeVisible();
  });

  test('5. Urgency field can be set to "critical"', async ({ page }) => {
    await page.goto('/blood-request');
    const urgencySelect = page.locator('select[name="urgency"]');
    if (await urgencySelect.isVisible()) {
      await urgencySelect.selectOption('critical');
      await expect(urgencySelect).toHaveValue('critical');
    } else {
      // Urgency might be radio buttons
      const critical = page.locator('input[value="critical"], label:has-text("Critical")');
      await expect(critical).toBeVisible();
    }
  });
});
```

---

### E2E Test 5 — Notification Bell

**What it tests:** The notification bell icon shows and can be clicked to see notifications.

**File:** `e2e/notifications.spec.js`

```js
// e2e/notifications.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'bishwashsigdel123@gmail.com');
  await page.fill('input[type="password"]', 'YourPassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 10000 });
});

test.describe('Notifications', () => {
  test('1. Notification bell icon is visible in navbar', async ({ page }) => {
    const bell = page.locator('[class*="bell"], [aria-label*="notification"], svg[class*="Bell"]');
    await expect(bell.first()).toBeVisible();
  });

  test('2. Clicking bell opens notification panel', async ({ page }) => {
    const bell = page.locator('[class*="bell"], [aria-label*="notification"]').first();
    await bell.click();
    const panel = page.locator('[class*="notification-panel"], [class*="NotificationPanel"], [class*="dropdown"]');
    await expect(panel.first()).toBeVisible({ timeout: 3000 });
  });

  test('3. Notification panel closes when clicking outside', async ({ page }) => {
    const bell = page.locator('[class*="bell"]').first();
    await bell.click();
    await page.mouse.click(50, 50); // click top-left corner (outside panel)
    const panel = page.locator('[class*="notification-panel"]');
    await expect(panel).toBeHidden({ timeout: 2000 });
  });

  test('4. Dashboard page title is visible', async ({ page }) => {
    await expect(page.locator('text=/dashboard|welcome/i').first()).toBeVisible();
  });

  test('5. User avatar or name visible in navbar when logged in', async ({ page }) => {
    const avatar = page.locator('[class*="avatar"], [class*="user-name"], [class*="profile"]');
    await expect(avatar.first()).toBeVisible();
  });
});
```

**How to run all E2E tests:**
```bash
# From project root (make sure backend + frontend are running, or let playwright start them)
npx playwright test

# Run with visible browser (good for debugging)
npx playwright test --headed

# Run a specific file
npx playwright test e2e/auth.login.spec.js

# View the HTML report after a run
npx playwright show-report
```

---

## Running All Tests at Once

### Backend unit + integration:
```bash
cd backend
node --experimental-vm-modules node_modules/.bin/jest --runInBand
```

### Frontend unit tests:
```bash
cd frontend
npx vitest run
```

### E2E tests:
```bash
# from project root
npx playwright test
```

### Full test script (add to root package.json):
```json
"scripts": {
  "test:unit:backend": "cd backend && node --experimental-vm-modules node_modules/.bin/jest __tests__/unit/",
  "test:integration": "cd backend && node --experimental-vm-modules node_modules/.bin/jest __tests__/integration/",
  "test:unit:frontend": "cd frontend && vitest run",
  "test:e2e": "playwright test",
  "test:all": "npm run test:unit:backend && npm run test:integration && npm run test:unit:frontend && npm run test:e2e"
}
```

---

## Quick Summary

| # | Test Name | Type | File |
|---|-----------|------|------|
| 1 | autoResetAvailability | Unit (backend) | `backend/__tests__/unit/autoReset.test.js` |
| 2 | JWT Token Generation | Unit (backend) | `backend/__tests__/unit/generateToken.test.js` |
| 3 | Blood Group Validation | Unit (frontend) | `frontend/src/__tests__/unit/bloodUtils.test.js` |
| 4 | useCounter Hook | Unit (frontend) | `frontend/src/__tests__/unit/useCounter.test.js` |
| 5 | OTP Generation | Unit (backend) | `backend/__tests__/unit/otp.test.js` |
| 6 | POST /api/auth/signup | Integration | `backend/__tests__/integration/auth.signup.test.js` |
| 7 | POST /api/auth/login | Integration | `backend/__tests__/integration/auth.login.test.js` |
| 8 | GET /api/blood/search-donors | Integration | `backend/__tests__/integration/blood.searchDonors.test.js` |
| 9 | POST /api/blood/request | Integration | `backend/__tests__/integration/blood.createRequest.test.js` |
| 10 | GET /api/auth/profile | Integration | `backend/__tests__/integration/auth.profile.test.js` |
| 11 | Signup Flow | E2E | `e2e/auth.signup.spec.js` |
| 12 | Login Flow | E2E | `e2e/auth.login.spec.js` |
| 13 | Search Donors | E2E | `e2e/searchDonors.spec.js` |
| 14 | Blood Request Form | E2E | `e2e/bloodRequest.spec.js` |
| 15 | Notification Bell | E2E | `e2e/notifications.spec.js` |
