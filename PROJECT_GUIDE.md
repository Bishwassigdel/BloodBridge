# BloodConnect — Full Project Guide

> Last updated: May 2026 — Project complete

---

## 📋 What Is BloodConnect?

BloodConnect (also known as BloodBridge) is a full-stack blood donation platform that connects three types of users — **donors**, **receivers**, and **hospitals** — in real time. It handles everything from blood requests and donation tracking to hospital inventory management, inter-hospital blood transfers, community stories, blood drive events, interactive maps, push notifications, and email notifications.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│             FRONTEND  (React + Vite)                │
│              http://localhost:5173                  │
│                                                     │
│  axios (auto JWT)  +  api.ts  +  EventSource SSE   │
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
├── package.json                  ← Root-level scripts (run both servers at once)
│
├── backend/
│   ├── server.js                 ← Express app entry point + SSE setup
│   ├── sse.js                    ← Server-Sent Events manager
│   ├── .env                      ← Environment variables (never commit this)
│   ├── package.json
│   │
│   ├── config/
│   │   ├── dbconnection.js       ← MongoDB connection (mongoose.connect)
│   │   └── cache.js              ← In-memory response cache (GET dedup)
│   │
│   ├── controllers/              ← Business logic (called by routes)
│   │   ├── authController.js     ← Signup, login, OTP, Google OAuth, profile
│   │   ├── bloodController.js    ← Blood requests + donor matching + map endpoints
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
│   │   └── multer.js             ← Avatar & event image upload handler
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
│   └── public/uploads/
│       ├── avatars/              ← Uploaded user avatar images
│       └── events/               ← Uploaded event banner images
│
└── frontend/
    ├── index.html
    ├── vite.config.ts            ← Vite config with pre-bundling + proxy + COOP
    ├── tailwind.config.js
    ├── clean-start.sh            ← Dev script: clears cache, pre-bundles deps, starts server
    ├── .env                      ← Frontend env variables
    ├── package.json
    │
    └── src/
        ├── main.jsx              ← React entry point
        ├── App.jsx               ← Router + route definitions
        │
        ├── context/
        │   └── AuthContext.jsx   ← Global auth state + axios interceptors (memoized)
        │
        ├── services/
        │   └── api.ts            ← Axios instance with GET cache + in-flight dedup
        │
        ├── hooks/
        │   ├── useCounter.js         ← rAF-based animated counter (stats on Home)
        │   ├── useScrollAnimation.js ← IntersectionObserver scroll-trigger hook
        │   ├── useGeolocation.js     ← GPS location + reverse geocoding hook
        │   └── usePushNotifications.js ← Web Push API + service worker hook
        │
        ├── data/
        │   └── dummyData.js      ← Static data (bloodGroups list used in Home)
        │
        ├── pages/
        │   ├── Home.jsx              ← Public landing page (map, stats, events, stories)
        │   ├── Login.jsx             ← Login + Google OAuth
        │   ├── Register.jsx          ← Multi-role signup (donor/receiver/hospital)
        │   ├── VerifyEmail.jsx       ← OTP verification page
        │   ├── ForgotPassword.jsx    ← Password reset request
        │   ├── ResetPassword.jsx     ← New password entry (from email link)
        │   ├── dashboard.jsx         ← Donor & receiver unified dashboard
        │   ├── HospitalDashboard.jsx ← Hospital-specific dashboard
        │   ├── BloodRequest.jsx      ← Create/manage blood requests
        │   ├── BloodTransfer.jsx     ← Accept/reject transfer (token from email)
        │   ├── Profile.jsx           ← View profile page
        │   ├── EditProfile.jsx       ← Edit profile (donor/receiver)
        │   ├── HospitalEditProfile.jsx ← Edit profile (hospital)
        │   ├── SearchDonors.jsx      ← Search & filter donors with map view
        │   ├── SubmitStory.jsx       ← Story submission page
        │   ├── EmergencyRespond.jsx  ← Emergency SOS response page
        │   └── Contact.jsx           ← Contact page
        │
        ├── components/
        │   ├── Navbar.jsx            ← Top navigation bar
        │   ├── Footer.jsx            ← Site footer
        │   ├── MapPicker.jsx         ← Leaflet map component (lazy loaded on all pages)
        │   ├── ProtectedRoute.jsx    ← Redirects unauthenticated users to /login
        │   ├── Toast.jsx             ← Toast notification UI
        │   ├── LifeSaverModal.jsx    ← Celebration modal after accepting donation
        │   ├── DonationCertificate.jsx ← Printable donation certificate component
        │   ├── DonorEligibility.jsx  ← 56-day cooldown countdown display
        │   └── NotFound.jsx          ← 404 page
        │
        └── public/
            ├── favicon.ico
            └── sw.js                 ← Service worker for Web Push notifications
