# BloodConnect — Full Project Guide

## 📋 Overview

BloodConnect is a full-stack blood donation platform connecting donors, receivers, and hospitals. It supports role-based access, real-time blood requests, donation tracking, hospital inventory management, inter-hospital blood transfers, community stories, and email notifications.

---

## 🏗️ Project Structure

```
BloodConnect/
├── backend/
│   ├── config/              # Database configuration
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   ├── bloodController.js
│   │   ├── donationController.js
│   │   ├── inventoryController.js
│   │   ├── notificationController.js
│   │   ├── storyController.js
│   │   └── transferController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT protection
│   │   ├── roleMiddleware.js     # Role-based access
│   │   └── multer.js             # Avatar upload
│   ├── models/
│   │   ├── user.js
│   │   ├── BloodRequest.js
│   │   ├── Donation.js
│   │   ├── Inventory.js
│   │   ├── InventoryLog.js
│   │   ├── Notification.js
│   │   ├── Story.js
│   │   └── BloodTransfer.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── blood.js
│   │   ├── notification.js
│   │   └── story.js
│   ├── public/uploads/avatars/   # Uploaded avatar images
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── VerifyEmail.jsx
        │   ├── ForgotPassword.jsx
        │   ├── ResetPassword.jsx
        │   ├── dashboard.jsx         # Donor / Receiver dashboard
        │   ├── HospitalDashboard.jsx
        │   ├── BloodRequest.jsx
        │   ├── BloodTransfer.jsx
        │   ├── Profile.jsx
        │   ├── EditProfile.jsx
        │   ├── HospitalEditProfile.jsx
        │   └── SearchDonors.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── Toast.jsx
        │   ├── Button.jsx
        │   ├── LifeSaverModal.jsx
        │   ├── DonorEligibility.jsx
        │   └── NotFound.jsx
        ├── context/
        ├── hooks/
        └── services/
            └── api.ts
```

---

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

**Packages installed:**
- `express` — Web framework
- `mongoose` — MongoDB ODM
- `bcryptjs` — Password hashing
- `jsonwebtoken` — JWT authentication
- `cors` — Cross-origin resource sharing
- `dotenv` — Environment variables
- `nodemailer` — Email sending (OTP, password reset, transfer notifications)
- `multer` — Avatar file uploads
- `compression` — HTTP response compression

---

### 2. Set Up Environment Variables

Create a `.env` file in the `backend/` folder:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/bloodconnect
JWT_SECRET=your-64-char-random-hex-string
PORT=3001
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
GOOGLE_CLIENT_ID=your-google-oauth-client-id
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

> **Note:** For `EMAIL_PASS`, use a Gmail App Password (not your regular password). Go to Google Account → Security → App Passwords to generate one.

---

### 3. Start MongoDB

```bash
mongod
```

---

### 4. Run the Backend

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

---

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

**Packages installed:**
- `react` + `react-dom` — UI framework
- `react-router-dom` — Client-side routing
- `axios` — HTTP client (auto-attaches auth token)
- `react-icons` — Icon library (Font Awesome)
- `tailwindcss` — Utility-first CSS
- `@react-oauth/google` — Google OAuth button
- `vite` — Build tool

---

### 2. Environment Variables (Optional)

Create a `.env` file in the `frontend/` folder:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_API_URL=http://localhost:3001
```

---

### 3. Run the Frontend

```bash
npm run dev
```

App runs on `http://localhost:5173`

---

## 🚀 All API Endpoints

### Auth Routes — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/signup` | Public | Register new user (donor / receiver / hospital) |
| POST | `/login` | Public | Login with email or phone + password |
| POST | `/verify-email` | Public | Verify account with OTP code |
| POST | `/resend-verification` | Public | Resend OTP to email |
| GET | `/me` | Protected | Get current logged-in user profile |
| PATCH | `/profile` | Protected | Update profile (name, phone, avatar, address, etc.) |
| POST | `/forgot-password` | Public | Send password reset link to email |
| POST | `/reset-password` | Public | Reset password using token from email |
| POST | `/set-password` | Protected | Set or change password (supports Google accounts) |
| POST | `/google` | Public | Google OAuth login / registration |

---

