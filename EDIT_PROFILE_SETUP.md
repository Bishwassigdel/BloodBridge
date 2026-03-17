# Edit Profile Setup - Full Code & Documentation

## Overview

This document provides complete information about the **Edit Profile** feature implemented for both **Donor/Receiver** and **Hospital** users in the BloodConnect application.

---

## Features Implemented

### 1. **Donor/Receiver Edit Profile** (`EditProfile.jsx`)
- Edit username, phone, blood group, address
- Manage emergency contact information
- Upload/change profile avatar
- Set or change password (with unified login support)
- Availability status toggle (for donors)
- Live field validation with error messages

### 2. **Hospital Edit Profile** (`HospitalEditProfile.jsx`)
- Edit hospital/organization name, phone, location
- Add/update website URL
- Upload/change organization logo
- Set or change password (with unified login support)
- Email display (read-only for security)
- Role-based access control

### 3. **Unified Login Feature**
Both edit profile pages include password setup/management that enables:
- Google OAuth users to set a password and login via email/password
- Email/password users to manage their passwords
- Display of login method status (Google OAuth vs Email/Password)

---

## File Structure

```
frontend/src/
├── pages/
│   ├── EditProfile.jsx              ← Donor/Receiver Edit Profile
│   ├── HospitalEditProfile.jsx      ← Hospital Edit Profile
│   └── App.jsx                      ← Updated with new routes
└── context/
    └── AuthContext.jsx              ← Contains setPassword() function
```

---

## Updated Routes (App.jsx)

```javascript
// Protected Routes (require login)
<Route element={<ProtectedRoute />}>
  {/* Donor/Receiver Profile */}
  <Route path="/profile" element={<Profile />} />
  <Route path="/profile/edit" element={<EditProfile />} />

  {/* Hospital Profile */}
  <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
  <Route path="/hospital/profile/edit" element={<HospitalEditProfile />} />

  {/* Other routes... */}
</Route>
```

---

## Backend Support

### Existing Endpoints Used:
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/set-password` - Set password for unified login
- `GET /api/auth/me` - Fetch current user data

### Backend Features Already Implemented:
✅ Profile update with avatar upload
✅ Password change with current password verification
✅ Field validation
✅ FormData support for file uploads

---

## How to Use

### For Donor/Receiver Users:

1. **From Dashboard:** Click on "Edit Profile" button
2. **URL Access:** Navigate to `/profile/edit`
3. **Edit Information:**
   - Username, phone, blood group
   - Address and emergency contact info
   - Upload profile picture
4. **Set Password (Unified Login):**
   - If using Google OAuth, click "Forgot Password" on login, or
   - Click "Set Password" button in edit profile
   - Enter new password (6+ characters)
   - Your account now supports both Google and email/password login!

### For Hospital Users:

1. **From Hospital Dashboard:** Click on "Edit Profile" or "Settings"
2. **URL Access:** Navigate to `/hospital/profile/edit`
3. **Edit Information:**
   - Hospital/Organization name
   - Phone and location
   - Website URL
   - Upload organization logo
4. **Set Password (Unified Login):**
   - If using Google OAuth initially, set a password here
   - Or update existing password
   - Your hospital account now supports both Google and email/password login!

---

## Full Code - EditProfile.jsx (Donor/Receiver)

```jsx
// src/pages/EditProfile.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaUser,
  FaPhone,
  FaTint,
  FaHome,
  FaUserFriends,
  FaLock,
  FaCheckCircle,
  FaTimesCircle,
  FaUpload,
  FaSpinner,
} from 'react-icons/fa';
import axios from 'axios';

