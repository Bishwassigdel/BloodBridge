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
} from 'react-icons/fa';
import axios from 'axios';

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
            to="/profile"
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
          <div className="bg-white rounded-2xl shadow border border-red-100 p-7">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FaPlusCircle className="text-red-600 text-2xl" />
              Request Blood
            </h3>

            {requestSuccess && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-xl text-base">
                {requestSuccess}
              </div>
            )}

            {requestError && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-base">
                {requestError}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Hospital <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="hospital"
                    value={requestForm.hospital}
                    onChange={handleRequestChange}
                    required
                    placeholder="e.g. Civil Hospital"
                    className="w-full px-5 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Blood Group <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="bloodGroup"
                    value={requestForm.bloodGroup}
                    onChange={handleRequestChange}
                    required
                    className="w-full px-5 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white text-base"
                  >
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Units <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="units"
                    value={requestForm.units}
                    onChange={handleRequestChange}
                    required
                    min="1"
                    placeholder="e.g. 2"
                    className="w-full px-5 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Urgency
                  </label>
                  <select
                    name="urgency"
                    value={requestForm.urgency}
                    onChange={handleRequestChange}
                    className="w-full px-5 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white text-base"
                  >
                    <option value="normal">Normal</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={requestForm.location}
                    onChange={handleRequestChange}
                    placeholder="e.g. Kathmandu"
                    className="w-full px-5 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Contact Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={requestForm.contactPhone}
                    onChange={handleRequestChange}
                    required
                    placeholder="e.g. 9841234567"
                    className="w-full px-5 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Additional Note (optional)
                  </label>
                  <textarea
                    name="note"
                    value={requestForm.note}
                    onChange={handleRequestChange}
                    rows="3"
                    placeholder="Any special requirements..."
                    className="w-full px-5 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={requestLoading}
                className={`
                  w-full md:w-auto px-8 py-4 rounded-xl font-semibold text-base
                  bg-gradient-to-r from-red-600 to-rose-600 text-white
                  shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-95
                  transition-all duration-300 disabled:opacity-60
                  flex items-center justify-center gap-3
                `}
              >
                {requestLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-xl" />
                    Submitting...
                  </>
                ) : (
                  'Submit Blood Request'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Matching / My Requests */}
        {activePanel === 'requests' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaClipboardList className="text-red-600 text-2xl" />
              {isDonor ? 'Matching Requests' : 'My Requests'}
            </h3>

            {(isDonor ? matchingRequests : myRequests).length > 0 ? (
              <div className="grid gap-6">
                {(isDonor ? matchingRequests : myRequests).map((req) => (
                  <div
                    key={req._id}
                    className="bg-white rounded-2xl shadow border border-red-100 p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-xl">{req.hospital}</h4>
                        <p className="text-base text-gray-600 mt-1">
                          {req.bloodGroup} • {req.units} units
                        </p>
                      </div>
                      <span
                        className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                          req.urgency === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {req.urgency === 'emergency' ? 'Emergency' : 'Normal'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-base text-gray-600 mb-5">
                      <div>
                        <span className="font-medium">Contact:</span> {req.contactPhone}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {req.location}
                      </div>
                      {req.note && (
                        <div className="col-span-2 mt-2 text-gray-700">
                          <span className="font-medium">Note:</span> {req.note}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(req.status)}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>

                      {isDonor && req.status === 'pending' && req.requester?.toString() !== user._id?.toString() && (
                        <button
                          onClick={() => handleAcceptRequest(req._id)}
                          disabled={loadingAccept === req._id}
                          className={`
                            px-7 py-3 rounded-xl text-base font-medium
                            bg-green-600 text-white hover:bg-green-700
                            transition-all duration-200 disabled:opacity-60
                            flex items-center gap-2
                          `}
                        >
                          {loadingAccept === req._id ? (
                            <FaSpinner className="animate-spin text-lg" />
                          ) : (
                            'Accept Request'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl shadow border border-red-100">
                <FaExclamationTriangle className="text-5xl mx-auto mb-4 text-yellow-500 animate-pulse" />
                <p className="text-xl font-medium text-gray-800">
                  {isDonor ? 'No matching requests found' : 'No active requests yet'}
                </p>
                <p className="text-base text-gray-600 mt-2">
                  {isDonor ? 'Check again later' : 'Create a request to get started'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {activePanel === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaBell className="text-red-600 text-2xl animate-pulse-soft" />
              Notifications ({unreadCount} unread)
            </h3>

            {notifications.length > 0 ? (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => !notif.read && markAsRead(notif._id)}
                    className={`p-5 rounded-2xl border-l-5 cursor-pointer transition-all text-base ${
                      notif.read ? 'bg-gray-50 border-gray-300' : 'bg-white border-red-500 shadow hover:bg-red-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900 leading-relaxed">
                      {notif.message || 'No message available'}
                    </p>

                    {notif.type === 'new_blood_request' && notif.data && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm">
                        <p className="font-medium mb-1">Request Details:</p>
                        <p>Hospital: {notif.data.hospital}</p>
                        <p>Blood: {notif.data.bloodGroup} • {notif.data.units} units</p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <FaClock className="text-base" />
                        {new Date(notif.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-gray-200">
                        {notif.type.replace('_', ' ')}
                      </span>
                      {!notif.read && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 animate-pulse">
                          New
                        </span>
                      )}
                    </div>

                    {notif.type === 'request_accepted' && notif.data?.requestId && (
                      <div className="mt-4">
                        <Link
                          to={`/blood-request/${notif.data.requestId}`}
                          className="text-blue-600 hover:underline text-base font-medium"
                        >
                          View Request Details →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl shadow border border-red-100">
                <FaBell className="text-5xl mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium text-gray-800">No notifications yet</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;