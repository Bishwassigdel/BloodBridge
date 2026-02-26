// src/pages/HospitalDashboard.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaTint,
  FaUsers,
  FaClipboardList,
  FaHistory,
  FaSignOutAlt,
  FaHospitalAlt,
  FaBars,
  FaTimes,
  FaHeartbeat,
  FaBell,
} from 'react-icons/fa';
import axios from 'axios';

function HospitalDashboard({ user }) {
  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real inventory from backend
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for bulk update form
  const [selectedGroup, setSelectedGroup] = useState('');
  const [updateUnits, setUpdateUnits] = useState('');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/', { replace: true });
  };

  // Fetch real inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please login.');
        }

        const res = await axios.get('/api/blood/inventory');

        if (res.data.success) {
          setInventory(res.data.inventory || []);
        } else {
          setError(res.data.message || 'Failed to load inventory');
        }
      } catch (err) {
        console.error('Inventory fetch failed:', err);
        setError(err.response?.data?.message || 'Error loading inventory. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'hospital') {
      fetchInventory();
    }
  }, [user]);

  // Function to update inventory with confirmation for subtract
  const handleUpdateInventory = async (bloodGroup, units, action) => {
    if (!bloodGroup || units <= 0) return;

    // Confirmation for remove
    if (action === 'subtract') {
      const confirmMsg = `Are you sure you want to remove ${units} units of ${bloodGroup}?`;
      if (!window.confirm(confirmMsg)) return;
    }

    try {
      await axios.post('/api/blood/inventory', { bloodGroup, units, action });

      // Refresh inventory
      const res = await axios.get('/api/blood/inventory');

      setInventory(res.data.inventory || []);
      alert(`Successfully ${action}ed ${units} units of ${bloodGroup}`);

      // Reset bulk form
      setSelectedGroup('');
      setUpdateUnits('');
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white flex flex-col">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-red-100 shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-16 lg:h-18">
            <div className="flex items-center gap-3.5">
              <div className="bg-red-50 p-2.5 rounded-xl shadow-sm">
                <FaHeartbeat className="text-red-600 text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  BloodBridge
                </h1>
                <p className="text-xs text-red-600 font-medium tracking-wide uppercase">
                  Hospital Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setActivePanel('notifications')}
                className="relative text-gray-700 hover:text-red-600 transition-colors"
                title="Notifications"
              >
                <FaBell className="text-2xl" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  0
                </span>
              </button>

              <Link
                to="/profile"
                className="flex items-center gap-3 group hover:scale-[1.02] transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-lg shadow-sm ring-1 ring-red-200 group-hover:ring-red-300 transition-all">
                  {user?.name?.charAt(0)?.toUpperCase() || 'H'}
                </div>
                <div className="hidden md:block">
                  <p className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                    {user?.name || 'Hospital Admin'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {user?.hospitalName || 'City Hospital'}
                  </p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <FaSignOutAlt />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 pt-16 lg:pt-18">
        {/* Sidebar */}
        <aside
          className={`w-72 bg-white border-r border-red-100 fixed top-16 lg:top-18 h-[calc(100vh-4rem)] lg:h-[calc(100vh-4.5rem)] z-40 transition-transform duration-300 overflow-y-auto lg:translate-x-0 shadow-sm ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6 border-b border-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 p-2 rounded-lg">
                  <FaHospitalAlt className="text-red-600 text-xl" />
                </div>
                <span className="font-semibold text-gray-900">Hospital Menu</span>
              </div>
              <button
                className="lg:hidden text-gray-600 hover:text-red-600"
                onClick={() => setSidebarOpen(false)}
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>
          </div>

          <nav className="p-5 space-y-2">
            {[
              { key: 'inventory', icon: FaTint, label: 'Blood Inventory' },
              { key: 'donors', icon: FaUsers, label: 'Donor Network' },
              { key: 'requests', icon: FaClipboardList, label: 'Blood Requests' },
              { key: 'history', icon: FaHistory, label: 'Activity Log' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setActivePanel(item.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 group ${
                  activePanel === item.key
                    ? 'bg-red-50 text-red-700 font-semibold shadow-sm border-l-4 border-red-500'
                    : 'text-gray-700 hover:bg-red-50/70 hover:text-red-700 hover:shadow-sm'
                }`}
              >
                <div className={`p-2 rounded-lg ${activePanel === item.key ? 'bg-red-100' : 'bg-gray-100 group-hover:bg-red-100'}`}>
                  <item.icon className="text-xl" />
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 p-6 lg:p-10">
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-3xl text-gray-700 hover:text-red-600 transition-colors"
            >
              <FaBars />
            </button>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-8 capitalize tracking-tight animate-fade-up">
            {activePanel.replace('-', ' ')}
          </h2>

          <div className="bg-white rounded-3xl shadow-lg border border-red-100 p-8 lg:p-10 transition-all duration-300 hover:shadow-xl">
            {loading && activePanel === 'inventory' ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">Loading inventory...</p>
              </div>
            ) : error && activePanel === 'inventory' ? (
              <div className="text-center py-12 text-red-600">
                <p>{error}</p>
              </div>
            ) : (
              <>
                {activePanel === 'inventory' && (
                  <div className="space-y-8">
                    {/* Header with summary */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">Blood Inventory Management</h3>
                        <p className="text-gray-600 mt-1">
                          Last updated: {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div className="bg-gray-100 px-5 py-3 rounded-lg text-sm font-medium">
                        Total Units in Stock: <span className="text-red-700 font-bold text-lg">
                          {inventory.reduce((sum, i) => sum + i.units, 0)}
                        </span>
                      </div>
                    </div>

                    {/* Status legend */}
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span>Good stock (≥10 units)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                        <span>Low stock (1–9 units)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span>Critical (0 units)</span>
                      </div>
                    </div>

                    {/* Colored Inventory Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((group) => {
                        const item = inventory.find(i => i.bloodGroup === group) || { units: 0 };
                        const status = item.units >= 10 ? 'good' : item.units >= 1 ? 'low' : 'critical';

                        return (
                          <div
                            key={group}
                            className={`p-6 rounded-2xl shadow-md border transition-all hover:shadow-xl hover:scale-[1.02] ${
                              status === 'good' ? 'bg-green-50 border-green-200' :
                              status === 'low' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-2xl font-bold text-gray-900">{group}</h4>
                              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                                status === 'good' ? 'bg-green-100 text-green-800' :
                                status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {status === 'good' ? 'Good' : status === 'low' ? 'Low' : 'Critical'}
                              </span>
                            </div>

                            <p className="text-5xl font-extrabold text-gray-900 mb-2">{item.units}</p>
                            <p className="text-sm text-gray-600 mb-6">Units Available</p>

                            {/* Quick +1 / -1 buttons */}
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleUpdateInventory(group, 1, 'add')}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                              >
                                +1 Unit
                              </button>
                              <button
                                onClick={() => handleUpdateInventory(group, 1, 'subtract')}
                                disabled={item.units <= 0}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
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

                    {/* Bulk Update Form */}
                    <div className="mt-12 pt-8 border-t border-gray-200 bg-gray-50 rounded-2xl p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-6">Bulk Add / Remove Units</h4>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select
                          value={selectedGroup || ''}
                          onChange={(e) => setSelectedGroup(e.target.value)}
                          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                        >
                          <option value="">Select Blood Group</option>
                          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          placeholder="Enter number of units"
                          min="1"
                          value={updateUnits}
                          onChange={(e) => setUpdateUnits(e.target.value ? Number(e.target.value) : '')}
                          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                        />

                        <button
                          onClick={() => {
                            if (selectedGroup && updateUnits > 0) {
                              handleUpdateInventory(selectedGroup, updateUnits, 'add');
                              setUpdateUnits('');
                            }
                          }}
                          disabled={!selectedGroup || updateUnits <= 0}
                          className="py-3 px-6 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          Add Units
                        </button>

                        <button
                          onClick={() => {
                            if (selectedGroup && updateUnits > 0) {
                              handleUpdateInventory(selectedGroup, updateUnits, 'subtract');
                              setUpdateUnits('');
                            }
                          }}
                          disabled={!selectedGroup || updateUnits <= 0}
                          className="py-3 px-6 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          Remove Units
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other panels - unchanged */}
                {activePanel === 'donors' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900">Donor Network</h3>
                    <p className="text-gray-600 leading-relaxed">
                      View and search available donors, filter by blood group, location, last donation date, and availability status.
                    </p>
                  </div>
                )}

                {activePanel === 'requests' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900">Blood Requests</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Manage incoming requests — prioritize urgent/emergency cases, match donors, update status, and communicate directly.
                    </p>
                  </div>
                )}

                {activePanel === 'history' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900">Activity & Donation History</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Track fulfilled requests, donations received, inventory changes, and all important hospital actions.
                    </p>
                  </div>
                )}

                {activePanel === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900">Notifications</h3>
                    <p className="text-gray-600">
                      Hospital alerts, new urgent requests, low stock warnings, donor matches, etc.
                    </p>
                    <div className="bg-white rounded-3xl shadow border border-red-100 p-10 text-center text-gray-500">
                      <p className="text-xl">No new notifications yet</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default HospitalDashboard;