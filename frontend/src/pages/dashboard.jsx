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

  const isDonor = user?.role === 'donor';
  const isReceiver = user?.role === 'receiver';

  useEffect(() => {
    const fetchData = async () => {
      if (!localStorage.getItem('token')) {
        navigate('/login');
        return;
      }

      try {
        const promises = [
          axios.get('/api/notifications'),
        ];

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
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isDonor, isReceiver, navigate, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleAcceptRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to accept this blood request?')) return;

    try {
      await axios.patch(`/api/blood/${requestId}/accept`, {});

      const [reqRes, notifRes] = await Promise.all([
        axios.get('/api/blood/matching-requests'),
        axios.get('/api/notifications'),
      ]);

      setMatchingRequests(reqRes.data.requests || []);
      setNotifications(notifRes.data.notifications || []);
    } catch (err) {
      alert('Failed to accept: ' + (err.response?.data?.message || err.message));
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await axios.patch(`/api/notifications/${notifId}/read`, {});

      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestSuccess('');
    setRequestError('');

    try {
      const res = await axios.post('/api/blood/request', requestForm);

      if (res.data.success) {
        setRequestSuccess(
          'Blood request created successfully! Matching donors have been notified.'
        );
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
      setRequestError(err.response?.data?.message || 'Failed to create request');
      console.error('Request creation error:', err.response?.data);
    } finally {
      setRequestLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Fulfilled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const newRequestCount = notifications.filter(
    (n) => n.type === 'new_blood_request' && !n.read
  ).length;

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white flex">
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6 border-b border-red-100">
          <div className="flex items-center gap-3">
            <FaHeartbeat className="text-3xl text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">BloodBridge</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600 capitalize">
            {user?.role || 'User'} • {user?.username || 'Guest'}
          </p>
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => { setActivePanel('dashboard'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activePanel === 'dashboard' ? 'bg-red-50 text-red-700' : 'hover:bg-red-50'
            }`}
          >
            <FaUser className="text-xl" />
            <span>Dashboard</span>
          </button>

          <Link
            to="/profile"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors"
          >
            <FaUser className="text-xl" />
            <span>Edit Profile</span>
          </Link>

          <button
            onClick={() => { setActivePanel('request-blood'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activePanel === 'request-blood' ? 'bg-red-50 text-red-700' : 'hover:bg-red-50'
            }`}
          >
            <FaPlusCircle className="text-xl" />
            <span>Request Blood</span>
          </button>

          <button
            onClick={() => { setActivePanel('requests'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activePanel === 'requests' ? 'bg-red-50 text-red-700' : 'hover:bg-red-50'
            }`}
          >
            <FaClipboardList className="text-xl" />
            <span>{isDonor ? 'Matching Requests' : 'My Requests'}</span>
            {isDonor && newRequestCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                {newRequestCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => { setActivePanel('notifications'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activePanel === 'notifications' ? 'bg-red-50 text-red-700' : 'hover:bg-red-50'
            }`}
          >
            <FaBell className="text-xl" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <hr className="my-4 border-red-100" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <FaSignOutAlt className="text-xl" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6 pt-20 md:pt-6">
        {/* Dashboard overview */}
        {activePanel === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.username || 'User'}
            </h2>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
                {error}
                {error.includes('blood group') && (
                  <div className="mt-2">
                    <Link
                      to="/profile"
                      className="text-red-800 font-medium underline hover:text-red-900"
                    >
                      Update your blood group →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow border border-red-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Availability</h3>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-xl font-bold">
                    {isAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow border border-red-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Notifications</h3>
                <div className="text-3xl font-bold text-red-600">{unreadCount}</div>
                <p className="text-sm text-gray-600">Unread</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow border border-red-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {isDonor ? 'Pending Matches' : 'Active Requests'}
                </h3>
                <div className="text-3xl font-bold text-red-600">
                  {(isDonor ? matchingRequests : myRequests).filter(r => r.status === 'pending').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Blood */}
        {activePanel === 'request-blood' && (
          <div className="bg-white rounded-3xl shadow border border-red-100 p-6 lg:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FaPlusCircle className="text-red-600 text-2xl" />
              Request Blood
            </h3>

            {requestSuccess && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-xl">
                {requestSuccess}
              </div>
            )}

            {requestError && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
                {requestError}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="hospital"
                    value={requestForm.hospital}
                    onChange={handleRequestChange}
                    required
                    placeholder="e.g. Teaching Hospital"
                    className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="bloodGroup"
                    value={requestForm.bloodGroup}
                    onChange={handleRequestChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white"
                  >
                    <option value="">Select blood group</option>
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units Needed <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="units"
                    value={requestForm.units}
                    onChange={handleRequestChange}
                    required
                    min="1"
                    placeholder="e.g. 2"
                    className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency
                  </label>
                  <select
                    name="urgency"
                    value={requestForm.urgency}
                    onChange={handleRequestChange}
                    className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={requestForm.location}
                    onChange={handleRequestChange}
                    placeholder="e.g. Kathmandu"
                    className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={requestForm.contactPhone}
                    onChange={handleRequestChange}
                    required
                    placeholder="e.g. 9841234567"
                    className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Note (optional)
                  </label>
                  <textarea
                    name="note"
                    value={requestForm.note}
                    onChange={handleRequestChange}
                    rows="3"
                    placeholder="Any special requirements..."
                    className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={requestLoading}
                className={`w-full md:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {requestLoading ? 'Submitting...' : 'Submit Blood Request'}
              </button>
            </form>
          </div>
        )}

        {/* Requests / Matching */}
        {activePanel === 'requests' && (
          <div className="bg-white rounded-3xl shadow border border-red-100 p-6 lg:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {isDonor ? 'Matching Blood Requests' : 'My Blood Requests'}
            </h3>

            {(isDonor ? matchingRequests : myRequests).length > 0 ? (
              <div className="space-y-6">
                {(isDonor ? matchingRequests : myRequests).map((req) => (
                  <div
                    key={req._id}
                    className="p-6 border border-red-100 rounded-2xl hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg">{req.hospital}</h4>
                        <p className="text-gray-600">
                          {req.bloodGroup} • {req.units} units
                        </p>
                      </div>
                      <span
                        className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                          req.urgency === 'emergency'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {req.urgency === 'emergency' ? 'Emergency' : 'Normal'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                      <div>
                        <span className="font-medium">Contact:</span> {req.contactPhone}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {req.location}
                      </div>
                      {req.note && (
                        <div className="col-span-2">
                          <span className="font-medium">Note:</span> {req.note}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span
                        className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(req.status)}`}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>

                      {isDonor && req.status === 'pending' && req.requester?.toString() !== user._id?.toString() && (
                        <button
                          onClick={() => handleAcceptRequest(req._id)}
                          className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition"
                        >
                          Accept Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <FaExclamationTriangle className="text-5xl mx-auto mb-4 text-yellow-500" />
                <p className="text-xl">
                  {isDonor ? 'No matching blood requests found' : 'You have no active blood requests'}
                </p>
                {isDonor && error.includes('blood group') && (
                  <p className="mt-4 text-red-600">
                    Please <Link to="/profile" className="underline font-medium">update your blood group</Link> in your profile.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {activePanel === 'notifications' && (
          <div className="bg-white rounded-3xl shadow border border-red-100 p-6 lg:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FaBell className="text-red-600" />
              Notifications ({unreadCount} unread)
            </h3>

            {notifications.length > 0 ? (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => !notif.read && markAsRead(notif._id)}
                    className={`p-5 rounded-2xl border-l-4 cursor-pointer transition-all ${
                      notif.read ? 'border-gray-300 bg-gray-50' : 'border-red-500 bg-red-50 hover:bg-red-100 shadow-sm'
                    } ${notif.type === 'new_blood_request' ? 'border-red-600 bg-red-50/80' : ''}`}
                  >
                    <p className="text-gray-800 text-base leading-relaxed font-medium">
                      {notif.message || 'No message available'}
                    </p>

                    {notif.type === 'new_blood_request' && notif.data && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-red-100 text-sm">
                        <p className="font-medium">Request Details:</p>
                        <p>Hospital: {notif.data.hospital}</p>
                        <p>Blood: {notif.data.bloodGroup} • {notif.data.units} units</p>
                        <p>Urgency: <span className="font-bold text-red-600">{notif.data.urgency.toUpperCase()}</span></p>
                      </div>
                    )}

                    <div className="mt-2 text-sm text-gray-500 flex flex-wrap items-center gap-4">
                      <span>{new Date(notif.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200">
                        {notif.type.replace('_', ' ')}
                      </span>
                      {!notif.read && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse">
                          New
                        </span>
                      )}
                    </div>

                    {notif.type === 'request_accepted' && notif.data?.requestId && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-600">Request details: </span>
                        <Link
                          to={`/blood-request/${notif.data.requestId}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <FaBell className="text-6xl mx-auto mb-4 opacity-40" />
                <p className="text-xl font-medium">No notifications yet</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;