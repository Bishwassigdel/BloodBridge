# Backend Edit Profile - Complete Documentation

## Overview

The backend fully supports the universal Edit Profile feature for all user types (Donor, Receiver, Hospital). This document explains all backend endpoints and how they work together.

---

## Backend Endpoints

### 1. **Get Current User** (Required)
```
GET /api/auth/me
```
**Purpose:** Fetch current user data including profile info and password status

**Request:**
- No body required
- Authorization: Bearer token (in header)

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "John Doe",
    "email": "john@example.com",
    "phone": "9841234567",
    "role": "donor",
    "bloodGroup": "O+",
    "address": "Kathmandu, Nepal",
    "avatar": "/uploads/avatars/...",
    "emergencyContact": {
      "name": "Ram Sharma",
      "phone": "9845678901"
    },
    "isAvailable": true,
    "hospitalName": null,
    "website": null,
    "location": null
  }
}
```

---

### 2. **Update Profile** (Main Endpoint)
```
PATCH /api/auth/profile
```

**Purpose:** Update user profile information and/or password

**Request Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (Form Data):**

#### For Donor/Receiver:
```
- username: string (required)
- phone: string (required, 9-10 digits)
- bloodGroup: string (required for donors/receivers, one of: A+, A-, B+, B-, O+, O-, AB+, AB-)
- address: string (optional)
- emergencyContactName: string (optional)
- emergencyContactPhone: string (optional, 9-10 digits if provided)
- isAvailable: boolean (optional, for donors)
- avatar: file (optional, image file max 2MB)
- newPassword: string (optional, min 6 chars for setup, 8 for change)
- currentPassword: string (required if hasPassword && newPassword provided)
```

#### For Hospital:
```
- hospitalName: string (required)
- phone: string (required, 9-10 digits)
- location: string (optional)
- website: string (optional, valid URL format)
- avatar: file (optional, image file max 2MB)
- newPassword: string (optional, min 6 chars for setup, 8 for change)
- currentPassword: string (required if hasPassword && newPassword provided)
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    // Updated user object
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

**Possible Errors:**
- `"Current password required"` - User has password but didn't provide current password
- `"Current password incorrect"` - Wrong current password provided
- `"Password must be at least 6 characters"` - Password too short
- `"User not found"` - User doesn't exist (shouldn't happen)

---

### 3. **Set Password** (Optional Endpoint)
```
POST /api/auth/set-password
```

