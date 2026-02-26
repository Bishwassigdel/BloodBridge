// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHeartbeat, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const [isHospital, setIsHospital] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bloodGroup: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }
    if (!formData.username || !formData.email || !formData.location) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }
    if (!isHospital && !formData.bloodGroup) {
      setError('Blood group is required');
      setLoading(false);
      return;
    }

    try {
      const userRole = isHospital ? 'hospital' : formData.bloodGroup ? 'donor' : 'receiver';

      const submitData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        location: formData.location.trim(),
        phone: formData.phone?.trim() || '',
        bloodGroup: formData.bloodGroup || '',
        role: userRole
      };

      const registeredUser = await signup(submitData);

      if (registeredUser.role === 'donor' || registeredUser.role === 'receiver') {
        navigate('/dashboard');
      } else if (registeredUser.role === 'hospital') {
        navigate('/hospital/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-red-100/50 p-6 lg:p-10 animate-fade-in">
        {/* Header - Compact */}
        <div className="text-center mb-8">
          <FaHeartbeat className="text-red-600 text-6xl mx-auto mb-4 animate-heartbeat" />
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-1">
            {isHospital ? 'Organization Registration' : 'Join BloodBridge'}
          </h2>
          <p className="text-gray-600 text-base lg:text-lg">
            {isHospital ? 'Connect your hospital' : 'Become a lifesaver today'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl text-center text-sm">
            {error}
          </div>
        )}

        {/* Horizontal Role Toggle */}
        <div className="mb-8 flex flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={() => setIsHospital(false)}
            className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-base lg:text-lg transition-all duration-300 shadow-md ${
              !isHospital 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Donor / Receiver
          </button>
          <button
            type="button"
            onClick={() => setIsHospital(true)}
            className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-base lg:text-lg transition-all duration-300 shadow-md ${
              isHospital 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Organization
          </button>
        </div>

        {/* Form - Horizontal grid on larger screens */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Username / Org Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isHospital ? 'Organization Name' : 'Full Name'} *
            </label>
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                type="text"
                name="username"
                placeholder={isHospital ? 'Hospital / Organization Name' : 'Your Full Name'}
                required
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
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-5 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 text-base"
              />
            </div>
          </div>

          {/* Blood Group - only non-hospital */}
          {!isHospital && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group *</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
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
              {isHospital ? 'Organization Address' : 'City / District'} *
            </label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                type="text"
                name="location"
                placeholder={isHospital ? 'Full address of organization' : 'Your city or district'}
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full pl-12 pr-5 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 text-base"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isHospital ? 'Contact Phone *' : 'Phone Number (optional)'}
            </label>
            <div className="relative">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                type="tel"
                name="phone"
                placeholder={isHospital ? 'Organization contact number' : 'Your phone (optional)'}
                required={isHospital}
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

          {/* Submit Button - Full width */}
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
                isHospital ? 'Register Organization' : 'Register Now'
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