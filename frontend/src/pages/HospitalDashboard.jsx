// src/pages/HospitalDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHeartbeat,
  FaClipboardList,
  FaUsers,
  FaHistory,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBell,
  FaTint,
  FaExclamationTriangle,
  FaSpinner,
  FaRedo,
  FaExclamationCircle,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

function HospitalDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activePanel, setActivePanel] = useState('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [updateUnits, setUpdateUnits] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const token = localStorage.getItem('token');

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get('/api/blood/inventory', {
        headers: { 'x-auth-token': token },
      });
      if (res.data.success) {
        setInventory(res.data.inventory || []);
      } else {
        setError(res.data.message || 'Failed to load inventory');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await axios.get('/api/blood/inventory-logs', {
        headers: { 'x-auth-token': token },
      });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Logs fetch failed', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'hospital') {
      fetchInventory();
    }
  }, [user, token]);

  useEffect(() => {
    if (activePanel === 'history') {
      fetchLogs();
    }
  }, [activePanel, token]);

  const handleUpdateInventory = async (bloodGroup, units, action) => {
    if (!bloodGroup || units <= 0) return;

    if (action === 'subtract') {
      if (!window.confirm(`Remove ${units} units of ${bloodGroup}?`)) return;
    }

    try {
      await axios.post('/api/blood/inventory', {
        bloodGroup,
        units,
        action,
        reason: updateReason || undefined,
        expiryDate: action === 'add' && expiryDate ? expiryDate : undefined,
      }, {
        headers: { 'x-auth-token': token },
      });

      await fetchInventory();

      alert(`Successfully ${action}ed ${units} units of ${bloodGroup}`);

      setSelectedGroup('');
      setUpdateUnits('');
      setUpdateReason('');
      setExpiryDate('');
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const getStatusStyle = (units) => {
    if (units >= 10) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100' };
    if (units >= 1) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 animate-pulse' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 animate-pulse' };
  };

  const isNearExpiry = (date) => {
    if (!date) return false;
    return new Date(date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex">
      <button
        className="md:hidden fixed top-5 left-5 z-50 p-3 bg-white rounded-full shadow-lg hover:bg-red-50 transition"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FaTimes className="text-2xl text-red-600" /> : <FaBars className="text-2xl text-red-600" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-500 ease-in-out border-r border-red-100`}
      >
        <div className="p-8 border-b border-red-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-2xl">
              <FaHeartbeat className="text-4xl text-red-600 animate-heartbeat" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">BloodBridge</h1>
              <p className="text-sm font-medium text-red-600">Hospital Portal</p>
            </div>
          </div>
          <p className="mt-6 text-base text-gray-700">
            {user?.hospitalName || user?.username || 'Hospital Admin'}
          </p>
        </div>

        <nav className="p-6 space-y-2">
          {[
            { key: 'inventory', icon: FaTint, label: 'Blood Inventory' },
            { key: 'donors', icon: FaUsers, label: 'Donor Network' },
            { key: 'requests', icon: FaClipboardList, label: 'Blood Requests' },
            { key: 'history', icon: FaHistory, label: 'Activity Log' },
            { key: 'notifications', icon: FaBell, label: 'Notifications' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActivePanel(item.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                activePanel === item.key
                  ? 'bg-red-50 text-red-700 font-semibold shadow-md'
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-700 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className="text-2xl" />
                <span className="text-lg">{item.label}</span>
              </div>
            </button>
          ))}

          <hr className="my-6 border-red-100" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-300 font-medium"
          >
            <FaSignOutAlt className="text-2xl" />
            <span className="text-lg">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 md:ml-72 p-6 md:p-10 pt-24 md:pt-10">
        {error && (
          <div className="mb-10 p-8 bg-red-50 border-l-6 border-red-500 rounded-3xl shadow-xl">
            <div className="flex items-start gap-6">
              <FaExclamationTriangle className="text-5xl text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-red-800 mb-3">Something went wrong</h3>
                <p className="text-red-700 text-lg mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  <FaRedo className="text-xl" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && activePanel === 'inventory' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <FaSpinner className="text-6xl text-red-600 animate-spin mb-6" />
            <p className="text-xl font-medium text-gray-700">Loading hospital inventory...</p>
          </div>
        ) : (
          <div className="space-y-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Welcome back, <span className="text-red-600">{user?.hospitalName || user?.username || 'Hospital'}</span>
            </h2>

            {activePanel === 'inventory' && (
              <div className="space-y-12">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Total Units</h3>
                    <div className="text-5xl font-extrabold text-red-600">
                      {inventory.reduce((sum, i) => sum + i.units, 0)}
                    </div>
                    <p className="text-lg text-gray-600 mt-3">In Stock</p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Low Stock</h3>
                    <div className="text-5xl font-extrabold text-yellow-600">
                      {inventory.filter(i => i.units > 0 && i.units < 10).length}
                    </div>
                    <p className="text-lg text-gray-600 mt-3">Groups Need Attention</p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Critical</h3>
                    <div className="text-5xl font-extrabold text-red-600">
                      {inventory.filter(i => i.units === 0).length}
                    </div>
                    <p className="text-lg text-gray-600 mt-3">Out of Stock</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((group) => {
                    const item = inventory.find(i => i.bloodGroup === group) || { units: 0 };
                    const { bg, border, text, badge } = getStatusStyle(item.units);
                    const nearExpiry = isNearExpiry(item.earliestExpiryDate);

                    return (
                      <div
                        key={group}
                        className={`p-8 rounded-3xl shadow-xl border ${bg} ${border} hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ${nearExpiry ? 'ring-2 ring-orange-500 ring-offset-2 animate-pulse-slow' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-3xl font-extrabold text-gray-900">{group}</h4>
                          <span className={`px-4 py-1 rounded-full text-sm font-semibold ${badge}`}>
                            {item.units >= 10 ? 'Good' : item.units >= 1 ? 'Low' : 'Critical'}
                          </span>
                        </div>

                        <p className={`text-6xl font-extrabold mb-2 ${text}`}>
                          {item.units}
                        </p>
                        <p className="text-lg text-gray-600 mb-4">Units Available</p>

                        {item.earliestExpiryDate && (
                          <div className="mb-6">
                            <p className="text-sm text-gray-700 mb-1">
                              Earliest expiry: <span className={nearExpiry ? 'text-orange-700 font-bold' : 'font-medium'}>
                                {new Date(item.earliestExpiryDate).toLocaleDateString()}
                              </span>
                            </p>
                            {nearExpiry && (
                              <span className="inline-block px-4 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium animate-pulse">
                                Expires soon – use first!
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 italic mb-6">
                          Use oldest units first to prevent wastage
                        </p>

                        <div className="flex gap-4">
                          <button
                            onClick={() => handleUpdateInventory(group, 1, 'add')}
                            className="flex-1 py-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition text-lg font-medium shadow-md hover:shadow-lg"
                          >
                            +1 Unit
                          </button>
                          <button
                            onClick={() => handleUpdateInventory(group, 1, 'subtract')}
                            disabled={item.units <= 0}
                            className={`flex-1 py-4 rounded-2xl text-lg font-medium transition shadow-md ${
                              item.units <= 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            -1 Unit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-10">
                  <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-4">
                    <FaTint className="text-red-600 text-4xl" />
                    Bulk Inventory Update
                  </h3>

                  <div className="grid md:grid-cols-5 gap-6">
                    <select
                      value={selectedGroup || ''}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="p-5 border border-red-200 rounded-2xl focus:ring-4 focus:ring-red-100 outline-none text-lg bg-white/70"
                    >
                      <option value="">Select Blood Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Number of units"
                      min="1"
                      value={updateUnits}
                      onChange={(e) => setUpdateUnits(e.target.value ? Number(e.target.value) : '')}
                      className="p-5 border border-red-200 rounded-2xl focus:ring-4 focus:ring-red-100 outline-none text-lg bg-white/70"
                    />

                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="p-5 border border-red-200 rounded-2xl focus:ring-4 focus:ring-red-100 outline-none text-lg bg-white/70"
                    />

                    <input
                      type="text"
                      placeholder="Reason (e.g. restock, emergency, transfer)"
                      value={updateReason}
                      onChange={(e) => setUpdateReason(e.target.value)}
                      className="p-5 border border-red-200 rounded-2xl focus:ring-4 focus:ring-red-100 outline-none text-lg bg-white/70 md:col-span-2"
                    />

                    <div className="flex gap-4 md:col-span-5">
                      <button
                        onClick={() => {
                          if (selectedGroup && updateUnits > 0) {
                            handleUpdateInventory(selectedGroup, updateUnits, 'add');
                          }
                        }}
                        disabled={!selectedGroup || updateUnits <= 0}
                        className="flex-1 py-5 px-10 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 disabled:opacity-60 transition shadow-lg hover:shadow-xl text-lg"
                      >
                        Add Units
                      </button>

                      <button
                        onClick={() => {
                          if (selectedGroup && updateUnits > 0) {
                            handleUpdateInventory(selectedGroup, updateUnits, 'subtract');
                          }
                        }}
                        disabled={!selectedGroup || updateUnits <= 0}
                        className="flex-1 py-5 px-10 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 disabled:opacity-60 transition shadow-lg hover:shadow-xl text-lg"
                      >
                        Remove Units
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'history' && (
              <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-10">
                <h3 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-4">
                  <FaHistory className="text-red-600" />
                  Activity History
                </h3>

                {logsLoading ? (
                  <div className="flex justify-center py-12">
                    <FaSpinner className="text-5xl text-red-600 animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-xl text-gray-600 text-center py-12">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    {logs.map((log) => (
                      <div
                        key={log._id}
                        className={`p-6 rounded-2xl border ${
                          log.action === 'add' ? 'bg-green-50 border-green-200' :
                          log.action === 'subtract' ? 'bg-red-50 border-red-200' :
                          'bg-purple-50 border-purple-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-bold text-lg">
                              {log.action.toUpperCase()} {log.units} units of {log.bloodGroup}
                            </span>
                            {log.reason && (
                              <p className="text-sm text-gray-600 mt-1">Reason: {log.reason}</p>
                            )}
                            {log.action === 'add' && log.expiryDate && (
                              <p className="text-sm text-orange-700 mt-1 font-medium">
                                Expiry set: {new Date(log.expiryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">
                          By: {log.performedBy?.username || 'System'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Stock changed: {log.beforeUnits} → {log.afterUnits}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activePanel === 'notifications' && (
              <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-12 text-center">
                <FaBell className="text-9xl text-red-100 mx-auto mb-8 animate-pulse" />
                <h3 className="text-4xl font-bold text-gray-900 mb-6">Notifications</h3>
                <p className="text-2xl text-gray-700">Check low stock and expiry alerts here.</p>
                <p className="text-xl text-gray-500 mt-8">(Alerts appear when stock is low or blood is near expiry)</p>
              </div>
            )}

            {activePanel === 'donors' && (
              <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-12 text-center">
                <FaUsers className="text-9xl text-red-100 mx-auto mb-8" />
                <h3 className="text-4xl font-bold text-gray-900 mb-6">Donor Network</h3>
                <p className="text-2xl text-gray-700 max-w-3xl mx-auto">
                  View and manage registered donors, filter by blood group, availability, and location.
                </p>
                <p className="text-xl text-gray-500 mt-8 italic">(Feature coming soon)</p>
              </div>
            )}

            {activePanel === 'requests' && (
              <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-12 text-center">
                <FaClipboardList className="text-9xl text-red-100 mx-auto mb-8" />
                <h3 className="text-4xl font-bold text-gray-900 mb-6">Blood Requests</h3>
                <p className="text-2xl text-gray-700 max-w-3xl mx-auto">
                  Manage incoming requests — prioritize urgent cases, match donors, update status.
                </p>
                <p className="text-xl text-gray-500 mt-8 italic">(Feature coming soon)</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default HospitalDashboard;