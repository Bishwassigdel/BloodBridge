// src/pages/BloodTransfer.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaHeartbeat, FaTint, FaCheck, FaTimes } from 'react-icons/fa';

const BloodTransfer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const token = searchParams.get('token');

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const bloodGroupColor = {
    'O+': '#ef4444', 'O-': '#dc2626',
    'A+': '#f97316', 'A-': '#ea580c',
    'B+': '#eab308', 'B-': '#ca8a04',
    'AB+': '#8b5cf6', 'AB-': '#7c3aed',
  };

  useEffect(() => {
    // If user is not logged in, they should log in first
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/blood-transfer?token=${token}` } } });
    }
  }, [user, navigate, token]);

  const handleAccept = async () => {
    if (!window.confirm('Accept this blood transfer?')) return;

    setActionLoading(true);
    try {
      const response = await api.post('/api/blood/transfer/accept', { token }, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });

      if (response.data.success) {
        setSuccess(`✅ Transfer Accepted!\n\n${response.data.transfer.units} units of ${response.data.transfer.bloodGroup} have been added to your inventory.`);
        setTimeout(() => navigate('/hospital/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept transfer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    if (!window.confirm('Reject this blood transfer?')) return;

    setActionLoading(true);
    try {
      const response = await api.post('/api/blood/transfer/reject',
        { token, reason: rejectionReason },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );

      if (response.data.success) {
        setSuccess('Transfer rejected. You have been logged out.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject transfer');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    // Try to fetch transfer details (optional, for display)
    // The token itself contains all needed info from the email
    setLoading(false);
    setTransfer({
      token,
      status: 'pending',
      fromHospital: 'Sending Hospital',
      bloodGroup: 'Check your email',
      units: 'Check your email',
    });
  }, [token]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to your hospital account first.</p>
          <Link to="/login" className="text-red-600 font-bold hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-red-100/50 p-8 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <FaHeartbeat className="text-red-600 text-7xl mx-auto mb-4 animate-heartbeat" />
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Blood Transfer Request
          </h2>
          <p className="text-gray-600 text-lg">
            Review and accept or reject the transfer
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r-xl whitespace-pre-wrap">
            {success}
          </div>
        )}

        {/* Transfer Details */}
        {transfer && (
          <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">From Hospital</p>
                <p className="text-xl font-bold text-gray-900">{transfer.fromHospital}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Your Hospital</p>
                <p className="text-xl font-bold text-gray-900">{user?.hospitalName || 'Your Hospital'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Blood Group</p>
                <div className="flex items-center gap-2">
                  <FaTint className="text-2xl" style={{ color: bloodGroupColor[transfer.bloodGroup] || '#999' }} />
                  <p className="text-xl font-bold text-gray-900">{transfer.bloodGroup}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Units</p>
                <p className="text-xl font-bold text-gray-900">{transfer.units} units</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Check your email for complete transfer details including the sending hospital's name and reason.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {!success && (
          <div className="space-y-4">
            {/* Rejection Reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (if rejecting)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Optional: explain why you're rejecting this transfer"
                className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all text-gray-900"
                rows="3"
              />
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <FaCheck className="text-xl" />
                {actionLoading ? 'Accepting...' : 'Accept Transfer'}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <FaTimes className="text-xl" />
                {actionLoading ? 'Rejecting...' : 'Reject Transfer'}
              </button>
            </div>
          </div>
        )}

        {/* Back Link */}
        {!actionLoading && (
          <p className="text-center mt-8 text-gray-600">
            <Link to="/hospital/dashboard" className="text-red-600 hover:text-red-700 underline underline-offset-4">
              Back to Hospital Dashboard
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default BloodTransfer;
