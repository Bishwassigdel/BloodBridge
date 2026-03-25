// src/pages/EditProfile.jsx - Universal Edit Profile for All User Types
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
  FaHospital,
  FaMapMarkerAlt,
  FaGlobe,
} from 'react-icons/fa';
import axios from 'axios';

function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Determine user role
  const userRole = user?.role?.toLowerCase() || 'receiver';
  const isDonorOrReceiver = ['donor', 'receiver'].includes(userRole);
  const isHospital = userRole === 'hospital';

  const [formData, setFormData] = useState({
    // Common fields
    username: user?.username || '',
    phone: user?.phone || '',
    email: user?.email || '',
    location: user?.location || '',

    // Donor/Receiver specific
    bloodGroup: user?.bloodGroup || '',
    address: user?.address || '',
    emergencyContactName: user?.emergencyContact?.name || '',
    emergencyContactPhone: user?.emergencyContact?.phone || '',
    isAvailable: user?.isAvailable ?? true,

    // Hospital specific
    hospitalName: user?.hospitalName || user?.username || '',
    website: user?.website || '',

    // Password fields
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

  // Fetch latest user data on mount
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
          email: freshUser.email || '',
          location: freshUser.location || '',
          bloodGroup: freshUser.bloodGroup || '',
          address: freshUser.address || '',
          emergencyContactName: freshUser.emergencyContact?.name || '',
          emergencyContactPhone: freshUser.emergencyContact?.phone || '',
          isAvailable: freshUser.isAvailable ?? true,
          hospitalName: freshUser.hospitalName || freshUser.username || '',
          website: freshUser.website || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        setAvatarPreview(freshUser.avatar || null);
        setHasPassword(!!freshUser.hasPassword);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setErrorMsg('Could not load your profile data');
      } finally {
        setFetching(false);
      }
    };

    fetchLatestUser();
  }, [navigate, setUser]);

  // Real-time field validation
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'username':
      case 'hospitalName':
        if (!value.trim()) error = isHospital ? 'Hospital/Organization name is required' : 'Username is required';
        else if (value.length < 3) error = 'Name must be at least 3 characters';
        break;
      case 'phone':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^\d{9,10}$/.test(value)) error = 'Enter a valid 9–10 digit phone number';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Enter a valid email';
        break;
      case 'bloodGroup':
        if (isDonorOrReceiver && !value) error = 'Blood group is required';
        break;
      case 'website':
        if (value && !/^https?:\/\/.+/.test(value)) error = 'Enter a valid URL (e.g., https://example.com)';
        break;
      case 'emergencyContactPhone':
        if (value && !/^\d{9,10}$/.test(value)) error = 'Enter a valid 9–10 digit phone number';
        break;
      case 'newPassword':
        if (value) {
          const minLength = hasPassword ? 8 : 6; // 6 chars for setup, 8 for change
          if (value.length < minLength) error = `Password must be at least ${minLength} characters`;
        }
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

    // Live validation
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

    // Final validation before submit
    const errors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) errors[key] = err;
    });

    // Password change is optional
    if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
      if (!formData.currentPassword && hasPassword) errors.currentPassword = 'Current password is required';
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

      // Append only relevant fields based on role
      Object.entries(formData).forEach(([key, value]) => {
        if (['currentPassword', 'newPassword', 'confirmPassword'].includes(key)) {
          return; // Handle separately
        }

        // Skip hospital-only fields for donors/receivers
        if (isDonorOrReceiver && ['hospitalName', 'website'].includes(key)) {
          return;
        }

        // Skip donor/receiver-only fields for hospitals
        if (isHospital && ['bloodGroup', 'address', 'emergencyContactName', 'emergencyContactPhone', 'isAvailable'].includes(key)) {
          return;
        }

        formDataToSend.append(key, value);
      });

      // Append password change only if user entered it
      if (formData.newPassword) {
        if (hasPassword) {
          formDataToSend.append('currentPassword', formData.currentPassword);
        }
        formDataToSend.append('newPassword', formData.newPassword);
      }

      // Append avatar if changed
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

        // Redirect after 2 seconds
        setTimeout(() => {
          if (isHospital) {
            navigate('/hospital/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
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
                  {isHospital ? <FaHospital className="text-6xl" /> : <FaUser className="text-6xl" />}
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
          <h1 className="text-3xl font-bold text-gray-900">
            {isHospital ? 'Edit Organization Profile' : 'Edit Your Profile'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isHospital ? 'Update your hospital or organization information' : 'Update your details for better matching and safety'}
          </p>
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
            {/* Role-specific name field */}
            {isHospital ? (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <FaHospital className="text-red-600" />
                  Hospital/Organization Name
                </label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.hospitalName ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition`}
                  required
                />
                {fieldErrors.hospitalName && <p className="mt-1 text-sm text-red-600">{fieldErrors.hospitalName}</p>}
              </div>
            ) : (
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
            )}

            {/* Email */}
            {isHospital && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <FaPhone className="text-red-600" />
                Phone Number
              </label>
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

            {/* Blood Group (Donor/Receiver only) */}
            {isDonorOrReceiver && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <FaTint className="text-red-600" />
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
            )}

            {/* Location / Address */}
            {isHospital ? (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <FaMapMarkerAlt className="text-red-600" />
                  Location/Address
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Kathmandu, Nepal"
                  className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                />
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <FaHome className="text-red-600" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Kathmandu, Nepal"
                  className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                />
              </div>
            )}

            {/* Website (Hospital only) */}
            {isHospital && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <FaGlobe className="text-red-600" />
                  Website (Optional)
                </label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.website ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition`}
                />
                {fieldErrors.website && <p className="mt-1 text-sm text-red-600">{fieldErrors.website}</p>}
              </div>
            )}

            {/* Emergency Contact (Donor/Receiver only) */}
            {isDonorOrReceiver && (
              <>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <FaUserFriends className="text-red-600" />
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    placeholder="e.g. Ram Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                  />
                </div>

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

                {/* Availability (Donor only) */}
                {userRole === 'donor' && (
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
              </>
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

              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaLock className="text-red-600" />
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
            onClick={() => navigate(isHospital ? '/hospital/dashboard' : '/dashboard')}
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