```

---

## ⚙️ Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)
- Gmail account with an App Password

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
mongod                 # Start MongoDB (separate terminal)
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

**First-time or slow-start fix — use the clean start script:**
```bash
bash clean-start.sh    # Clears Vite cache, pre-bundles all deps, then starts server
```

**Normal dev start:**
```bash
npm run dev            # Start frontend (port 5173)
```

### Run Both at Once (from project root)

```bash
cd BloodConnect
npm run dev            # Starts backend + frontend simultaneously via concurrently
```

---

## 🔌 How Frontend Connects to Backend

There are **three communication channels**:

### 1. api.ts — HTTP API Calls
A configured axios instance with GET response caching and in-flight request deduplication. Used across all pages for API calls. Automatically attaches `Authorization: Bearer <token>` from `localStorage`.

```
baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
```

### 2. AuthContext.jsx — Global Auth + Axios Interceptors
Manages user session state globally. Configures axios interceptors:
- **Request:** Attaches JWT token to every request header automatically
- **Response:** On `401 Unauthorized` → clears localStorage → redirects to `/login`

All auth functions (`login`, `logout`, `signup`, `googleLogin`, etc.) are memoized with `useCallback`. Context value is memoized with `useMemo` to prevent unnecessary re-renders across all consuming components.

### 3. EventSource SSE — Real-Time Notifications
For real-time push updates (instant SOS alerts to matching donors, request updates):

```javascript
const es = new EventSource(`/api/sse?token=${token}`)
es.addEventListener('new_blood_request', handler)
es.addEventListener('request_accepted', handler)
es.addEventListener('request_fulfilled', handler)
es.addEventListener('event_notification', handler)
```

The backend keeps an in-memory `Map` of `userId → response stream`. A heartbeat ping is sent every 25 seconds to keep connections alive through proxies and load balancers.

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
| GET | `/hospitals` | Public | Get list of all hospitals (used for map + search) |
| PATCH | `/profile` | Protected | Update name, phone, avatar (file upload), address, location, coordinates |
| POST | `/forgot-password` | Public | Send password reset link to email |
| POST | `/reset-password` | Public | Reset password using token from email link |
| POST | `/set-password` | Protected | Set or change password (for Google OAuth users who have no password yet) |
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
| GET | `/search-donors` | Protected | Search donors by blood group, location, availability — returns map-ready coordinates |
| GET | `/active-requests-map` | Public | Get all active blood requests with coordinates for map display |

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
| POST | `/` | Protected | Hospital | Create a new blood drive event (with image upload) |
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
| Emergency SOS respond | ✅ | — | — |
| Generate donation certificate | ✅ | — | — |
| Manage blood inventory | — | — | ✅ |
| View inventory logs | — | — | ✅ |
| Create blood transfers | — | — | ✅ |
| Alert donors directly | — | — | ✅ |
| Create/manage events | — | — | ✅ |
| RSVP to events | ✅ | ✅ | — |
| Share community stories | ✅ | ✅ | ✅ |
| Edit profile | ✅ | ✅ | ✅ |
| View platform stats | ✅ | ✅ | ✅ |
| Search donors on map | ✅ | ✅ | ✅ |

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
coordinates       { lat: Number, lng: Number }
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
coordinates       { lat: Number, lng: Number }
contactPhone      String
image             String — uploaded event banner image path
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

**Important:** `http://localhost:5173` must be added to Authorized JavaScript Origins in Google Cloud Console for local dev to work.

---

## 📬 Email Notifications (Nodemailer + Gmail SMTP)

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Signup | New user | 6-digit OTP (expires 15 min) |
| Forgot password | User | Password reset link with token |
| Blood transfer created | Target hospital | Transfer details + Accept and Reject links (token-based, 7-day expiry) |
| Email-based blood request response | Donor | Accept/decline link for blood request (no login needed) |
| Low blood stock | Hospital | Alert when a blood group inventory drops below threshold |
| Near expiry | Hospital | Alert when blood units are approaching their expiry date |

---

## 🗺️ Maps Feature (Leaflet + react-leaflet)

The app has a full interactive map system:

- **Home page** — Shows nearby donors, hospitals, and active blood requests on a single map. Data is loaded lazily only when the map section scrolls into view (IntersectionObserver).
- **SearchDonors page** — Toggle between list view and map view. Donors shown as pins with blood group + distance info.
- **Dashboard / BloodRequest / Profile / Register / EditProfile / HospitalEditProfile / EmergencyRespond** — `MapPicker` component lets users pick their location by clicking on the map or using GPS.

`MapPicker` is **lazy loaded** on every page that uses it (`React.lazy` + `Suspense`) so Leaflet (~150KB) is never included in the initial bundle.

---

## 🔔 Push Notifications (Web Push API)

The `usePushNotifications` hook in `frontend/src/hooks/usePushNotifications.js` handles browser push notifications:

- Registers `public/sw.js` as a service worker
- Requests browser notification permission
- Used in `dashboard.jsx` and `HospitalDashboard.jsx` to display native OS push alerts alongside SSE events

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
                          →  SSE alert sent to all matching available donors
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
- Actions: `add`, `subtract`, `transfer_out`, `transfer_in`
- Automatic alerts sent when stock drops below threshold or approaches expiry
- One `Inventory` record per (hospital + blood group) combination

---

## 🔗 Full Connection Map

