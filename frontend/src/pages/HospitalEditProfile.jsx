// src/pages/HospitalEditProfile.jsx
import { useState, useEffect, useRef , lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaHospital,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaLock,
  FaCheckCircle,
  FaTimesCircle,
  FaUpload,
  FaSpinner,
} from 'react-icons/fa';
import api from '../services/api';
const MapPicker = lazy(() => import('../components/MapPicker'));
import { useGeolocation, reverseGeocode } from '../hooks/useGeolocation';

function HospitalEditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    hospitalName: user?.hospitalName || user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    website: user?.website || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasPassword, setHasPassword] = useState(false);

  // ── GPS + Map ─────────────────────────────────────────────────────────────
  const { loading: gpsLoading, error: gpsError, getLocation, clearError } = useGeolocation();
  const [geoSuccess, setGeoSuccess]   = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [pickedCoords, setPickedCoords]       = useState(null);
  const [geocoding, setGeocoding]             = useState(false);

  // Fetch latest user data on mount
  useEffect(() => {
    const fetchLatestUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const res = await api.get('/api/auth/me');

        const freshUser = res.data.user || res.data;

        // Verify user is hospital
        if (freshUser.role !== 'hospital') {
          return navigate('/dashboard');
        }

        setUser(freshUser);

        setFormData({
          hospitalName: freshUser.hospitalName || freshUser.username || '',
          email: freshUser.email || '',
          phone: freshUser.phone || '',
          location: freshUser.location || '',
          website: freshUser.website || '',
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

  // Real-time field validation
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'hospitalName':
        if (!value.trim()) error = 'Hospital/Organization name is required';
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
      case 'website':
        if (value && !/^https?:\/\/.+/.test(value)) error = 'Enter a valid URL (e.g., https://example.com)';
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
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Live validation
    const error = validateField(name, value);
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

  // ── GPS detect ─────────────────────────────────────────────────────────
  const handleDetectLocation = async () => {
    clearError();
    setGeoSuccess(false);
    try {
      const coords = await getLocation();
      setGeocoding(true);
      const label = await reverseGeocode(coords.lat, coords.lng);
      setFormData(prev => ({ ...prev, location: label }));
      setPickedCoords(coords);
      setGeoSuccess(true);
    } catch {
      // error surfaced via gpsError from hook
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapPick = async (coords) => {
    setPickedCoords(coords);
    setGeocoding(true);
    try {
      const label = await reverseGeocode(coords.lat, coords.lng);
      setFormData(prev => ({ ...prev, location: label }));
      setGeoSuccess(true);
    } catch {
      setFormData(prev => ({ ...prev, location: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` }));
    } finally {
      setGeocoding(false);
    }
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

    // Password change is optional — only validate if attempting it
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

      // Append normal fields
      Object.entries(formData).forEach(([key, value]) => {
        if (!['currentPassword', 'newPassword', 'confirmPassword'].includes(key)) {
          formDataToSend.append(key, value);
        }
      });

      // Append password change only if user entered it
      if (formData.newPassword) {
        if (hasPassword) {
          formDataToSend.append('currentPassword', formData.currentPassword);
        }
        formDataToSend.append('newPassword', formData.newPassword);
      }

      // Append coordinates if picked via GPS or map
      if (pickedCoords?.lat != null) {
        formDataToSend.append('coordinates[lat]', pickedCoords.lat);
        formDataToSend.append('coordinates[lng]', pickedCoords.lng);
      }

      // Append avatar if changed
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      const res = await api.patch('/api/auth/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setSuccessMsg('Profile updated successfully!');
        setUser(res.data.user || { ...user, ...formData });
        // Reset password fields & file
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

      // Show backend field errors if any
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
                <img src={avatarPreview} alt="Organization Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-600">
                  <FaHospital className="text-6xl" />
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Organization Profile</h1>
          <p className="text-gray-600 mt-2">
            Update your hospital or organization information
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
            {/* Hospital Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
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

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.email ? 'border-red-500' : 'border-red-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition`}
                required
                disabled
              />
              {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
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

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-600" />
                Location / Address
              </label>

              {/* Input row with clickable 📍 GPS icon */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={gpsLoading || geocoding}
                  title="Click to detect live location"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-lg transition-all disabled:cursor-not-allowed group"
                >
                  {gpsLoading || geocoding ? (
                    <FaSpinner className="text-xl text-red-500 animate-spin" />
                  ) : geoSuccess ? (
                    <FaMapMarkerAlt className="text-xl text-green-500" />
                  ) : (
                    <FaMapMarkerAlt className="text-xl text-red-500 group-hover:text-red-700 group-hover:scale-125 transition-transform duration-150" />
                  )}
                </button>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={(e) => { handleChange(e); setGeoSuccess(false); }}
                  placeholder="Click 📍 or type address…"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition focus:ring-2 ${
                    geoSuccess
                      ? 'border-green-400 focus:border-green-500 focus:ring-green-100'
                      : 'border-red-200 focus:border-red-500 focus:ring-red-100'
                  }`}
                />
              </div>

              {/* Status messages */}
              {(gpsLoading || geocoding) && (
                <p className="mt-1.5 text-xs text-blue-500 flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                  {geocoding ? 'Looking up address…' : 'Detecting your location…'}
                </p>
              )}
              {geoSuccess && !gpsLoading && !geocoding && (
                <p className="mt-1.5 text-xs text-green-600 font-medium">✅ Location detected — you can still edit it</p>
              )}
              {gpsError && (
                <p className="mt-1.5 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">⚠️ {gpsError}</p>
              )}

              {/* Pick on Map toggle */}
              <button
                type="button"
                onClick={() => setShowLocationMap(m => !m)}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
              >
                🗺️ {showLocationMap ? 'Hide Map' : 'Pick exact location on map'}
              </button>

              {showLocationMap && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-red-200 shadow-md">
                  <Suspense fallback={<div style={{height:"260px",display:"flex",alignItems:"center",justifyContent:"center",background:"#fef2f2"}}><div style={{width:28,height:28,border:"4px solid #fecaca",borderTopColor:"#dc2626",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/></div>}>
                  <MapPicker
                    height="280px"
                    center={
                      pickedCoords
                        ? [pickedCoords.lat, pickedCoords.lng]
                        : [27.7172, 85.3240]   /* Kathmandu default */
                    }
                    zoom={13}
                    pickedLocation={pickedCoords}
                    onLocationPick={handleMapPick}
                    markers={
                      pickedCoords
                        ? [{
                            id: 'hospital',
                            lat: pickedCoords.lat,
                            lng: pickedCoords.lng,
                            type: 'hospital',
                            label: formData.hospitalName || 'Hospital',
                            subLabel: formData.location || '',
                          }]
                        : []
                    }
                  />
                  </Suspense>
                  <p className="text-xs text-center text-gray-500 py-2 bg-gray-50 border-t border-red-100">
                    Click anywhere on the map to set your exact location
                  </p>
                </div>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
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
                {loading ? 'Saving Changes...' : 'Save Organization Profile'}
              </button>
            </div>
          </div>
        </form>

        {/* Back to Dashboard */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/hospital/dashboard')}
            className="text-red-600 hover:text-red-800 font-medium transition-colors"
          >
            ← Back to Hospital Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default HospitalEditProfile;