**Purpose:** Allow authenticated users to set a password on their account (alternative to updating via profile)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "password": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password set successfully! You can now login with email/password."
}
```

---

## Password Management Logic

### Password Setup Flow (Google OAuth → Email/Password)

**Scenario:** User registered with Google, wants to enable email/password login

1. Frontend shows "Set Password" section
2. User enters new password (6+ characters)
3. Frontend sends `PATCH /api/auth/profile` with `newPassword` only
4. Backend:
   - Checks if user has existing password → NO
   - Hashes new password
   - Updates user.password in database
   - Returns success

### Password Change Flow (Email/Password → New Email/Password)

**Scenario:** User already has password, wants to change it

1. Frontend shows "Change Password" section with 3 fields
2. User enters current password + new password
3. Frontend sends `PATCH /api/auth/profile` with `currentPassword` and `newPassword`
4. Backend:
   - Checks if user has existing password → YES
   - Validates current password with bcrypt.compare()
   - If matches: hashes new password and updates
   - If doesn't match: returns error

---

## Database Schema (User Model)

```javascript
{
  // Common fields
  username: String,
  email: String (unique),
  password: String (optional, select: false),  // Not returned in GET requests
  googleId: String,
  avatar: String,
  role: String (enum: ['donor', 'receiver', 'hospital']),

  // Donor/Receiver fields
  bloodGroup: String,
  address: String,
  emergencyContact: {
    name: String,
    phone: String
  },
  isAvailable: Boolean,

  // Hospital fields
  hospitalName: String,
  website: String,
  location: String,

  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Email verification fields
  isVerified: Boolean,
  verificationCode: String,
  verificationCodeExpires: Date,

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Implementation Details

### Password Hashing
- Algorithm: bcryptjs
- Rounds: 10
- Used in both `updateProfile` and `setPassword` functions

### File Upload Handling
- Multer middleware for avatar uploads
- Storage path: `public/uploads/avatars/`
- File size limit: 2MB
- Allowed types: Images only (jpg, png, etc.)
- Returned path: `/uploads/avatars/{filename}`

### Validation
- Email: No duplicates (except on own account)
- Phone: 9-10 digits
- Password: 6 characters minimum (setup), 8 characters (change)
- Blood Group: Enum validation (A+, A-, B+, B-, O+, O-, AB+, AB-)
- Website URL: Valid HTTP/HTTPS URL format

---

## Error Handling

### Try-Catch Flow
1. All endpoints wrapped in try-catch
2. Validation errors → 400 Bad Request
3. Authentication errors → 401 Unauthorized
4. Server errors → 500 Internal Server Error
5. Mongoose validation errors → 400 with error message

### Console Logging
- `console.log('Backend → Password updated for user:', userId)` - When password is set/changed
- `console.error('Update profile error:', err)` - On errors (for debugging)

---

## Security Features

✅ **Password Security:**
- Passwords hashed with bcrypt before storage
- Never returned in GET requests (select: false)
- Current password verified with bcrypt.compare()
- New passwords validated for length

✅ **Access Control:**
- All endpoints require authentication (Bearer token)
- Users can only update their own profile
- Email cannot be changed (read-only)
- Role cannot be changed (read-only)

✅ **File Upload Security:**
- File size validation (max 2MB)
- MIME type validation (images only)
- Secure filename generation with user ID + timestamp

---

## Testing the Backend

### Test with cURL

**Get Current User:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/auth/me
```

**Update Profile (Donor/Receiver):**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "username=John Doe" \
  -F "phone=9841234567" \
  -F "bloodGroup=O+" \
  -F "address=Kathmandu, Nepal" \
  http://localhost:3001/api/auth/profile
```

**Update Profile with Password:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "username=John Doe" \
  -F "phone=9841234567" \
  -F "bloodGroup=O+" \
  -F "newPassword=MyPassword123" \
  -F "currentPassword=OldPassword123" \
  http://localhost:3001/api/auth/profile
```

**Set Password (First Time):**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "username=Hospital Name" \
  -F "newPassword=MyPassword123" \
  http://localhost:3001/api/auth/profile
```

---

## Troubleshooting

### "Current password required" Error
**Cause:** User trying to change password without providing current password
**Solution:** User must provide current password if they already have one

### "Current password incorrect" Error
**Cause:** Wrong current password provided
**Solution:** User should check they entered correct current password

### "Password must be at least X characters" Error
**Cause:** Password is too short
**Solution:** User must use minimum 6 chars for setup, 8 chars for change

### "File upload failed" Error
**Cause:** File is not an image or exceeds 2MB
**Solution:** Upload a valid image file (jpg, png) under 2MB

### 401 Unauthorized
**Cause:** Missing or invalid token
**Solution:** Ensure Bearer token is provided in Authorization header

---

## Backend Flow Diagram

```
POST /api/auth/profile (Multipart Form Data)
    ↓
Middleware: authenticate user (verify token)
    ↓
Middleware: Multer (handle file upload)
    ↓
updateProfile Controller
    ├─ Prepare updates object
    ├─ Handle avatar upload (if provided)
    ├─ Delete protected fields (email, role)
    └─ If newPassword provided:
       ├─ Validate password length
       ├─ Get user from DB with password field
       ├─ If user.password exists:
       │  ├─ Verify currentPassword
       │  └─ Hash new password
       └─ Else (first time):
          └─ Hash new password
    ↓
findByIdAndUpdate (MongoDB)
    ├─ Apply all updates
    ├─ Run validators
    └─ Return updated user
    ↓
Response: 200 OK with updated user data
```

---

## Future Enhancements

- [ ] Add profile picture verification (prevent inappropriate images)
- [ ] Add email verification before allowing email change
- [ ] Add password strength requirements (uppercase, special chars)
- [ ] Add profile completion percentage tracking
- [ ] Add audit logging for profile changes
- [ ] Add profile history/versioning

---

## Support

For issues or questions about the backend implementation:
1. Check the console logs in the backend terminal
2. Verify the request format matches the documentation
3. Ensure authentication token is valid
4. Check database connectivity (MongoDB)

