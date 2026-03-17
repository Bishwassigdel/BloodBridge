// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaHeartbeat,
  FaClipboardList,
  FaUser,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaBell,
  FaBars,
  FaTimes,
  FaPlusCircle,
  FaPhone,
  FaMapMarkerAlt,
  FaSpinner,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaRedo,
  FaHospital,
  FaTint,
  FaExclamationCircle,
} from 'react-icons/fa';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
import axios from 'axios';

// Helper: relative time
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Config per notification type
const NOTIF_CONFIG = {
  new_blood_request: {
    icon: '🩸',
    bg: 'bg-red-50',
    border: 'border-red-200',
    accent: 'bg-red-600',
    label: 'Blood Request',
    labelBg: 'bg-red-100 text-red-700',
  },
  request_accepted: {
    icon: '✅',
    bg: 'bg-green-50',
    border: 'border-green-200',
    accent: 'bg-green-500',
    label: 'Accepted',
    labelBg: 'bg-green-100 text-green-700',
  },
  default: {
    icon: '🔔',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'bg-blue-400',
    label: 'Notification',
    labelBg: 'bg-blue-100 text-blue-700',
  },
};

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);

  const [donations, setDonations] = useState([]);
  const [matchingRequests, setMatchingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [requestForm, setRequestForm] = useState({
    hospital: '',
    bloodGroup: user?.bloodGroup || '',
    units: '',
    urgency: 'normal',
    location: '',
    contactPhone: user?.phone || '',
    note: '',
  });

  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorRetryCount, setErrorRetryCount] = useState(0);

  const [loadingAccept, setLoadingAccept] = useState(null);
  const [loadingDecline, setLoadingDecline] = useState(null);
  const [declinedIds, setDeclinedIds] = useState(new Set());

  const isDonor = user?.role === 'donor';
  const isReceiver = user?.role === 'receiver';

  const fetchData = async (isRetry = false) => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    if (!isRetry) setLoading(true);
    setError('');

    try {
      const promises = [axios.get('/api/notifications')];

      if (isDonor) {
        promises.push(axios.get('/api/blood/matching-requests'));
        promises.push(axios.get('/api/blood/my-donations'));
      }

      if (isReceiver) {
        promises.push(axios.get('/api/blood/my-requests'));
      }

      const results = await Promise.allSettled(promises);

      let idx = 0;

      if (results[idx++].status === 'fulfilled') {
        setNotifications(results[idx - 1].value.data.notifications || []);
      }

      if (isDonor) {
        if (results[idx++].status === 'fulfilled') {
          setMatchingRequests(results[idx - 1].value.data.requests || []);
        }
        if (results[idx++].status === 'fulfilled') {
          setDonations(results[idx - 1].value.data.donations || []);
        }
      }

      if (isReceiver) {
        if (results[idx++].status === 'fulfilled') {
          setMyRequests(results[idx - 1].value.data.requests || []);
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(
        err.response?.data?.message ||
        'Failed to load dashboard. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [isDonor, isReceiver, navigate, user?.role, errorRetryCount]);

  const handleRetry = () => setErrorRetryCount(prev => prev + 1);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleAcceptRequest = async (requestId) => {
    if (!window.confirm('Accept this blood request?')) return;

    setLoadingAccept(requestId);

    try {
      await axios.patch(`/api/blood/${requestId}/accept`, {});

      const [reqRes, notifRes] = await Promise.all([
        axios.get('/api/blood/matching-requests'),
        axios.get('/api/notifications'),
      ]);

      setMatchingRequests(reqRes.data.requests || []);
      setNotifications(notifRes.data.notifications || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept request. Try again.');
    } finally {
      setLoadingAccept(null);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    setLoadingDecline(requestId);
    try {
      await axios.patch(`/api/blood/${requestId}/decline`, {});
      // Optimistically remove from list
      setDeclinedIds(prev => new Set([...prev, requestId]));
      setMatchingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      // Even if the endpoint doesn't exist yet, hide the card locally
      setDeclinedIds(prev => new Set([...prev, requestId]));
      setMatchingRequests(prev => prev.filter(r => r._id !== requestId));
    } finally {
      setLoadingDecline(null);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await axios.patch(`/api/notifications/${notifId}/read`, {});
      setNotifications(prev =>
        prev.map(n => (n._id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    try {
      await Promise.allSettled(
        unread.map(n => axios.patch(`/api/notifications/${n._id}/read`, {}))
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestSuccess('');
    setRequestError('');

    try {
      const res = await axios.post('/api/blood/request', requestForm);

      if (res.data.success) {
        setRequestSuccess('Blood request created successfully!');
        setRequestForm({
          hospital: '',
          bloodGroup: user?.bloodGroup || '',
          units: '',
          urgency: 'normal',
          location: '',
          contactPhone: user?.phone || '',
          note: '',
        });

        const reqRes = await axios.get('/api/blood/my-requests');
        setMyRequests(reqRes.data.requests || []);

        setActivePanel('requests');
      }
    } catch (err) {
      setRequestError(
        err.response?.data?.message ||
        'Failed to create request. Please check your input.'
      );
    } finally {
      setRequestLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Fulfilled':
        return 'bg-green-100 text-green-800 border-green-200 text-sm';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 text-sm';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse text-sm';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 text-sm';
    }
  };

  const newRequestCount = notifications.filter(
    n => n.type === 'new_blood_request' && !n.read
  ).length;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="text-5xl text-red-600 animate-spin" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex">
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-5 left-5 z-50 p-3 bg-white rounded-full shadow-lg hover:bg-red-50 transition"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FaTimes className="text-2xl text-red-600" /> : <FaBars className="text-2xl text-red-600" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md shadow-xl transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-400 ease-in-out border-r border-red-100`}
      >
        <div className="p-6 border-b border-red-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <FaHeartbeat className="text-3xl text-red-600 animate-heartbeat" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BloodBridge</h1>
              <p className="text-sm text-red-600">Save Lives Together</p>
            </div>
          </div>
          <p className="mt-4 text-base text-gray-600 capitalize">
            {user?.role} • {user?.username || 'Guest'}
          </p>
        </div>

        <nav className="p-5 space-y-2">
          {[
            { name: 'Dashboard', icon: FaUser, panel: 'dashboard' },
            { name: 'Request Blood', icon: FaPlusCircle, panel: 'request-blood' },
            {
              name: isDonor ? 'Matching Requests' : 'My Requests',
              icon: FaClipboardList,
              panel: 'requests',
              badge: isDonor && newRequestCount > 0 ? newRequestCount : null,
            },
            {
              name: 'Notifications',
              icon: FaBell,
              panel: 'notifications',
              badge: unreadCount > 0 ? unreadCount : null,
            },
          ].map(item => (
            <button
              key={item.panel}
              onClick={() => { setActivePanel(item.panel); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl text-base transition-all ${
                activePanel === item.panel
                  ? 'bg-red-50 text-red-700 font-semibold shadow-md'
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className="text-2xl" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-red-600 text-white text-sm px-3 py-1 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <hr className="my-5 border-red-100" />

          <Link
            to="/profile/edit"
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-base text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all"
          >
            <FaUser className="text-2xl" />
            <span>Edit Profile</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-base text-red-600 hover:bg-red-50 transition-all"
          >
            <FaSignOutAlt className="text-2xl" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6 md:p-8 pt-20 md:pt-8">
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-l-6 border-red-500 rounded-2xl shadow-md">
            <div className="flex items-start gap-4">
              <FaExclamationTriangle className="text-3xl text-red-600 mt-1" />
              <div className="flex-1">
                <p className="text-base font-medium text-red-800">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm"
                >
                  <FaRedo className="text-base" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard overview */}
        {activePanel === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, <span className="text-red-600">{user?.username || 'User'}</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow border border-red-100">
                <h3 className="text-base font-medium text-gray-700 mb-3">Availability</h3>
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'} shadow`}></div>
                  <span className="text-xl font-semibold">
                    {isAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow border border-red-100">
                <h3 className="text-base font-medium text-gray-700 mb-3">Notifications</h3>
                <div className="text-4xl font-bold text-red-600">{unreadCount}</div>
                <p className="text-sm text-gray-600 mt-2">Unread</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow border border-red-100">
                <h3 className="text-base font-medium text-gray-700 mb-3">
                  {isDonor ? 'Pending Matches' : 'Active Requests'}
                </h3>
                <div className="text-4xl font-bold text-red-600">
                  {(isDonor ? matchingRequests : myRequests).filter(r => r.status === 'pending').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Blood */}
        {activePanel === 'request-blood' && (
          <div className="max-w-2xl">
            {/* Page header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <FaPlusCircle className="text-red-600 text-lg" />
                </span>
                Request Blood
              </h3>
              <p className="text-sm text-gray-500 mt-1 ml-[52px]">Fill in the details below to find matching donors</p>
            </div>

            {/* Success state */}
            {requestSuccess && (
              <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-2xl">
                <FaCheckCircle className="text-green-500 text-xl mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{requestSuccess}</p>
                  <p className="text-sm text-green-600 mt-0.5">Matching donors have been notified.</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {requestError && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl">
                <FaExclamationCircle className="text-red-500 text-xl mt-0.5 flex-shrink-0" />
                <span className="text-sm">{requestError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-6">

              {/* ── Urgency toggle ───────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Request Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'normal', label: 'Normal', emoji: '🩸', desc: 'Within a few days' },
                    { value: 'emergency', label: 'Emergency', emoji: '🚨', desc: 'Urgent, within hours' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRequestForm(prev => ({ ...prev, urgency: opt.value }))}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                        requestForm.urgency === opt.value
                          ? opt.value === 'emergency'
                            ? 'border-red-600 bg-red-50 text-red-700 shadow-md'
                            : 'border-red-500 bg-red-50 text-red-700 shadow-md'
                          : 'border-gray-200 text-gray-600 hover:border-red-200'
                      }`}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs opacity-70">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Blood Group picker ───────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Blood Group Needed <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setRequestForm(prev => ({ ...prev, bloodGroup: bg }))}
                      className={`py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                        requestForm.bloodGroup === bg
                          ? 'bg-red-600 border-red-600 text-white shadow-md scale-105'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Units stepper ────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Units Needed <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setRequestForm(prev => ({ ...prev, units: Math.max(1, (parseInt(prev.units) || 1) - 1) }))}
                    disabled={(parseInt(requestForm.units) || 1) <= 1}
                    className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 transition-all"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-extrabold text-red-600">{requestForm.units || 1}</span>
                    <p className="text-xs text-gray-400 mt-0.5">unit{(parseInt(requestForm.units) || 1) > 1 ? 's' : ''} · ~{(parseInt(requestForm.units) || 1) * 350}ml</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequestForm(prev => ({ ...prev, units: Math.min(10, (parseInt(prev.units) || 1) + 1) }))}
                    disabled={(parseInt(requestForm.units) || 1) >= 10}
                    className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ── Hospital & Location ──────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Location Details</label>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Hospital <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaHospital className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type="text"
                      name="hospital"
                      value={requestForm.hospital}
                      onChange={handleRequestChange}
                      required
                      placeholder="e.g. Civil Hospital, Kathmandu"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Location / District</label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type="text"
                      name="location"
                      value={requestForm.location}
                      onChange={handleRequestChange}
                      placeholder="e.g. Kathmandu"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* ── Contact & Note ───────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Contact Info</label>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type="tel"
                      name="contactPhone"
                      value={requestForm.contactPhone}
                      onChange={handleRequestChange}
                      required
                      placeholder="e.g. 9841234567"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Additional Note <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    name="note"
                    value={requestForm.note}
                    onChange={handleRequestChange}
                    rows="2"
                    placeholder="Any special requirements, patient details..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm resize-none"
                  />
                </div>
              </div>

              {/* ── Submit ───────────────────────────────────────────────── */}
              <button
                type="submit"
                disabled={requestLoading}
                className={`w-full py-4 rounded-2xl font-bold text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                  requestLoading
                    ? 'opacity-60 cursor-not-allowed bg-red-400 text-white'
                    : requestForm.urgency === 'emergency'
                    ? 'bg-red-700 hover:bg-red-800 text-white hover:shadow-xl hover:scale-[1.01] active:scale-95'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-xl hover:scale-[1.01] active:scale-95'
                }`}
              >
                {requestLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-lg" />
                    Submitting...
                  </>
                ) : requestForm.urgency === 'emergency' ? (
                  <>🚨 Send Emergency Request</>
                ) : (
                  'Submit Blood Request'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Matching / My Requests */}
        {activePanel === 'requests' && (() => {
          const allReqs = isDonor ? matchingRequests : myRequests;
          // Sort: emergency first, then by date desc
          const sorted = [...allReqs].sort((a, b) => {
            if (a.urgency === 'emergency' && b.urgency !== 'emergency') return -1;
            if (b.urgency === 'emergency' && a.urgency !== 'emergency') return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          const pendingCount = allReqs.filter(r => r.status === 'pending').length;
          const acceptedCount = allReqs.filter(r => r.status === 'accepted').length;

          // Status step helpers for receiver
          const STATUS_STEPS = ['pending', 'accepted', 'Fulfilled'];
          const stepIndex = (status) => {
            const s = status?.toLowerCase();
            if (s === 'fulfilled' || s === 'completed') return 2;
            if (s === 'accepted') return 1;
            return 0;
          };

          return (
            <div className="max-w-2xl space-y-5">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <FaClipboardList className="text-red-600 text-lg" />
                    </span>
                    {isDonor ? 'Matching Requests' : 'My Requests'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5 ml-[52px]">
                    {allReqs.length} total · {pendingCount} pending
                    {acceptedCount > 0 ? ` · ${acceptedCount} accepted` : ''}
                  </p>
                </div>
                {!isDonor && (
                  <button
                    onClick={() => setActivePanel('request-blood')}
                    className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <FaPlusCircle className="text-sm" />
                    New Request
                  </button>
                )}
              </div>

              {sorted.length > 0 ? (
                <div className="space-y-4">
                  {sorted.map((req) => {
                    const isEmerg = req.urgency === 'emergency';
                    const isPending = req.status === 'pending';
                    const isAccepted = req.status === 'accepted';
                    const isFulfilled = req.status === 'Fulfilled' || req.status === 'Completed' || req.status === 'fulfilled';
                    const stepIdx = stepIndex(req.status);

                    return (
                      <div
                        key={req._id}
                        className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg ${
                          isEmerg && isPending
                            ? 'border-red-300 shadow-md shadow-red-100'
                            : 'border-gray-100 shadow-sm'
                        }`}
                      >
                        {/* Emergency top bar */}
                        {isEmerg && (
                          <div className="bg-red-600 px-4 py-1.5 flex items-center gap-2">
                            <span className="text-sm animate-pulse">🚨</span>
                            <span className="text-xs font-bold text-white tracking-wide uppercase">Emergency Request</span>
                          </div>
                        )}

                        <div className="p-5">
                          {/* Top row: blood badge + hospital info + status pill */}
                          <div className="flex items-start gap-4">
                            {/* Blood group badge */}
                            <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                              isEmerg ? 'bg-red-600' : 'bg-red-500'
                            }`}>
                              <span className="text-white font-extrabold text-base leading-tight text-center">
                                {req.bloodGroup}
                              </span>
                            </div>

                            {/* Hospital + meta */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-bold text-gray-900 text-base leading-snug">
                                    {req.hospital}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <FaTint className="text-red-400 text-xs" />
                                      {req.units} unit{req.units > 1 ? 's' : ''} needed
                                    </span>
                                    {req.location && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <FaMapMarkerAlt className="text-gray-400 text-xs" />
                                        {req.location}
                                      </span>
                                    )}
                                    {req.createdAt && (
                                      <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <FaClock className="text-gray-300 text-xs" />
                                        {timeAgo(req.createdAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Status pill */}
                                <span className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${
                                  isFulfilled
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : isAccepted
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                                    : isPending
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                  {isFulfilled ? '✓ Fulfilled' : isAccepted ? '● Accepted' : '○ Pending'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status progress bar (receiver only) */}
                          {!isDonor && (
                            <div className="mt-4 flex items-center gap-0">
                              {STATUS_STEPS.map((step, i) => {
                                const done = stepIdx > i;
                                const active = stepIdx === i;
                                return (
                                  <div key={step} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-shrink-0">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                        done
                                          ? 'bg-green-500 border-green-500 text-white'
                                          : active
                                          ? 'bg-red-600 border-red-600 text-white'
                                          : 'bg-white border-gray-300 text-gray-400'
                                      }`}>
                                        {done ? '✓' : i + 1}
                                      </div>
                                      <span className={`text-xs mt-1 font-medium capitalize ${
                                        done ? 'text-green-600' : active ? 'text-red-600' : 'text-gray-400'
                                      }`}>
                                        {step === 'Fulfilled' ? 'Done' : step}
                                      </span>
                                    </div>
                                    {i < STATUS_STEPS.length - 1 && (
                                      <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${
                                        stepIdx > i ? 'bg-green-400' : 'bg-gray-200'
                                      }`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Divider */}
                          <div className="my-3 border-t border-gray-100" />

                          {/* Contact + note row */}
                          <div className="flex flex-wrap gap-x-5 gap-y-2">
                            {req.contactPhone && (
                              <a
                                href={`tel:${req.contactPhone}`}
                                className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
                              >
                                <FaPhone className="text-xs" />
                                {req.contactPhone}
                              </a>
                            )}
                            {req.note && (
                              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                <span className="text-gray-300">|</span>
                                <span className="italic truncate max-w-[200px]">{req.note}</span>
                              </p>
                            )}
                          </div>

                          {/* Accept + Decline buttons (donor only, pending only) */}
                          {isDonor && isPending && req.requester?.toString() !== user._id?.toString() && (
                            <div className="mt-4 flex gap-3">
                              {/* Decline */}
                              <button
                                onClick={() => handleDeclineRequest(req._id)}
                                disabled={loadingDecline === req._id || loadingAccept === req._id}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all duration-200 ${
                                  loadingDecline === req._id
                                    ? 'opacity-60 cursor-not-allowed border-gray-200 text-gray-400'
                                    : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 active:scale-[0.98]'
                                }`}
                              >
                                {loadingDecline === req._id ? (
                                  <FaSpinner className="animate-spin text-sm" />
                                ) : (
                                  <>
                                    <FaTimes className="text-sm" />
                                    Decline
                                  </>
                                )}
                              </button>

                              {/* Accept */}
                              <button
                                onClick={() => handleAcceptRequest(req._id)}
                                disabled={loadingAccept === req._id || loadingDecline === req._id}
                                className={`flex-[2] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
                                  loadingAccept === req._id
                                    ? 'opacity-60 cursor-not-allowed bg-green-400 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md active:scale-[0.98]'
                                }`}
                              >
                                {loadingAccept === req._id ? (
                                  <>
                                    <FaSpinner className="animate-spin text-sm" />
                                    Accepting...
                                  </>
                                ) : (
                                  <>
                                    <FaCheckCircle className="text-sm" />
                                    Accept & Donate
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Accepted confirmation (donor) */}
                          {isDonor && isAccepted && (
                            <div className="mt-4 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                              <FaCheckCircle className="text-blue-500 text-sm flex-shrink-0" />
                              <p className="text-xs font-semibold text-blue-700">
                                You accepted this request — please contact the patient
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty state */
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                    <FaTint className="text-2xl text-red-300" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">
                    {isDonor ? 'No matching requests right now' : 'No requests yet'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1 mb-5">
                    {isDonor
                      ? 'New requests matching your blood group will appear here'
                      : 'Create your first blood request to find donors near you'}
                  </p>
                  {!isDonor && (
                    <button
                      onClick={() => setActivePanel('request-blood')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                    >
                      <FaPlusCircle className="text-sm" />
                      Create a Request
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Notifications */}
        {activePanel === 'notifications' && (
          <div className="max-w-2xl space-y-5">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="relative">
                    <FaBell className="text-red-600 text-2xl" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                    )}
                  </span>
                  Notifications
                </h3>
                <p className="text-sm text-gray-500 mt-0.5 ml-9">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all"
                >
                  <FaCheckCircle className="text-base" />
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif) => {
                  const cfg = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.default;
                  const isNew = !notif.read;
                  const isBloodReq = notif.type === 'new_blood_request';
                  const isAccepted = notif.type === 'request_accepted';

                  return (
                    <div
                      key={notif._id}
                      onClick={() => isNew && markAsRead(notif._id)}
                      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isNew
                          ? `${cfg.bg} ${cfg.border} shadow-md hover:shadow-lg cursor-pointer`
                          : 'bg-white border-gray-100 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* Left accent stripe */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isNew ? cfg.accent : 'bg-gray-200'} rounded-l-2xl`} />

                      <div className="pl-5 pr-5 pt-4 pb-4">
                        {/* Top row: icon + type label + timestamp + NEW dot */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">{cfg.icon}</span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.labelBg}`}>
                              {cfg.label}
                            </span>
                            {isNew && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <FaClock className="text-xs" />
                            {timeAgo(notif.createdAt)}
                          </div>
                        </div>

                        {/* Message */}
                        <p className={`text-sm leading-relaxed ${isNew ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                          {notif.message || 'No message available'}
                        </p>

                        {/* ── Blood Request card ──────────────────────────── */}
                        {isBloodReq && notif.data && (
                          <div className="mt-3 bg-white rounded-xl border border-red-100 p-3.5 flex items-start gap-3">
                            {/* Blood group badge */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
                              <span className="text-white font-extrabold text-sm leading-tight text-center">
                                {notif.data.bloodGroup}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">
                                {notif.data.hospital}
                              </p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <FaTint className="text-red-400" />
                                  {notif.data.units} unit{notif.data.units > 1 ? 's' : ''} needed
                                </span>
                                {notif.data.location && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <FaMapMarkerAlt className="text-gray-400" />
                                    {notif.data.location}
                                  </span>
                                )}
                                {notif.data.urgency === 'emergency' && (
                                  <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                    🚨 Emergency
                                  </span>
                                )}
                              </div>
                              {notif.data.contactPhone && (
                                <a
                                  href={`tel:${notif.data.contactPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 hover:underline"
                                >
                                  <FaPhone className="text-xs" />
                                  {notif.data.contactPhone}
                                </a>
                              )}
                            </div>
                            {/* Urgency flash */}
                            {notif.data.urgency === 'emergency' && isNew && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1 animate-ping" />
                            )}
                          </div>
                        )}

                        {/* ── Request Accepted card ───────────────────────── */}
                        {isAccepted && notif.data && (
                          <div className="mt-3 bg-white rounded-xl border border-green-100 p-3.5 flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-sm">
                              <FaCheckCircle className="text-white text-base" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-green-700">A donor has accepted your request!</p>
                              {notif.data.donorName && (
                                <p className="text-xs text-gray-500 mt-0.5">Donor: {notif.data.donorName}</p>
                              )}
                              {notif.data.contactPhone && (
                                <a
                                  href={`tel:${notif.data.contactPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:underline"
                                >
                                  <FaPhone className="text-xs" />
                                  {notif.data.contactPhone}
                                </a>
                              )}
                            </div>
                            {notif.data.requestId && (
                              <Link
                                to={`/blood-request/${notif.data.requestId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs font-semibold text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                              >
                                View →
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Mark as read hint */}
                        {isNew && (
                          <p className="mt-2.5 text-xs text-gray-400 group-hover:text-gray-500 transition-colors">
                            Tap to mark as read
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <FaBell className="text-2xl text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">You'll be notified when someone requests or accepts blood</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;