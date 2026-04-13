# BloodConnect — Full Project Guide

> Last updated: April 2026

---

## 📋 What Is BloodConnect?

BloodConnect is a full-stack blood donation platform that connects three types of users — **donors**, **receivers**, and **hospitals** — in real time. It handles everything from blood requests and donation tracking to hospital inventory management, inter-hospital blood transfers, community stories, blood drive events, and email notifications.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│             FRONTEND  (React + Vite)                │
│              http://localhost:5173                  │
│                                                     │
│  axios (auto JWT)  +  fetch()  +  EventSource SSE  │
└────────────────────────┬────────────────────────────┘
                         │ HTTP + SSE
                         ▼
┌─────────────────────────────────────────────────────┐
│           BACKEND  (Express + Node.js)              │
│              http://localhost:3001                  │
│                                                     │
│   /api/auth   /api/blood   /api/notifications       │
│   /api/stories   /api/events   /api/sse             │
└──────┬──────────────────────────────┬───────────────┘
       │ Mongoose ODM                 │ External Services
       ▼                              ▼
┌─────────────────┐     ┌────────────────────────────┐
│    MongoDB      │     │  Gmail SMTP  (nodemailer)  │
│  localhost:27017│     │  Google OAuth 2.0          │
│  db: bloodconnect│    └────────────────────────────┘
└─────────────────┘
```

---

## 📁 Project Structure

```
BloodConnect/
├── PROJECT_GUIDE.md              ← You are here
├── package.json                  ← Root-level scripts
│
├── backend/
│   ├── server.js                 ← Express app entry point + SSE setup
│   ├── sse.js                    ← Server-Sent Events manager
│   ├── .env                      ← Environment variables (never commit this)
│   ├── package.json
│   │
│   ├── config/
│   │   └── dbconnection.js       ← MongoDB connection (mongoose.connect)
│   │
│   ├── controllers/              ← Business logic (called by routes)
│   │   ├── authController.js     ← Signup, login, OTP, Google OAuth, profile
│   │   ├── bloodController.js    ← Blood requests + donor matching
│   │   ├── donationController.js ← Donation history & manual recording
│   │   ├── eventController.js    ← Blood drive events + RSVPs
│   │   ├── inventoryController.js← Hospital blood stock management
│   │   ├── notificationController.js ← Notification CRUD
│   │   ├── storyController.js    ← Community stories
│   │   └── transferController.js ← Hospital-to-hospital blood transfers
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js     ← JWT verification (protect middleware)
│   │   ├── roleMiddleware.js     ← Role-based access (restrictTo middleware)
│   │   └── multer.js             ← Avatar image upload handler
│   │
│   ├── models/                   ← MongoDB schemas (Mongoose)
│   │   ├── user.js
│   │   ├── BloodRequest.js
│   │   ├── Donation.js
│   │   ├── Event.js
│   │   ├── Inventory.js
│   │   ├── InventoryLog.js
│   │   ├── Notification.js
│   │   ├── Story.js
│   │   └── BloodTransfer.js
│   │
│   ├── routes/                   ← API route definitions
│   │   ├── auth.js               ← /api/auth/*
│   │   ├── blood.js              ← /api/blood/*
│   │   ├── event.js              ← /api/events/*
│   │   ├── notification.js       ← /api/notifications/*
│   │   └── story.js              ← /api/stories/*
│   │
│   └── public/uploads/avatars/   ← Uploaded avatar image files
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env                       ← Frontend env variables
    ├── package.json
    │
    └── src/
        ├── main.jsx               ← React entry point
        ├── App.jsx                ← Router + route definitions
        │
        ├── context/
        │   └── AuthContext.jsx    ← Global auth state + axios interceptors
        │
        ├── services/
        │   └── api.ts             ← fetch()-based API for signup/login
        │
        ├── hooks/
        │   ├── useCounter.js      ← Animated counter hook (stats on Home)
        │   └── useScrollAnimation.js ← Scroll-triggered animation hook
        │
        ├── data/
        │   └── dummyData.js       ← Static mock data used in UI
        │
        ├── pages/
        │   ├── Home.jsx           ← Public landing page
        │   ├── Login.jsx          ← Login + Google OAuth
        │   ├── Register.jsx       ← Multi-role signup form
        │   ├── VerifyEmail.jsx    ← OTP verification page
        │   ├── ForgotPassword.jsx ← Password reset request
        │   ├── ResetPassword.jsx  ← New password entry (from email link)
        │   ├── dashboard.jsx      ← Donor & receiver unified dashboard
        │   ├── HospitalDashboard.jsx ← Hospital-specific dashboard
        │   ├── BloodRequest.jsx   ← Create/manage blood requests
        │   ├── BloodTransfer.jsx  ← Accept/reject transfer (token from email)
        │   ├── Profile.jsx        ← View profile page
        │   ├── EditProfile.jsx    ← Edit profile (donor/receiver)
        │   ├── HospitalEditProfile.jsx ← Edit profile (hospital)
        │   ├── SearchDonors.jsx   ← Search & filter donors
        │   ├── SubmitStory.jsx    ← Story submission page
        │   ├── Contact.jsx        ← Contact page
        │   └── EmergencyRespond.jsx ← Emergency response page
        │
        └── components/
            ├── Navbar.jsx
            ├── Footer.jsx
            ├── ProtectedRoute.jsx ← Redirects unauthenticated users to /login
            ├── Toast.jsx          ← Toast notification UI
            ├── Button.jsx         ← Reusable button component
            ├── LifeSaverModal.jsx ← Celebration modal after accepting donation
            ├── DonorEligibility.jsx ← Shows 56-day cooldown countdown
            └── NotFound.jsx       ← 404 page
```

---

## ⚙️ Setup & Running

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/bloodconnect
JWT_SECRET=your-64-char-random-hex-string
PORT=3001
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password          # Gmail App Password, not real password
GOOGLE_CLIENT_ID=your-google-oauth-client-id
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

```bash
mongod                 # Start MongoDB
npm run dev            # Start backend (port 3001)
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev            # Start frontend (port 5173)
```

---

## 🔌 How Frontend Connects to Backend

There are **three communication channels**:

### 1. fetch() — Initial Auth Only (`api.ts`)
Used only for `/auth/signup` and `/auth/login`. A thin wrapper around the native `fetch()` API.

```
API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
```

### 2. axios — All Other API Calls (`AuthContext.jsx`)
Every other API call uses axios. `AuthContext.jsx` configures two interceptors globally:

- **Request interceptor:** Reads `token` from `localStorage` → attaches `Authorization: Bearer <token>` header automatically to every request.
- **Response interceptor:** If response is `401 Unauthorized` → clears localStorage → redirects user to `/login`.

```
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
```

### 3. EventSource SSE — Real-Time Notifications (`dashboard.jsx`)
For real-time push updates (e.g., instant SOS alerts to matching donors):

```javascript
const es = new EventSource(`/api/sse?token=${token}`)
es.addEventListener('new_blood_request', handler)
es.addEventListener('request_accepted', handler)
es.addEventListener('request_fulfilled', handler)
es.addEventListener('event_notification', handler)
```

The backend keeps an in-memory `Map` of `userId → response stream`. A heartbeat ping is sent every 25 seconds to keep connections alive.

---

## 🚀 All API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | Public | Register new user (donor/receiver/hospital). Creates unverified account, emails 6-digit OTP (expires 15 min) |
| POST | `/login` | Public | Login with email or phone + password. Returns JWT token |
| POST | `/verify-email` | Public | Submit OTP code to activate account |
| POST | `/resend-verification` | Public | Resend OTP to registered email |
| GET | `/me` | Protected | Get current user profile. Also auto-resets `isAvailable` if 56 days have passed since last donation |
| PATCH | `/profile` | Protected | Update name, phone, avatar (file upload), address, emergency contact |
| POST | `/forgot-password` | Public | Send password reset link to email |
| POST | `/reset-password` | Public | Reset password using token from email link |
| POST | `/set-password` | Protected | Set or change password (works for Google OAuth users who have no password yet) |
| POST | `/google` | Public | Verify Google credential token → find or create account → return JWT |

---

### Blood — `/api/blood`

#### For All Roles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/request` | Protected | Create blood request. Instantly pushes SSE notification to all matching available donors |
| GET | `/my-requests` | Protected | Get all blood requests created by the current user |
| GET | `/matching-requests` | Donor only | Get pending requests that match the donor's blood type |
| PATCH | `/:id/accept` | Donor only | Donor accepts a request → auto-records a donation → sets 56-day cooldown |
| PATCH | `/:id/fulfill` | Receiver only | Receiver confirms blood was received → notifies donor |
| PATCH | `/:id/cancel` | Protected | Cancel a pending request |
| PATCH | `/:id/edit` | Protected | Edit details of a pending request |
| POST | `/donate` | Donor only | Manually record an offline donation |
| GET | `/my-donations` | Donor only | Get full donation history |
| GET | `/stats` | Public | Get platform-wide statistics (total requests, donors, fulfilled, etc.) |
| GET | `/email-respond` | Public | Accept or reject a blood request via emailed link (token-based, no login needed) |

#### Hospital-Only Blood Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/donors` | Get list of all donors (for direct alerts) |
| POST | `/donors/alert` | Send a blood request alert directly to specific donors |
| GET | `/all-requests` | View all blood requests on the platform (not just own) |
| PATCH | `/:id/assign-donor` | Manually assign a donor to a blood request |
| POST | `/inventory` | Add or subtract blood units from hospital inventory |
| GET | `/inventory` | Get current blood stock for all blood groups |
| GET | `/inventory-logs` | Get last 50 inventory change logs (full audit trail) |
| POST | `/transfer/create` | Create a blood transfer request to another hospital. Sends email with accept/reject link |
| POST | `/transfer/accept` | Accept an incoming transfer. Updates both hospitals' inventories automatically |
| POST | `/transfer/reject` | Reject an incoming transfer |
| GET | `/transfer/history` | Get full transfer history (sent + received) |

---

### Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Protected | Get last 30 notifications with total unread count |
| PATCH | `/:id/read` | Protected | Mark one notification as read |
| PATCH | `/read-all` | Protected | Mark all notifications as read |

---

### Stories — `/api/stories`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | Get last 50 community stories |
| POST | `/` | Protected | Share or update your story (one per user — upserted) |

---

### Events — `/api/events`

| Method | Endpoint | Auth | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/` | Protected | All roles | Get all upcoming blood drive events |
| GET | `/mine` | Protected | Hospital | Get only this hospital's events |
| POST | `/` | Protected | Hospital | Create a new blood drive event |
| PATCH | `/:id` | Protected | Hospital | Update own event details |
| DELETE | `/:id` | Protected | Hospital | Cancel/delete own event |
| POST | `/:id/rsvp` | Protected | Donor/Receiver | RSVP to an event (attending or declined) |

---

### Real-Time — `/api/sse`

| Endpoint | Description |
|----------|-------------|
| `GET /api/sse?token=<JWT>` | Opens a persistent SSE stream. Backend sends push events when blood requests are created, accepted, or fulfilled. Heartbeat every 25s. |

**SSE Event Types:**

| Event | Who Receives It | When |
|-------|----------------|------|
| `new_blood_request` | Matching donors | When a blood request is created |
| `request_accepted` | Requester | When a donor accepts their request |
| `request_fulfilled` | Donor | When receiver confirms receipt |
| `event_notification` | All donors/receivers | When a new blood drive event is posted |

---

## 👤 User Roles & Permissions

| Feature | Donor | Receiver | Hospital |
|---------|:-----:|:--------:|:--------:|
| Create blood request | ✅ | ✅ | ✅ |
| View matching requests | ✅ | — | — |
| Accept blood request | ✅ | — | — |
| Mark request fulfilled | — | ✅ | — |
| Cancel / Edit own request | ✅ | ✅ | ✅ |
| View donation history | ✅ | — | — |
| Manually record donation | ✅ | — | — |
| Manage blood inventory | — | — | ✅ |
| View inventory logs | — | — | ✅ |
| Create blood transfers | — | — | ✅ |
| Alert donors directly | — | — | ✅ |
| Create/manage events | — | — | ✅ |
| RSVP to events | ✅ | ✅ | — |
| Share community stories | ✅ | ✅ | ✅ |
| Edit profile | ✅ | ✅ | ✅ |
| View platform stats | ✅ | ✅ | ✅ |

---

## 🗄️ Database Models (MongoDB Collections)

### `users`
```
username          String, required
email             String, required, unique
password          String, hashed with bcrypt (optional for Google users)
googleId          String (only for Google OAuth accounts)
bloodGroup        Enum: A+ A- B+ B- O+ O- AB+ AB-
phone             String
location          String
role              Enum: donor | receiver | hospital  (required)
isAvailable       Boolean (default: true) — set to false during 56-day cooldown
lastDonation      Date — used to calculate cooldown end date
hospitalName      String (only for hospital role)
avatar            String — file path or URL
address           String
emergencyContact  { name: String, phone: String }
isVerified        Boolean (default: false)
verificationCode  String — 6-digit OTP
verificationCodeExpires  Date — 15 minutes from send time
resetPasswordToken       String
resetPasswordExpire      Date
timestamps        createdAt, updatedAt
```

### `bloodrequests`
```
requester         ObjectId → users (required)
hospital          String (required)
bloodGroup        Enum: A+ A- B+ B- O+ O- AB+ AB- (required)
units             Number, min: 1 (required)
urgency           Enum: normal | emergency (default: normal)
location          String
contactPhone      String
note              String
coordinates       { lat: Number, lng: Number }
status            Enum: pending | accepted | fulfilled | cancelled (default: pending)
acceptedBy        ObjectId → users
emailTokens       [{ donorId, token, used, action }] — for email-based accept/reject
timestamps        createdAt, updatedAt
```

### `donations`
```
donor             ObjectId → users (required)
hospital          String
bloodGroup        String
units             Number (required)
donatedAt         Date (default: now)
notes             String
status            String (default: Completed)
timestamps        createdAt, updatedAt
```

### `events`
```
title             String (required)
description       String
date              Date (required)
time              String (e.g. "10:00 AM – 4:00 PM")
location          String (required)
contactPhone      String
bloodGroupsNeeded [Enum] — which blood types are needed (or "All")
targetDonors      Number (default: 0)
hospital          ObjectId → users (required)
hospitalName      String (required)
status            Enum: upcoming | ongoing | completed | cancelled (default: upcoming)
rsvps             [{ user: ObjectId, status: attending|declined, rsvpAt: Date }]
notifiedCount     Number (default: 0)
timestamps        createdAt, updatedAt
```

### `inventories`
```
hospital          ObjectId → users (required, indexed)
bloodGroup        Enum: A+ A- ... AB- (required)
units             Number (default: 0, min: 0)
earliestExpiryDate Date
lastRestockDate   Date (default: now)
lastUpdated       Date (default: now)
Unique index:     (hospital + bloodGroup) — one record per blood type per hospital
```

### `inventorylogs`
```
hospital          ObjectId → users (required, indexed)
bloodGroup        String (required)
action            Enum: add | subtract | transfer_out | transfer_in (required)
units             Number (required)
performedBy       ObjectId → users (required)
reason            String
beforeUnits       Number
afterUnits        Number
expiryDate        Date
transferToHospital   String
transferFromHospital String
timestamp         Date (default: now, indexed)
```

### `notifications`
```
user              ObjectId → users (required)
message           String (required)
type              Enum: request_accepted | request_fulfilled | request_cancelled |
                        new_blood_request | general | low_stock | near_expiry |
                        critical_inventory | event_notification | event_reminder
                  (default: general)
read              Boolean (default: false)
data              Mixed — flexible object with extra context (e.g. request details)
severity          Enum: low | medium | high (default: medium)
timestamps        createdAt, updatedAt
```

### `stories`
```
author            ObjectId → users (required)
name              String (required)
role              Enum: donor | receiver | hospital (required)
title             String (required)
message           String (required, min 20 chars)
location          String (default: '')
avatar            String
timestamps        createdAt, updatedAt
One story per user — POST /api/stories upserts (update or create)
```

### `bloodtransfers`
```
fromHospitalId    ObjectId → users (required)
fromHospitalName  String (required)
toHospitalEmail   String, lowercase (required)
toHospitalId      ObjectId → users
toHospitalName    String
bloodGroup        Enum (required)
units             Number, min: 1 (required)
reason            String (default: 'Blood inventory transfer')
status            Enum: pending | accepted | rejected (default: pending)
acceptedAt        Date
rejectedAt        Date
rejectionReason   String
confirmationToken String — 32-byte hex, one-time use
tokenExpires      Date — 7 days from creation
timestamps        createdAt, updatedAt
```

---

## 🔑 Authentication & Security

### JWT Flow
1. User logs in → Backend issues a JWT (expires in **30 days**)
2. Token stored in `localStorage` as `token`
3. Every axios request auto-attaches: `Authorization: Bearer <token>`
4. Backend `protect` middleware verifies the token on every protected route
5. On 401 response → frontend clears localStorage → redirects to `/login`

### Password Security
- Passwords hashed with **bcryptjs** (10 salt rounds) before saving to MongoDB
- Plaintext passwords are never stored or logged
- Google OAuth users can optionally set a password via `/api/auth/set-password`

### Role-Based Access Control (RBAC)
Routes use the `restrictTo(...roles)` middleware from `roleMiddleware.js`:

```javascript
router.get('/all-requests', protect, restrictTo('hospital'), getAllRequests)
router.patch('/:id/accept', protect, restrictTo('donor'), acceptRequest)
router.patch('/:id/fulfill', protect, restrictTo('receiver'), fulfillRequest)
```

### Google OAuth Flow
```
1. User clicks "Continue with Google" in frontend
2. @react-oauth/google returns a Google credential token
3. Frontend POST /api/auth/google { credential }
4. Backend verifies token with google-auth-library
5. If user exists → log them in, return JWT
6. If new user → create account (no OTP needed), return JWT
7. First-time Google users select their role in the UI before step 3
```

---

## 📬 Email Notifications (Nodemailer + Gmail SMTP)

Your Gmail account sends all system emails using `nodemailer` with Gmail SMTP.

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Signup | New user | 6-digit OTP (expires 15 min) |
| Forgot password | User | Password reset link with token |
| Blood transfer created | Target hospital | Transfer details + **Accept** and **Reject** links (token-based, 7-day expiry) |
| Email-based blood request response | Donor | Accept/decline link for blood request (no login needed) |
| Low blood stock | Hospital | Alert when a blood group inventory drops below threshold |
| Near expiry | Hospital | Alert when blood units are approaching their expiry date |

---

## 🩸 Key Business Logic & Workflows

### Donation Cooldown (56 Days)
1. Donor accepts a blood request → `isAvailable = false`, `lastDonation = now`
2. A `Donation` record is automatically created (no separate step)
3. Every time `/api/auth/me` is called (dashboard load), the backend runs `autoResetAvailability()`
4. If `now - lastDonation >= 56 days` → `isAvailable` is reset to `true`
5. Frontend shows a countdown timer until the donor is eligible again

### Blood Request Lifecycle
```
Receiver creates request  →  status: pending
                          →  SSE alert sent to all matching donors
                          →  (Optional) Email sent to donors with accept/reject link

Donor accepts request     →  status: accepted
                          →  Donation auto-recorded
                          →  Donor's 56-day cooldown begins
                          →  SSE notification sent to requester

Receiver confirms receipt →  status: fulfilled
                          →  SSE thank-you notification sent to donor

Either party cancels      →  status: cancelled
```

### Hospital Blood Transfer Lifecycle
```
Hospital A creates transfer  →  BloodTransfer record created (status: pending)
                             →  Email sent to target hospital with token link

Hospital B clicks link       →  Redirected to /blood-transfer?token=...
                             →  Reviews transfer details

Hospital B accepts           →  Both inventories updated (A loses units, B gains)
                             →  Transfer status: accepted
                             →  InventoryLog entries created for both hospitals

Hospital B rejects           →  Transfer status: rejected
                             →  No inventory changes
```

### Hospital Inventory
- Every `add` or `subtract` action is logged in `InventoryLog` with before/after values
- Actions include: `add`, `subtract`, `transfer_out`, `transfer_in`
- Automatic alerts sent when stock drops below threshold or approaches expiry
- One `Inventory` record per (hospital + blood group) combination

---

## 🔗 Full Connection Map

```
USER ACTION (browser)
       │
       ▼
FRONTEND (React @ localhost:5173)
  ├── fetch()    → POST /api/auth/signup, /api/auth/login
  ├── axios      → All other /api/* calls (JWT auto-attached)
  └── EventSource→ GET /api/sse?token=<JWT>  (real-time stream)
       │
       ▼
BACKEND (Express @ localhost:3001)
  ├── /api/auth          → authController.js
  │     ├── bcryptjs (password hashing)
  │     ├── jsonwebtoken (JWT sign/verify)
  │     ├── nodemailer → Gmail SMTP (OTP, password reset emails)
  │     └── google-auth-library (Google OAuth token verification)
  │
  ├── /api/blood         → bloodController.js + donationController.js
  │                        + inventoryController.js + transferController.js
  │     ├── sse.js → pushes real-time events to connected clients
  │     └── nodemailer → Gmail SMTP (transfer emails, email-respond links)
  │
  ├── /api/events        → eventController.js
  ├── /api/notifications → notificationController.js
  ├── /api/stories       → storyController.js
  ├── /api/sse           → sse.js (SSE connection manager)
  │
  └── ALL routes → mongoose → MongoDB (localhost:27017/bloodconnect)
         ├── users
         ├── bloodrequests
         ├── donations
         ├── events
         ├── inventories
         ├── inventorylogs
         ├── notifications
         ├── stories
         └── bloodtransfers

EXTERNAL SERVICES
  ├── Gmail SMTP (smtp.gmail.com)
  │     Account: bishwashsigdel123@gmail.com
  │     Auth: App Password (not regular password)
  │     Sends: OTPs, password resets, transfer emails, inventory alerts
  │
  └── Google OAuth 2.0 (accounts.google.com)
        Client ID: 1013497841660-lr12llscl53ppbjnf33v4lbrg2lgla1j.apps.googleusercontent.com
        Used in: Frontend button (@react-oauth/google)
                 Backend verification (google-auth-library)
```

---

## 📦 Dependencies Summary

### Backend (`backend/package.json`)
| Package | Purpose |
|---------|---------|
| `express` | Web framework, routing |
| `mongoose` | MongoDB ODM — schemas, queries, connections |
| `bcryptjs` | Password hashing (10 rounds) |
| `jsonwebtoken` | JWT creation and verification (30-day expiry) |
| `nodemailer` | Email sending via Gmail SMTP |
| `multer` | Avatar image upload handling |
| `cors` | Cross-Origin Resource Sharing headers |
| `dotenv` | Load environment variables from `.env` |
| `compression` | Compress HTTP responses (gzip) |
| `google-auth-library` | Verify Google OAuth credential tokens |

### Frontend (`frontend/package.json`)
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing (v6) |
| `axios` | HTTP client with interceptors for auth |
| `@react-oauth/google` | Google Sign-In button component |
| `react-icons` | Icon library (Font Awesome etc.) |
| `tailwindcss` | Utility-first CSS framework |
| `vite` | Dev server and build tool |

---

## 🌐 CORS Configuration

The backend allows requests from:
```javascript
origin: [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:3000',   // Create React App backup
  process.env.FRONTEND_URL   // Production URL from .env
],
credentials: true
```

Special headers for Google OAuth popup support:
```
Cross-Origin-Opener-Policy: same-origin-allow-popups
Cross-Origin-Embedder-Policy: require-corp
```

---

## 📱 All Frontend Pages & Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/` | Home.jsx | Public | Landing page with stats, features, events, map |
| `/login` | Login.jsx | Public | Email/phone login + Google OAuth |
| `/register` | Register.jsx | Public | Role-based signup (donor/receiver/hospital) |
| `/verify-email` | VerifyEmail.jsx | Public | OTP code entry with resend |
| `/forgot-password` | ForgotPassword.jsx | Public | Send reset link |
| `/reset-password` | ResetPassword.jsx | Public | Enter new password (from email link) |
| `/dashboard` | dashboard.jsx | Protected | Unified donor & receiver dashboard |
| `/hospital` | HospitalDashboard.jsx | Hospital | Hospital management dashboard |
| `/profile` | Profile.jsx | Protected | View own profile |
| `/profile/edit` | EditProfile.jsx | Protected | Edit profile (donor/receiver) |
| `/hospital/edit` | HospitalEditProfile.jsx | Hospital | Edit hospital profile |
| `/search-donors` | SearchDonors.jsx | Protected | Search donors by blood group/location |
| `/blood-transfer` | BloodTransfer.jsx | Public | Accept/reject transfer via email token |
| `/contact` | Contact.jsx | Public | Contact page |

---

## 🐛 Troubleshooting

**Backend won't start**
- Check if MongoDB is running: `mongod`
- Verify `.env` file exists in `backend/` with all required fields
- Make sure port 3001 is not already in use

**OTP email not arriving**
- Ensure `EMAIL_PASS` is a Gmail **App Password** (not your regular password)
- Go to Google Account → Security → 2-Step Verification → App Passwords
- Check spam/junk folder

**Google OAuth not working**
- `GOOGLE_CLIENT_ID` must match in both `backend/.env` and `frontend/.env`
- Your `localhost:5173` must be listed in Google Cloud Console → OAuth → Authorized JavaScript origins

**Frontend can't reach backend**
- Confirm backend is running on port 3001
- Check browser console for CORS errors
- Verify `VITE_API_URL=http://localhost:3001` is set in `frontend/.env`

**Avatar upload failing**
- File must be an image (jpg, png, webp, etc.)
- Max size is 2MB
- The folder `backend/public/uploads/avatars/` must exist

**Real-time notifications not arriving**
- Check that the EventSource SSE connection is open in browser DevTools → Network → EventStream
- Donor must have the same `bloodGroup` as the request and `isAvailable: true`
- Donor cannot be the same user as the requester

**Blood request not notifying donors**
- Confirm donor's blood group matches the request
- Check `isAvailable` is `true` in the user document
- SSE stream must be connected (dashboard must be open)

---

## 💡 Key Technical Decisions

- **Single `/dashboard` for donor + receiver** — same page, role-aware rendering using `isDonor` / `isReceiver` checks
- **Donation auto-recorded on accept** — no manual step needed; the system records it automatically
- **56-day cooldown auto-resets** on every `/me` call (every dashboard load)
- **Stories are upserted** — each user has at most one story, updated in place
- **Email-based blood request response** — donors can accept/reject via a tokenized email link without logging in
- **Blood transfers use one-time confirmation tokens** — 32-byte hex, 7-day expiry, sent by email
- **InventoryLog for full audit trail** — every inventory change (add/subtract/transfer) is logged with before/after values
- **SSE over WebSocket** — simpler, one-directional server-to-client push without socket overhead
- **LifeSaver modal stays open** after accepting donation — intentional, to let the donor read the details
- **Notifications fetched every 30 seconds** as backup alongside SSE push

---

## 📦 Running Both Servers

Open two terminals:

```bash
# Terminal 1 — Backend
cd BloodConnect/backend
npm run dev

# Terminal 2 — Frontend
cd BloodConnect/frontend
npm run dev
```

Open your browser at `http://localhost:5173`

So in short — sse.js is the real-time engine of your app. It's what makes BloodConnect feel live and instant rather than slow and refresh-dependent.