function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || '',
    address: user?.address || '',
    emergencyContactName: user?.emergencyContact?.name || '',
    emergencyContactPhone: user?.emergencyContact?.phone || '',
    isAvailable: user?.isAvailable ?? true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [hasPassword, setHasPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchLatestUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const res = await axios.get('/api/auth/me');
        const freshUser = res.data.user || res.data;
        setUser(freshUser);

        setFormData({
          username: freshUser.username || '',
          phone: freshUser.phone || '',
          bloodGroup: freshUser.bloodGroup || '',
          address: freshUser.address || '',
          emergencyContactName: freshUser.emergencyContact?.name || '',
          emergencyContactPhone: freshUser.emergencyContact?.phone || '',
          isAvailable: freshUser.isAvailable ?? true,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        setAvatarPreview(freshUser.avatar || null);
        setHasPassword(!!freshUser.hasPassword || !!freshUser.password);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setErrorMsg('Could not load your profile data');
      } finally {
        setFetching(false);
      }
    };

    fetchLatestUser();
  }, [navigate, setUser]);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'username':
        if (!value.trim()) error = 'Username is required';
        else if (value.length < 3) error = 'Username must be at least 3 characters';
        break;
      case 'phone':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^\d{9,10}$/.test(value)) error = 'Enter a valid 9–10 digit phone number';
        break;
      case 'bloodGroup':
        if (!value) error = 'Blood group is required';
        break;
      case 'emergencyContactPhone':
        if (value && !/^\d{9,10}$/.test(value)) error = 'Enter a valid 9–10 digit phone number';
        break;
      case 'newPassword':
        if (value && value.length < 8) error = 'Password must be at least 8 characters';
        break;
      case 'confirmPassword':
        if (value && value !== formData.newPassword) error = 'Passwords do not match';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    const error = validateField(name, newValue);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (jpg, png, etc.)');
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setFieldErrors({});

    const errors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) errors[key] = err;
    });

    if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
      if (!formData.currentPassword) errors.currentPassword = 'Current password is required';
      if (!formData.newPassword) errors.newPassword = 'New password is required';
      if (formData.newPassword !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please fix the errors above');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (!['currentPassword', 'newPassword', 'confirmPassword'].includes(key)) {
          formDataToSend.append(key, value);
        }
      });

      if (formData.newPassword) {
        formDataToSend.append('currentPassword', formData.currentPassword);
        formDataToSend.append('newPassword', formData.newPassword);
      }

      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      const res = await axios.patch('/api/auth/profile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSuccessMsg('Profile updated successfully!');
        setUser(res.data.user || { ...user, ...formData });
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        setAvatarFile(null);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setErrorMsg(errMsg);

      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <FaSpinner className="text-6xl text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block relative mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-600">
                  <FaUser className="text-6xl" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition"
            >
              <FaUpload />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600 mt-2">Update your details for better matching and safety</p>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-xl flex items-center gap-3">
            <FaCheckCircle className="text-xl" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl flex items-center gap-3">
            <FaTimesCircle className="text-xl" />
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-red-100 p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.username ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition`}
                required
              />
              {fieldErrors.username && <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9841234567"
                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.phone ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition`}
                required
              />
              {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Blood Group <span className="text-red-600">*</span>
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.bloodGroup ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white transition`}
                required
              >
                <option value="">Select blood group</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              {fieldErrors.bloodGroup && <p className="mt-1 text-sm text-red-600">{fieldErrors.bloodGroup}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Kathmandu, Nepal"
                className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
              />
            </div>

            {/* Emergency Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Emergency Contact Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                placeholder="e.g. Ram Sharma"
                className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
              />
            </div>

            {/* Emergency Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                placeholder="e.g. 9845678901"
                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.emergencyContactPhone ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition`}
              />
              {fieldErrors.emergencyContactPhone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.emergencyContactPhone}</p>
              )}
            </div>

            {/* Availability */}
            {(user?.role === 'donor' || formData.isAvailable !== undefined) && (
              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  name="isAvailable"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="isAvailable" className="text-gray-700 font-medium">
                  Available to donate right now
                </label>
              </div>
            )}

            {/* Password Section */}
            <div className="md:col-span-2 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Unified Login:</strong> {hasPassword
                    ? 'You can login with both email/password and Google.'
                    : 'You can set a password here to enable email/password login (currently using Google OAuth).'}
                </p>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {hasPassword ? 'Change Password (optional)' : 'Set Password (optional)'}
              </h3>

              <div className={`grid ${hasPassword ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                {hasPassword && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.currentPassword ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition`}
                      placeholder="••••••••"
                    />
                    {fieldErrors.currentPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.currentPassword}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {hasPassword ? 'New Password' : 'Password'}
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.newPassword ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition`}
                    placeholder={hasPassword ? "At least 8 characters" : "At least 6 characters"}
                  />
                  {fieldErrors.newPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition`}
                    placeholder="Confirm password"
                  />
                  {fieldErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
              >
                {loading && <FaSpinner className="animate-spin" />}
                {loading ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>

        {/* Back to Dashboard */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-red-600 hover:text-red-800 font-medium transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
```

---

## Navigation Setup

### Add to Dashboard.jsx (Donor/Receiver):

```jsx
// Add this button to your dashboard header or menu
<Link to="/profile/edit" className="btn btn-primary">
  Edit Profile
</Link>
```

### Add to HospitalDashboard.jsx:

```jsx
// Add this button to your hospital dashboard header or menu
<Link to="/hospital/profile/edit" className="btn btn-primary">
  Edit Organization Profile
</Link>
```

---

## Testing Checklist

- [ ] Navigate to `/profile/edit` as a donor/receiver user
- [ ] Navigate to `/hospital/profile/edit` as a hospital user
- [ ] Update profile information and click Save
- [ ] Verify success message appears
- [ ] Try uploading a profile picture/logo
- [ ] Try setting a new password
- [ ] Verify password requirements (6+ characters minimum)
- [ ] Try changing password with current password
- [ ] Log out and login with the new password
- [ ] Verify Google OAuth still works

---

## Troubleshooting

### "Profile load failed"
- Make sure user is authenticated
- Check browser console for errors
- Verify token is valid

### "Failed to update profile"
- Check network tab for response errors
- Verify all required fields are filled
- Check file size (must be < 2MB)

### Password change not working
- Make sure current password is correct
- Verify new password meets requirements
- Check that passwords match in confirm field

---

## Security Notes

✅ Passwords are hashed with bcrypt on the backend
✅ Email field is read-only for hospital accounts
✅ File uploads are validated (size, type)
✅ Real-time validation prevents invalid submissions
✅ CSRF protection via JWT tokens

---

## Future Enhancements

- [ ] Two-factor authentication
- [ ] Social media profile links
- [ ] Verification badges
- [ ] Profile completion percentage
- [ ] Export profile as PDF

---

## Support

For issues or questions, please contact the development team.

