// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { FaHeartbeat, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectByRole = (role) => {
    // If coming from blood transfer email link, prioritize returning to that page
    const fromPath = location.state?.from?.pathname;
    if (fromPath && fromPath.includes('/blood-transfer')) {
      navigate(fromPath + (location.state?.from?.search || ''), { replace: true });
      return;
    }

    // Otherwise, redirect by role
    if (role === 'hospital') {
      navigate('/hospital/dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(identifier.trim(), password.trim());
      redirectByRole((loggedUser?.role || '').toLowerCase());
    } catch (err) {
      let errorMsg = err.response?.data?.message || err.message || 'Login failed. Please check your email/phone and password.';

      // Special handling for Google-only accounts
      if (errorMsg.includes('Google sign-in')) {
        errorMsg = `${errorMsg} \n\nAlternatively, click "Forgot password?" to set a password and enable email/password login.`;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const { userData } = await googleLogin(credentialResponse.credential);
      redirectByRole((userData?.role || '').toLowerCase());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-red-100/50 p-8 lg:p-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <FaHeartbeat className="text-red-600 text-7xl mx-auto mb-6 animate-heartbeat" />
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-lg">
            Sign in to continue saving lives
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl">
            {error}
          </div>
        )}

        {/* Google Button */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed. Please try again.')}
            width="380"
            text="signin_with"
            shape="rectangular"
            theme="outline"
            size="large"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <hr className="flex-1 border-red-100" />
          <span className="text-gray-400 text-sm font-medium">or sign in with email</span>
          <hr className="flex-1 border-red-100" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email or Phone */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
              Email or Phone Number
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or phone number"
                required
                className="w-full pl-12 pr-5 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 placeholder-gray-500 text-lg"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-white/70 text-gray-900 placeholder-gray-500 text-lg"
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

          {/* Forgot Password */}
          <div className="text-right -mt-2">
            <Link
              to="/forgot-password"
              className="text-sm text-red-600 hover:text-red-700 transition-colors underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
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
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center mt-8 text-gray-600 text-lg">
          New to BloodBridge?{' '}
          <Link
            to="/register"
            className="text-red-600 font-bold hover:text-red-700 transition-colors underline underline-offset-4"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