### Blood Routes — `/api/blood`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/request` | Protected | Create a blood request (notifies matching donors) |
| GET | `/my-requests` | Protected | Get all requests created by current user |
| GET | `/matching-requests` | Protected | Get pending requests matching donor's blood type |
| PATCH | `/:id/accept` | Protected | Donor accepts a request (auto-records donation, starts 56-day cooldown) |
| PATCH | `/:id/fulfill` | Protected | Receiver confirms blood was received |
| PATCH | `/:id/cancel` | Protected | Receiver cancels their pending request |
| PATCH | `/:id/edit` | Protected | Receiver edits their pending request |
| POST | `/donate` | Protected | Manually record a donation |
| GET | `/my-donations` | Protected | Get current user's donation history |

**Hospital-only blood routes:**

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/inventory` | Hospital | Add or subtract blood units from inventory |
| GET | `/inventory` | Hospital | Get current blood inventory for the hospital |
| GET | `/inventory-logs` | Hospital | Get last 50 inventory change logs |
| POST | `/transfer/create` | Hospital | Create a blood transfer request to another hospital |
| POST | `/transfer/accept` | Hospital | Accept incoming blood transfer (updates both inventories) |
| POST | `/transfer/reject` | Hospital | Reject incoming blood transfer |
| GET | `/transfer/history` | Hospital | Get full transfer history (sent and received) |

---

### Notification Routes — `/api/notifications`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Protected | Get last 30 notifications with unread count |
| PATCH | `/:id/read` | Protected | Mark a single notification as read |
| PATCH | `/read-all` | Protected | Mark all notifications as read |

---

### Story Routes — `/api/stories`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get all community stories (last 50) |
| POST | `/` | Protected | Share or update your story (title + message) |

---

## 👤 User Roles & Permissions

| Feature | Donor | Receiver | Hospital |
|---------|-------|----------|----------|
| Create blood request | ✅ | ✅ | ✅ |
| View matching requests | ✅ | — | — |
| Accept blood request | ✅ | — | — |
| Cancel / Edit own request | ✅ | ✅ | ✅ |
| Mark request fulfilled | — | ✅ | — |
| View donation history | ✅ | — | — |
| Manage inventory | — | — | ✅ |
| Create blood transfers | — | — | ✅ |
| Share stories | ✅ | ✅ | ✅ |
| Edit profile | ✅ | ✅ | ✅ |

---

## 📊 Data Models

### User
```
username, email, password (hashed), googleId, bloodGroup,
phone, location, role (donor/receiver/hospital), isAvailable,
lastDonation, hospitalName, avatar, address, emergencyContact
{name, phone}, isVerified, verificationCode,
verificationCodeExpires, resetPasswordToken, resetPasswordExpire
```

### BloodRequest
```
requester (ref User), hospital, bloodGroup, units, urgency
(normal/emergency), location, contactPhone, note, status
(pending/accepted/fulfilled/cancelled), acceptedBy (ref User)
```

### Donation
```
donor (ref User), hospital, bloodGroup, units, donatedAt,
notes, status (Completed)
```

### Inventory
```
hospital (ref User), bloodGroup, units, earliestExpiryDate,
lastRestockDate, lastUpdated
Unique index: (hospital + bloodGroup)
```

### InventoryLog
```
hospital, bloodGroup, action (add/subtract/transfer_out/
transfer_in), units, performedBy, reason, beforeUnits,
afterUnits, expiryDate, transferToHospital, transferFromHospital
```

### Notification
```
user (ref User), message, type (new_blood_request/request_accepted/
request_fulfilled/request_cancelled/general/low_stock/near_expiry/
critical_inventory), read, data (flexible), severity (low/medium/high)
```

### Story
```
author (ref User), name, role, title, message (min 20 chars),
location, avatar
```

### BloodTransfer
```
fromHospitalId, fromHospitalName, toHospitalEmail, toHospitalId,
toHospitalName, bloodGroup, units, reason, status
(pending/accepted/rejected), confirmationToken (7-day expiry),
rejectionReason
```

---

## 🔑 Authentication Flow

```
1. Signup  →  Account created (unverified)  →  OTP emailed
2. OTP entry  →  Email verified  →  JWT token issued
3. Login  →  Credentials checked  →  JWT token issued
4. All protected routes require: Authorization: Bearer <token>
5. Forgot password  →  Reset link emailed  →  Token verified  →  Password updated
6. Google OAuth  →  Token verified with Google  →  Account created/found  →  JWT issued
```

---

## 🩸 Donation Cooldown System

- When a donor **accepts** a blood request, a donation is auto-recorded and a **56-day cooldown** begins.
- `isAvailable` is set to `false` automatically.
- On every dashboard load, the backend checks if 56 days have passed and **auto-resets** `isAvailable` to `true`.
- The frontend shows a countdown to next eligible donation date.
- Donors in cooldown can still view requests but cannot accept them.

---

## 📬 Email Notifications Sent By The System

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Signup | New user | OTP verification code (expires in 15 minutes) |
| Forgot password | User | Password reset link (with token) |
| Blood transfer created | Target hospital | Transfer request details + accept/reject link |
| Low blood stock | Hospital | Alert when inventory drops below threshold |
| Near expiry | Hospital | Alert when blood is approaching expiry date |

---

## 📱 Frontend Pages

### Public Pages
- **`/`** — Landing page (hero, features, how-it-works, events, map, CTA)
- **`/login`** — Email/phone + password login with Google OAuth
- **`/register`** — Multi-role signup (donor, receiver, hospital) with blood group selector
- **`/verify-email`** — OTP code entry with resend option
- **`/forgot-password`** — Password recovery request form
- **`/reset-password`** — New password entry (token from email)

### Protected Pages (All Roles)
- **`/dashboard`** — Main dashboard for donors and receivers
  - Stats cards (unread notifications, pending matches, total donations / lives helped for donors; total requests / fulfilled for receivers)
  - Request Blood form (urgency toggle, blood group picker, unit stepper)
  - Matching Requests panel (for donors: accept / decline)
  - My Requests panel (for receivers: status tracker, edit, cancel, donor contact info)
  - Donation History (for donors)
  - Notifications panel (with mark-read / mark-all-read)
  - Stories panel (share story + community feed)
- **`/hospital`** — Hospital dashboard
  - Blood inventory management
  - Inventory logs
  - Blood transfer management
- **`/profile`** — View profile
- **`/profile/edit`** — Edit profile (avatar, name, phone, address, emergency contact, password)
- **`/hospital/edit`** — Hospital profile editor
- **`/search-donors`** — Search and filter donors by blood group and location
- **`/blood-transfer`** — Accept or reject a hospital-to-hospital blood transfer (token-based)

---

## 🧪 Testing Guide

### 1. Register & Verify (All Roles)

**Donor:**
1. Go to `/register`
2. Select **Donor**, fill in username, email, blood group, phone, location, password
3. Submit → you'll be redirected to `/verify-email`
4. Check your email for the OTP and enter it
5. You'll be logged in and redirected to `/dashboard`

**Receiver:**
1. Same steps as above, select **Receiver** instead
2. Receivers also land on `/dashboard` but see "My Requests" instead of "Matching Requests"

**Hospital:**
1. Select **Hospital**, fill in hospital name, email, phone, location, password
2. Verify OTP
3. Redirected to `/hospital` dashboard

---

### 2. Google OAuth Login

1. Go to `/login` or `/register`
2. Click **Continue with Google**
3. On first login, select your role (donor / receiver / hospital)
4. Account is created and you're logged in immediately (no OTP needed)

---

### 3. Blood Request Flow (Donor + Receiver)

**As Receiver — Create a Request:**
1. Login as receiver → Dashboard
2. Click **Request Blood** in sidebar
3. Choose urgency (Normal / Emergency 🚨)
4. Select blood group, set units (1–10), enter hospital, location, phone, note
5. Submit — matching donors are notified instantly

**As Donor — Accept a Request:**
1. Login as donor → Dashboard
2. Click **Matching Requests** in sidebar
3. See requests matching your blood group, sorted by emergency first
4. Click **Accept & Donate** — a celebration modal appears
5. Modal stays open until you manually close it (no auto-close)
6. Your 56-day cooldown begins automatically

**As Receiver — Track & Confirm:**
1. Go to **My Requests**
2. See status tracker: Pending → Accepted → Done
3. When a donor accepts, their name, phone, and email appear as a contact card with a **Call** button
4. Once blood is received, click **I Received the Blood ✓**
5. Donor receives a thank-you notification

**Edit a Pending Request:**
1. In My Requests, find a pending request
2. Click **Edit** — an inline form expands on the card
3. Update hospital, units, location, urgency, phone, or note
4. Click **Save Changes**

**Cancel a Pending Request:**
1. In My Requests, click **Cancel** on any pending request
2. Status changes to cancelled immediately

---

### 4. Donation History (Donors)

1. Login as donor → Dashboard
2. Click **History** in sidebar
3. See all past donations with date, hospital, blood group, and units

---

### 5. Notifications

1. Open **Notifications** panel in sidebar
2. Unread notifications are highlighted with a **NEW** badge
3. Click a notification to mark it as read
4. Click **Mark all read** to clear all at once
5. New blood request notifications show blood group, hospital, units, location, and a tap-to-call phone link

---

### 6. Stories

1. Open **Stories** panel in sidebar
2. Fill in a title and your story (minimum 20 characters)
3. Click **Share My Story**
4. Your story appears in the community feed with your name, role, and location
5. All users (including the public) can read stories

---

### 7. Hospital Inventory Management

1. Login as hospital → `/hospital` dashboard
2. **Add blood units:**
   - Select blood group, enter units to add, set expiry date
   - Click Add — units are added to inventory
3. **Subtract blood units:**
   - Select blood group, enter units used, enter reason
   - Click Subtract — units are deducted
4. **View logs:**
   - Switch to Inventory Logs tab
   - See full audit trail (who changed what, before/after values)
5. Automatic alerts are sent when inventory is low or blood is near expiry

---

### 8. Hospital Blood Transfers

**Sending hospital:**
1. Go to Blood Transfer section in hospital dashboard
2. Enter recipient hospital email, blood group, units, reason
3. Submit — an email with accept/reject link is sent to the target hospital

**Receiving hospital:**
1. Click the link in the email
2. Redirected to `/blood-transfer?token=...`
3. Review transfer details and click **Accept** or **Reject**
4. On accept: both hospitals' inventories are updated automatically

---

### 9. Forgot Password

1. Go to `/forgot-password`
2. Enter your registered email
3. Click **Send Reset Link**
4. Check email → click the reset link
5. Enter new password on `/reset-password`
6. Login with new password

---

### 10. Edit Profile

1. Click **Edit Profile** in dashboard sidebar
2. Upload a new avatar (max 2MB, images only)
3. Update name, phone, location, address
4. Add or update emergency contact name and phone
5. Change password (requires current password, or just new password if set via Google)
6. Save changes — updates appear immediately

---

### 11. Search Donors

1. Go to `/search-donors`
2. Filter by blood group and/or location
3. See available donors with contact information

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check if MongoDB is running: `mongod`
- Verify `.env` file exists in `backend/`
- Make sure port 3001 is not in use

**OTP email not arriving:**
- Check `EMAIL_USER` and `EMAIL_PASS` in `.env`
- Make sure you're using a Gmail **App Password**, not your account password
- Check spam folder

**Google login not working:**
- Verify `GOOGLE_CLIENT_ID` matches in both `backend/.env` and `frontend/.env`
- Check that your domain is in the Google Cloud Console allowed origins

**Frontend can't connect to backend:**
- Make sure backend is running on port 3001
- Check browser console for CORS errors
- Verify `VITE_API_URL` or axios `baseURL` matches backend port

**Avatar not uploading:**
- File must be an image (jpg, png, webp, etc.)
- Max file size is 2MB
- `backend/public/uploads/avatars/` folder must exist

**Blood request not notifying donors:**
- Donor must have the same `bloodGroup` as the request
- Donor's `isAvailable` must be `true`
- Donor must not be the same user as the requester

---

## 💡 Key Technical Decisions

- **Single dashboard** for donor and receiver — same page, role-aware rendering using `isDonor` / `isReceiver` flags
- **56-day cooldown** auto-resets on every dashboard load via `autoResetAvailability()`
- **Donation auto-recorded** when a donor accepts a request (no separate step needed)
- **LifeSaver modal** stays open indefinitely after accepting — no auto-close
- **Stories are upserted** — each user can only have one active story (updated in place)
- **Blood transfers** use one-time confirmation tokens (32-byte hex, 7-day expiry) sent by email
- **Inventory logs** maintain a full audit trail of every add/subtract/transfer action
- **Notifications** are fetched every 30 seconds in the background for near-real-time updates

---

## 📦 Running Both Servers Together

Open two terminals:

```bash
# Terminal 1 — Backend
cd BloodConnect/backend
npm run dev

# Terminal 2 — Frontend
cd BloodConnect/frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.