```
USER ACTION (browser)
       │
       ▼
FRONTEND (React @ localhost:5173)
  ├── api.ts     → All /api/* calls (JWT auto-attached, GET cached)
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
  │     Sends: OTPs, password resets, transfer emails, inventory alerts
  │
  └── Google OAuth 2.0 (accounts.google.com)
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
| `multer` | Avatar & event image upload handling |
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
| `leaflet` + `react-leaflet` | Interactive maps (lazy loaded) |
| `react-icons` | Icon library (Font Awesome, Material, etc.) |
| `tailwindcss` | Utility-first CSS framework |
| `vite` | Dev server and build tool (fast HMR + pre-bundling) |

---

## ⚡ Frontend Performance

The frontend has been optimized end-to-end:

- **Lazy loading** — `MapPicker` (Leaflet) is `React.lazy()` on all 10 pages that use it. Leaflet is never in the initial bundle.
- **Vite pre-bundling** — `vite optimize` pre-bundles all heavy deps into `node_modules/.vite/` before the server starts. First page load is instant.
- **Scroll-based API deferral** — Home page map data loads only when the map section is visible (IntersectionObserver). Stats, events, and stories are staggered with small timeouts.
- **Ref-based parallax** — Scroll animations on Home use `requestAnimationFrame` + direct DOM mutation via refs. No React re-renders on scroll.
- **Memoized context** — `AuthContext` wraps all functions in `useCallback` and the context value in `useMemo`. No unnecessary consumer re-renders.
- **rAF counter animation** — `useCounter` uses a single `requestAnimationFrame` loop instead of dozens of `setState` calls.
- **Passive scroll listeners** — All scroll event listeners use `{ passive: true }`.
- **GET deduplication** — `api.ts` deduplicates in-flight requests and short-caches GET responses.
- **Polling reduced** — Dashboard SSE handles real-time updates; polling fallback is every 120 seconds.

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
| `/search-donors` | SearchDonors.jsx | Protected | Search donors by blood group/location with map view |
| `/submit-story` | SubmitStory.jsx | Protected | Share a blood donation story |
| `/emergency-respond` | EmergencyRespond.jsx | Protected | Respond to emergency SOS requests |
| `/blood-transfer` | BloodTransfer.jsx | Public | Accept/reject blood transfer via email token |
| `/contact` | Contact.jsx | Public | Contact page |

---

## 🌐 CORS Configuration

The backend allows requests from:
```javascript
origin: [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:3000',   // fallback
  process.env.FRONTEND_URL   // Production URL from .env
],
credentials: true
```

The Vite dev server sets this header for Google OAuth popup compatibility:
```
Cross-Origin-Opener-Policy: unsafe-none
```

---

## 🐛 Troubleshooting

**Backend won't start**
- Check if MongoDB is running: `mongod`
- Verify `.env` file exists in `backend/` with all required fields
- Make sure port 3001 is not already in use: `lsof -i :3001`

**Frontend loads slowly on first start**
- Run `bash clean-start.sh` from the `frontend/` folder instead of `npm run dev`
- This clears the Vite cache, runs `vite optimize` to pre-bundle all deps, then starts the server

**OTP email not arriving**
- Ensure `EMAIL_PASS` is a Gmail **App Password** (not your regular password)
- Go to Google Account → Security → 2-Step Verification → App Passwords
- Check spam/junk folder

**Google OAuth not working (403 error)**
- `GOOGLE_CLIENT_ID` must match in both `backend/.env` and `frontend/.env`
- Go to Google Cloud Console → APIs & Services → Credentials → your OAuth Client ID
- Add `http://localhost:5173` to **Authorized JavaScript origins** → Save
- Changes take up to 5 minutes to propagate

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

**Map not loading**
- `leaflet` is lazy-loaded — wait for the `Suspense` fallback spinner to finish
- Check browser console for Leaflet tile loading errors (may need internet connection)

---

## 💡 Key Technical Decisions

- **Single `/dashboard` for donor + receiver** — same page, role-aware rendering using `isDonor` / `isReceiver` checks
- **Donation auto-recorded on accept** — no manual step needed; the system records it automatically
- **56-day cooldown auto-resets** on every `/me` call (every dashboard load)
- **Stories are upserted** — each user has at most one story, updated in place
- **Email-based blood request response** — donors can accept/reject via a tokenized email link without logging in
- **Blood transfers use one-time confirmation tokens** — 32-byte hex, 7-day expiry, sent by email
- **InventoryLog for full audit trail** — every inventory change is logged with before/after values
- **SSE over WebSocket** — simpler, one-directional server-to-client push without socket overhead
- **MapPicker always lazy** — Leaflet is a 150KB library; loading it eagerly would add 150KB to every initial page load
- **Vite `open: false`** — browser must not open before `vite optimize` finishes pre-bundling, or every dep transforms on-demand (causes slow blank-screen load)
- **LifeSaver modal stays open** after accepting donation — intentional, lets the donor read the details
- **Notifications polled every 120 seconds** as SSE backup (reduced from 30s since SSE handles real-time)
