# Edit Profile Feature - Complete Testing Guide

## Overview
This guide provides step-by-step instructions to test the universal Edit Profile feature that works for all user types (Donor, Receiver, Hospital).

**Status:** ✅ Implementation Complete
- Frontend: EditProfile.jsx (universal component)
- Backend: updateProfile() endpoint with password management
- Context: AuthContext.jsx exports setUser for state management

---

## Pre-Testing Checklist

### Requirements
- ✅ MongoDB running (`brew services start mongodb-community`)
- ✅ Backend server running (port 3001)
- ✅ Frontend development server running (port 5173)
- ✅ Test user accounts created (at least one of each role)

### Quick Start
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - MongoDB (if not auto-running)
brew services start mongodb-community
```

---

## Test Cases

### Test 1: Edit Profile Page Loads Without Errors
**User Type:** Any (Donor, Receiver, Hospital)
**Expected Result:** Page loads with user's current data pre-filled

#### Steps:
1. Login to the application (email/password or Google)
2. Navigate to Dashboard (Donor/Receiver) or Hospital Dashboard
3. Click "Edit Profile" button
4. ✅ **Verify:**
   - Page loads without console errors (check browser console - F12)
   - Avatar displays correctly
   - Form fields are pre-filled with current user data
   - Correct role-specific fields are shown:
     - **Donor/Receiver:** Blood Group, Address, Emergency Contact
     - **Hospital:** Hospital/Organization Name, Location, Website

#### Error to Watch For:
```
❌ "setUser is not a function" - Already fixed in AuthContext.jsx
❌ 401 Unauthorized - Token may be expired, re-login
❌ "Could not load profile data" - Backend may be down
```

---

### Test 2: Donor/Receiver Profile Update
**User Type:** Donor or Receiver
**Test Scope:** Update basic profile information without password

#### Steps:
1. Login as a Donor or Receiver user
2. Navigate to Edit Profile
3. Update the following fields:
   - **Username:** Change to new name (e.g., "John Smith Updated")
   - **Phone:** Change to valid 10-digit number (e.g., "9841234567")
   - **Blood Group:** Select different blood group
   - **Address:** Update address (e.g., "New Kathmandu, Nepal")
4. **Leave password fields empty**
5. Click "Save Profile"

#### ✅ Expected Results:
- Green success message: "Profile updated successfully!"
- Page redirects to Dashboard after 2 seconds
- All changes persist after page reload

#### Validation Rules to Test:
| Field | Valid | Invalid | Message |
|-------|-------|---------|---------|
| Username | "John Doe" | "" or "JD" | "Name must be at least 3 characters" |
| Phone | "9841234567" | "984123" or "abcd" | "Enter a valid 9–10 digit phone number" |
| Blood Group | "O+", "AB-" | (empty for donor) | "Blood group is required" |
| Address | "Kathmandu" | (no validation limit) | (optional field) |

---

### Test 3: Hospital Profile Update
**User Type:** Hospital
**Test Scope:** Update hospital-specific fields

#### Steps:
1. Login as Hospital user
2. Navigate to Edit Profile
3. Update fields:
   - **Hospital/Organization Name:** Change name (required)
   - **Phone:** Change to valid 10-digit number (required)
   - **Location:** Update location (optional)
   - **Website:** Update URL like "https://hospital.com" (optional, must start with http/https)
4. **Leave password fields empty**
5. Click "Save Profile"

#### ✅ Expected Results:
- Success message displays
- Page redirects to Hospital Dashboard after 2 seconds
- Changes persist after reload

#### Hospital-Specific Validations:
| Field | Valid | Invalid | Message |
|-------|-------|---------|---------|
| Hospital Name | "Apollo Hospital" | "HD" | "Name must be at least 3 characters" |
| Phone | "9841234567" | "984" | "Enter a valid 9–10 digit phone number" |
| Website | "https://apollo.com" | "apollo.com" | "Enter a valid URL (e.g., https://example.com)" |

---

### Test 4: Password Setup (Google OAuth User)
**User Type:** Donor/Receiver or Hospital who registered via Google
**Prerequisite:** Account created with Google OAuth (no password set initially)

#### Steps:
1. Login with Google button
2. Go to Edit Profile
3. In "Password Management" section, you should see:
   - ✅ "Set Password" section (because account has no password yet)
   - ❌ NOT "Change Password" section
4. Enter:
   - **New Password:** "MyNewPass123" (minimum 6 characters)
   - **Confirm Password:** "MyNewPass123"
5. Update other profile fields as needed
6. Click "Save Profile"

#### ✅ Expected Results:
- Success message: "Profile updated successfully!"
- Backend console logs: `Backend → Password updated for user: [userId]`
- **Critical Test:** Logout and login with email/password using new credentials

#### Validation for Password Setup:
| Scenario | Input | Expected | Message |
|----------|-------|----------|---------|
| Too short | "Pass12" | ❌ Rejected | "Password must be at least 6 characters" |
| Valid | "ValidPass123" | ✅ Accepted | Success message |
| Mismatched | "Pass123" / "Pass124" | ❌ Rejected | "Passwords do not match" |
| Empty confirm | "Pass123" / "" | ❌ Rejected | "Passwords do not match" |

---

### Test 5: Password Change (Email/Password User)
**User Type:** Any user who has a password (registered with email or set one via Test 4)
**Prerequisite:** Account has existing password

#### Steps:
1. Login with email/password
2. Go to Edit Profile
3. In "Password Management" section, you should see:
   - ✅ "Change Password" section (because account already has password)
   - Fields for: Current Password, New Password, Confirm Password
4. Enter:
   - **Current Password:** Your actual current password
   - **New Password:** "NewPass8Chars!" (minimum 8 characters for change)
   - **Confirm Password:** "NewPass8Chars!"
5. Update other fields if desired
6. Click "Save Profile"

#### ✅ Expected Results:
- Success message displays
- Backend console logs password update
- Password fields clear automatically
- Can logout and login with new password

#### Validation for Password Change:
| Scenario | Current | New | Expected | Message |
|----------|---------|-----|----------|---------|
| Wrong current | "WrongPass" | "Valid123!" | ❌ Rejected | "Current password incorrect" |
| Missing current | "" | "Valid123!" | ❌ Rejected | "Current password is required" |
| New too short | "CurrentPass" | "Pass5" | ❌ Rejected | "Password must be at least 8 characters" |
| Mismatch | "CurrentPass" | "Valid123!" / "Valid124!" | ❌ Rejected | "Passwords do not match" |
| Valid | "CurrentPass" | "NewPass8Chars!" | ✅ Accepted | Success message |

---

### Test 6: Avatar Upload
**User Type:** Any
**Test Scope:** Profile picture upload with validation

#### Steps:
1. Go to Edit Profile page
2. Click the **upload icon** on the avatar circle
3. Select an image file from your computer
4. Verify preview updates immediately
5. Click "Save Profile"

#### ✅ Expected Results:
- Avatar preview shows selected image
- After save, avatar persists across page reloads
- Avatar appears in dashboard sidebar

#### Upload Validation to Test:
| Test Case | File | Size | Expected |
|-----------|------|------|----------|
| Valid image | .png file | < 2MB | ✅ Uploads |
| Valid image | .jpg file | < 2MB | ✅ Uploads |
| File too large | .png file | 5MB | ❌ Rejected: "Image size should be less than 2MB" |
| Non-image | .pdf file | 100KB | ❌ Rejected: "Please upload an image file" |

---

### Test 7: Emergency Contact (Donor/Receiver Only)
**User Type:** Donor or Receiver
**Test Scope:** Emergency contact update

#### Steps:
1. Go to Edit Profile (Donor/Receiver)
2. Fill in Emergency Contact fields:
   - **Emergency Contact Name:** "Ram Sharma"
   - **Emergency Contact Phone:** "9845678901"
3. Update other fields as needed
4. Click "Save Profile"

#### ✅ Expected Results:
- Emergency contact saves successfully
- Displays correctly in profile view
- Phone validation applies (9-10 digits)

#### Validations:
- Phone must be 9-10 digits if provided
- Empty name + filled phone = partially saves (name is optional)
- Both fields are optional

---

### Test 8: Error Handling & Edge Cases
**Scenario:** Verify proper error handling

#### Test Case 8.1: Invalid Email Lookup
**Steps:**
1. Clear browser localStorage
2. Manually modify token in localStorage to invalid value
3. Try to navigate to Edit Profile
4. ✅ **Expected:** Should redirect to login or show 401 error

#### Test Case 8.2: Multiple Field Errors
**Steps:**
1. Go to Edit Profile
2. Clear all required fields
3. Click "Save Profile"
4. ✅ **Expected:** All errors show with red borders, messages appear

#### Test Case 8.3: Network Error
**Steps:**
1. Start with Edit Profile page loaded
2. Disable network in DevTools (F12 → Network → Offline)
3. Try to save profile
4. ✅ **Expected:** Error message about network connectivity

---

## Browser Console Checks

### ✅ Good Logs (When Loading Edit Profile)
```javascript
[Auth Init] Loaded from storage → role: donor
[Auth Init] /me success → role: donor
[Axios Request] → /api/auth/me | Token (first 20): ...
[Axios Request] → /api/auth/profile | Token (first 20): ...
Backend → Password updated for user: [userId]
```

### ❌ Bad Logs (Errors to Investigate)
```javascript
setUser is not a function  // ← Fix applied: AuthContext now exports setUser
Failed to load profile: Error...  // ← Backend connection issue
401 Unauthorized  // ← Token expired or invalid
[Update profile error]: ...  // ← Backend validation failure
```

---

## Complete End-to-End Flow Tests

### Flow 1: Google User → Setup Password → Email Login
**Timeline:** ~5 minutes

1. ✅ Register with Google (as Donor/Receiver)
2. ✅ Go to Edit Profile
3. ✅ Set a password (6+ chars)
4. ✅ Save profile
5. ✅ Logout
6. ✅ Login with email/password using new password
7. ✅ Verify you're logged in with correct user data

### Flow 2: Email User → Change Password → Logout → Login
**Timeline:** ~3 minutes

1. ✅ Login with email/password
2. ✅ Go to Edit Profile
3. ✅ Change password (8+ chars, with current password)
4. ✅ Save profile
5. ✅ Logout
6. ✅ Login with old password → Should fail ❌
7. ✅ Login with new password → Should succeed ✅

### Flow 3: Hospital Update All Fields
**Timeline:** ~3 minutes

1. ✅ Login as Hospital
2. ✅ Go to Edit Profile
3. ✅ Update: Hospital Name, Phone, Location, Website
4. ✅ Upload a logo/avatar
5. ✅ Save profile
6. ✅ Return to Hospital Dashboard
7. ✅ Verify all changes display correctly

---

## Performance Checks

### Response Times
- Edit Profile page load: < 2 seconds
- Profile save: < 1 second
- Avatar upload: < 3 seconds (depending on file size)

### Network Requests (F12 → Network Tab)
When loading Edit Profile:
```
GET /api/auth/me          → 200 OK (< 500ms)
```

When saving profile:
```
PATCH /api/auth/profile   → 200 OK (< 1s)
```

---

## Rollback Procedures

### If something breaks during testing:

**Frontend Reset:**
```bash
# Clear browser data
1. F12 → Application → Storage → Clear All
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

