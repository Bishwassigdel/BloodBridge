// src/pages/EmergencyRespond.jsx
// Handles donor accept/reject via email link — no login required
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function EmergencyRespond() {
  const [searchParams] = useSearchParams();
  const token  = searchParams.get('token');
  const action = searchParams.get('action');

  const [status, setStatus]   = useState('loading'); // 'loading' | 'success' | 'error'
  const [data,   setData]     = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !action) {
      setStatus('error');
      setMessage('Invalid link. Please check your email and try again.');
      return;
    }

    const respond = async () => {
      try {
        const res = await axios.get('/api/blood/email-respond', {
          params: { token, action },
        });
        setData(res.data);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Something went wrong. Please try again.'
        );
        setData(err.response?.data || null);
      }
    };

    respond();
  }, [token, action]);

  const isAccept = action === 'accept';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Loading */}
        {status === 'loading' && (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Processing your response...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className={`px-8 py-6 text-center ${isAccept && data?.action === 'accepted' ? 'bg-green-600' : 'bg-gray-500'}`}>
              <p className="text-4xl mb-2">
                {data?.action === 'accepted' ? '✅' : '🙏'}
              </p>
              <h1 className="text-white font-bold text-xl">
                {data?.action === 'accepted' ? 'Thank You for Accepting!' : 'Response Recorded'}
              </h1>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-4">
              <p className="text-gray-700 text-sm leading-relaxed">{message}</p>

              {/* Show request details if accepted */}
              {data?.action === 'accepted' && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                  {data.hospital && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>🏥</span>
                      <div>
                        <p className="text-xs text-gray-500">Go to Hospital</p>
                        <p className="font-semibold text-gray-800">{data.hospital}</p>
                      </div>
                    </div>
                  )}
                  {data.bloodGroup && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>🩸</span>
                      <div>
                        <p className="text-xs text-gray-500">Blood Group</p>
                        <p className="font-semibold text-gray-800">{data.bloodGroup} · {data.units} unit{data.units > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )}
                  {data.requesterName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>👤</span>
                      <div>
                        <p className="text-xs text-gray-500">Patient</p>
                        <p className="font-semibold text-gray-800">{data.requesterName}</p>
                      </div>
                    </div>
                  )}
                  {data.contactPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>📞</span>
                      <div>
                        <p className="text-xs text-gray-500">Contact Patient</p>
                        <a
                          href={`tel:${data.contactPhone}`}
                          className="font-bold text-green-700 hover:underline"
                        >
                          {data.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Already used */}
              {data?.alreadyUsed && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                  ⚠️ This link has already been used.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-6">
              <Link
                to="/"
                className="block text-center py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition text-sm"
              >
                Go to BloodBridge
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-red-600 px-8 py-6 text-center">
              <p className="text-4xl mb-2">⚠️</p>
              <h1 className="text-white font-bold text-xl">Something Went Wrong</h1>
            </div>
            <div className="px-8 py-6 space-y-4">
              <p className="text-gray-700 text-sm">{message}</p>
              {data?.daysLeft && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
                  ⏳ You can donate again in <strong>{data.daysLeft} day(s)</strong>.
                </div>
              )}
              <Link
                to="/"
                className="block text-center py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition text-sm"
              >
                Go to BloodBridge
              </Link>
            </div>
          </div>
        )}

        {/* Branding */}
        <p className="text-center text-xs text-gray-400 mt-6">
          BloodBridge – Saving lives, one drop at a time 🩸
        </p>
      </div>
    </div>
  );
}
