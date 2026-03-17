// src/pages/VerifyEmail.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHeartbeat, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';

const VerifyEmail = () => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Email + role passed from Register page via navigation state
  const email = location.state?.email || '';
  const role = location.state?.role || 'receiver';

  // Redirect to register if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // only digits
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = await verifyEmail(email, code);
      setSuccess('Email verified! Redirecting...');

      setTimeout(() => {
        if (userData.role === 'hospital') {
          navigate('/hospital/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/auth/resend-verification', { email });
      setSuccess('New code sent! Check your email.');
      setDigits(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c)
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-red-100/50 p-8 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <FaHeartbeat className="text-red-600 text-7xl animate-heartbeat" />
            <div className="absolute -bottom-1 -right-1 bg-red-100 rounded-full p-1">
              <FaEnvelope className="text-red-500 text-xl" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-500 text-base">
            We sent a 6-digit code to
          </p>
          <p className="text-red-600 font-semibold text-base mt-1">{maskedEmail}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r-xl text-sm flex items-center gap-2">
            <span>✓</span> {success}
          </div>
        )}

        {/* OTP Input */}
        <form onSubmit={handleVerify}>
          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all
                  ${digit ? 'border-red-500 bg-red-50 text-red-700' : 'border-red-200 bg-white text-gray-900'}
                  focus:border-red-500 focus:ring-4 focus:ring-red-100`}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6}
            className={`w-full py-4 px-8 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${loading ? 'animate-pulse' : ''}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
                Verifying...
              </>
            ) : (
              'Verify & Continue'
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm mb-2">Didn't receive the code?</p>
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-red-600 font-semibold hover:text-red-700 transition-colors underline underline-offset-4 disabled:opacity-60"
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          ) : (
            <p className="text-gray-400 text-sm">
              Resend available in <span className="text-red-500 font-semibold">{countdown}s</span>
            </p>
          )}
        </div>

        {/* Back to register */}
        <p className="text-center mt-6 text-sm text-gray-400">
          Wrong email?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-red-500 hover:text-red-700 underline underline-offset-4"
          >
            Go back
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