**Backend Reset:**
```bash
# If getting weird validation errors
1. Restart MongoDB: brew services restart mongodb-community
2. Restart backend: npm start
```

**Database Reset (⚠️ Destructive - Use Only If Needed):**
```bash
# Delete database and start fresh
1. mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --logappend --auth
2. Or use MongoDB Compass to delete collections manually
```

---

## Troubleshooting Reference

| Issue | Cause | Solution |
|-------|-------|----------|
| "setUser is not a function" | AuthContext not exporting setUser | ✅ Fixed in commit - AuthContext line 237 |
| "Failed to update profile" | Backend error | Check backend logs, ensure MongoDB is running |
| Avatar doesn't upload | File validation failed | Check file size (< 2MB) and type (image only) |
| Password change doesn't work | Wrong current password | Verify you're entering correct existing password |
| Redirect doesn't work after save | Role detection issue | Check user.role in localStorage |
| 401 Unauthorized | Invalid or expired token | Re-login and try again |

---

## Test Coverage Summary

| Feature | Status | Tests |
|---------|--------|-------|
| Page Load | ✅ Implemented | Load without errors, pre-fill data |
| Donor Update | ✅ Implemented | Blood group, address, emergency contact |
| Hospital Update | ✅ Implemented | Organization name, location, website |
| Password Setup | ✅ Implemented | 6+ chars, Google → email/password flow |
| Password Change | ✅ Implemented | 8+ chars, verify current password |
| Avatar Upload | ✅ Implemented | File validation, preview, persistence |
| Form Validation | ✅ Implemented | Real-time field validation |
| Error Handling | ✅ Implemented | Display errors, prevent submission |
| Redirects | ✅ Implemented | Post-save redirection to correct dashboard |

---

## Sign-Off

Once you've completed all test cases above, the Edit Profile feature is fully validated:

- ✅ Frontend loads without errors
- ✅ All form validations work correctly
- ✅ Profile updates persist in database
- ✅ Password management (setup and change) works
- ✅ Avatar upload validates and persists
- ✅ Proper error messages display
- ✅ User redirects to correct dashboard

**Feature Status:** 🚀 Ready for Production
