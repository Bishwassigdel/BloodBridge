// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { FaHeartbeat, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const [isOrganization, setIsOrganization] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bloodGroup: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const redirectByRole = (role) => {
    if (role === 'hospital') {
      navigate('/hospital/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }
    if (!formData.username.trim()) {
      setError('Name / Organization name is required');
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!formData.location.trim()) {
      setError('Location / Address is required');
      setLoading(false);
      return;
    }
    if (!isOrganization && !formData.bloodGroup) {
      setError('Blood group is required for Donor/Receiver');
      setLoading(false);
      return;
    }

    try {
      const userRole = isOrganization ? 'hospital' : formData.bloodGroup ? 'donor' : 'receiver';

      const submitData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone?.trim() || '',
        bloodGroup: formData.bloodGroup || '',
        location: formData.location.trim(),
        role: userRole,
      };

      const { email: verifyEmail, role: verifyRole } = await signup(submitData);
      navigate('/verify-email', { state: { email: verifyEmail, role: verifyRole } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const role = isOrganization ? 'hospital' : 'receiver';
      const { userData, isNewUser } = await googleLogin(credentialResponse.credential, role);
      if (isOrganization) {
        navigate('/hospital/dashboard', { replace: true });
      } else if (isNewUser) {
        navigate('/dashboard', { state: { completeProfile: true } });
      } else {
        redirectByRole((userData?.role || '').toLowerCase());
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google sign-in failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-red-100/50 p-6 lg:p-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <FaHeartbeat className="text-red-600 text-6xl mx-auto mb-4 animate-heartbeat" />
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-1">
            {isOrganization ? 'Organization Registration' : 'Join BloodBridge'}
          </h2>
          <p className="text-gray-600 text-base lg:text-lg">
            {isOrganization ? 'Register your organization to connect with donors' : 'Become a lifesaver today'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl text-center text-sm">
            {error}
          </div>
        )}

        {/* Role Toggle */}
        <div className="mb-8 flex flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={() => setIsOrganization(false)}
            className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-base lg:text-lg transition-all duration-300 shadow-md ${
              !isOrganization
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Donor / Receiver
          </button>
          <button
            type="button"
            onClick={() => setIsOrganization(true)}
            className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-base lg:text-lg transition-all duration-300 shadow-md ${
              isOrganization
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Organization
          </button>
        </div>

        {/* Google Button – available for both Donor/Receiver and Organization */}
        <div className="flex justify-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed. Please try again.')}
            width="380"
            text="signup_with"
            shape="rectangular"
            theme="outline"
            size="large"
          />
        </div>
        <p className="text-center text-xs text-gray-400 mb-4">
          {isOrganization
            ? 'Google sign-up registers your organization — complete your profile after.'
            : 'Google sign-up creates a Receiver account — update your role & blood group in Profile.'}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <hr className="flex-1 border-red-100" />
          <span className="text-gray-400 text-sm font-medium">or register with email</span>
          <hr className="flex-1 border-red-100" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Name / Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isOrganization ? 'Organization Name *' : 'Full Name *'}
            </label>
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                type="text"
                name="username"
                placeholder={isOrganization ? 'Organization Name' : 'Your Full Name'}
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-12 pr-5 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 text-base"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-5 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 text-base"
              />
            </div>
          </div>

          {/* Blood Group - only for non-organization */}
          {!isOrganization && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group *</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-5 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 text-base"
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isOrganization ? 'Organization Address *' : 'City / District *'}
            </label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                type="text"
                name="location"
                placeholder={isOrganization ? 'Full organization address' : 'Your city or district'}
                value={formData.location}
                onChange={handleChange}
                className="w-full pl-12 pr-5 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 text-base"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isOrganization ? 'Organization Contact Phone *' : 'Phone Number (optional)'}
            </label>
            <div className="relative">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                type="tel"
                name="phone"
                placeholder={isOrganization ? 'Organization contact number' : 'Your phone (optional)'}
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-12 pr-5 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 text-base"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create strong password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 transition-colors text-xl"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm your password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 text-base"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 transition-colors text-xl"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="col-span-1 lg:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-8 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
                loading ? 'animate-pulse' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                isOrganization ? 'Register Organization' : 'Register Now'
              )}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <p className="mt-8 text-center text-gray-600 text-lg">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-red-600 font-bold hover:text-red-700 transition-colors underline underline-offset-4"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
