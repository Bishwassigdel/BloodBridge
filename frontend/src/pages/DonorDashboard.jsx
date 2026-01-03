import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  FaUser,
  FaHistory,
  FaClipboardList,
  FaToggleOn,
  FaToggleOff,
  FaBell,
  FaSignOutAlt,
  FaHeartbeat,
  FaHospitalAlt,
  FaTint,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimes,
  FaExclamationTriangle,
  FaBars,
  FaTimes as FaClose
} from 'react-icons/fa'
import { dummyBloodRequests, dummyDonationHistory, dummyNotifications } from '../data/dummyData'

/**
 * Donor Dashboard Component
 * Complete dashboard with sidebar and panels: My Profile, Donation History, Blood Requests, Availability Status, Notifications
 */
function DonorDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [activePanel, setActivePanel] = useState('profile')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAvailable, setIsAvailable] = useState(user?.available !== false)
  const [requests] = useState(dummyBloodRequests)
  const [donationHistory] = useState(dummyDonationHistory)
  const [notifications] = useState(dummyNotifications)

  // Filter requests matching donor's blood group
  const matchingRequests = requests.filter(
    request => request.bloodGroup === user?.bloodGroup && request.status === 'Pending'
  )

  // Handle logout - clear localStorage and redirect
  const handleLogout = () => {
    localStorage.removeItem('bloodbridge_user')
    navigate('/')
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'request':
        return <FaClipboardList className="text-red-600" />
      case 'reminder':
        return <FaBell className="text-yellow-600" />
      case 'thank':
        return <FaCheckCircle className="text-green-600" />
      default:
        return <FaBell className="text-gray-600" />
    }
  }

  // Render My Profile Panel
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-red-200 flex items-center justify-center">
            <FaUser className="text-4xl text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user?.name || 'Donor Name'}</h2>
            <p className="text-gray-600">{user?.email || 'donor@example.com'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <FaTint className="text-2xl text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Blood Group</p>
                <p className="text-xl font-bold text-red-600">{user?.bloodGroup || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <FaMapMarkerAlt className="text-2xl text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-lg font-semibold text-gray-800">{user?.location || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <FaPhone className="text-2xl text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-lg font-semibold text-gray-800">{user?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <FaEnvelope className="text-2xl text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-semibold text-gray-800">{user?.email || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Donation Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-600">{donationHistory.length}</p>
              <p className="text-sm text-gray-500">Total Donations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {donationHistory.reduce((sum, d) => sum + d.units, 0)}
              </p>
              <p className="text-sm text-gray-500">Units Donated</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {donationHistory.length > 0 ? donationHistory[0].date : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">Last Donation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render Donation History Panel
  const renderDonationHistory = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaHistory className="text-3xl text-green-600" />
            <span className="text-2xl font-bold text-green-700">{donationHistory.length}</span>
          </div>
          <p className="text-sm font-medium text-green-800">Total Donations</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaTint className="text-3xl text-blue-600" />
            <span className="text-2xl font-bold text-blue-700">
              {donationHistory.reduce((sum, d) => sum + d.units, 0)}
            </span>
          </div>
          <p className="text-sm font-medium text-blue-800">Total Units</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaCheckCircle className="text-3xl text-purple-600" />
            <span className="text-2xl font-bold text-purple-700">
              {donationHistory.filter(d => d.status === 'Completed').length}
            </span>
          </div>
          <p className="text-sm font-medium text-purple-800">Completed</p>
        </div>
      </div>

      <div className="space-y-4">
        {donationHistory.map((donation) => (
          <div
            key={donation.id}
            className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <FaTint className="text-xl text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Donation #{donation.id}</h3>
                    <p className="text-sm text-gray-500">{donation.hospital}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(donation.status)}`}>
                    {donation.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mt-3">
                  <div className="flex items-center gap-2">
                    <FaTint className="text-red-600" />
                    <span><strong>Blood Group:</strong> {donation.bloodGroup}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaTint className="text-red-600" />
                    <span><strong>Units:</strong> {donation.units}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400" />
                    <span><strong>{donation.date}</strong> at {donation.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Render Blood Requests Panel
  const renderBloodRequests = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Matching Requests</h3>
            <p className="text-sm text-gray-600">Blood requests matching your blood group ({user?.bloodGroup || 'N/A'})</p>
          </div>
          <span className="text-2xl font-bold text-red-600">{matchingRequests.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {matchingRequests.length > 0 ? (
          matchingRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <FaHospitalAlt className="text-xl text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{request.hospital}</h3>
                      <p className="text-sm text-gray-500">Request ID: #{request.id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaTint className="text-red-600" />
                      <span><strong>Blood Group:</strong> {request.bloodGroup}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaTint className="text-red-600" />
                      <span><strong>Units Needed:</strong> {request.units}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <span><strong>Location:</strong> {request.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaCalendarAlt className="text-gray-400" />
                      <span><strong>Date:</strong> {request.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency} Urgency
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:w-auto">
                  <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2">
                    <FaCheckCircle />
                    Accept Request
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2">
                    <FaTimes />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
            <FaClipboardList className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No pending blood requests matching your blood group at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )

  // Render Availability Status Panel
  const renderAvailabilityStatus = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Availability Status</h2>
            <p className="text-gray-600">Toggle your availability for blood donation requests</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-lg font-semibold ${isAvailable ? 'text-green-600' : 'text-gray-600'}`}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className="relative focus:outline-none"
            >
              {isAvailable ? (
                <FaToggleOn className="text-5xl text-green-600" />
              ) : (
                <FaToggleOff className="text-5xl text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Information</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FaCheckCircle className={`text-xl mt-1 ${isAvailable ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium text-gray-800">
                  {isAvailable ? 'You are currently available for donation requests' : 'You are currently unavailable'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {isAvailable
                    ? 'Hospitals and receivers can see your profile and contact you for blood donations.'
                    : 'You will not receive new donation requests until you set yourself as available.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaHeartbeat className="text-xl text-red-600 mt-1" />
              <div>
                <p className="font-medium text-gray-800">Last Donation</p>
                <p className="text-sm text-gray-600 mt-1">
                  {donationHistory.length > 0
                    ? `Your last donation was on ${donationHistory[0].date} at ${donationHistory[0].hospital}`
                    : 'No donation history available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render Notifications Panel
  const renderNotifications = () => {
    const unreadCount = notifications.filter(n => !n.read).length

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
              <p className="text-sm text-gray-600">Stay updated with donation requests and reminders</p>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {unreadCount} New
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-300 ${
                  !notification.read ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    !notification.read ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaCalendarAlt />
                      <span>{notification.date} at {notification.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
              <FaBell className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No notifications at the moment.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <FaHeartbeat className="text-xl text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">BloodBridge</h1>
              <p className="text-xs text-gray-500">Donor Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-600 hover:text-gray-800"
          >
            <FaClose className="text-xl" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setActivePanel('profile')
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activePanel === 'profile'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaUser className="text-lg" />
            <span className="font-medium">My Profile</span>
          </button>
          <button
            onClick={() => {
              setActivePanel('history')
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activePanel === 'history'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaHistory className="text-lg" />
            <span className="font-medium">Donation History</span>
          </button>
          <button
            onClick={() => {
              setActivePanel('requests')
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activePanel === 'requests'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaClipboardList className="text-lg" />
            <span className="font-medium">Blood Requests</span>
          </button>
          <button
            onClick={() => {
              setActivePanel('availability')
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activePanel === 'availability'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaToggleOn className="text-lg" />
            <span className="font-medium">Availability Status</span>
          </button>
          <button
            onClick={() => {
              setActivePanel('notifications')
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
              activePanel === 'notifications'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaBell className="text-lg" />
            <span className="font-medium">Notifications</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute right-3 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </nav>

        {/* User Actions */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <FaSignOutAlt className="text-lg" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Navbar */}
        <Navbar user={user} onLogout={handleLogout} />

        <div className="p-4 lg:p-6">
          {/* Mobile Header */}
          <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-4 rounded-lg shadow-md">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              <FaBars className="text-2xl" />
            </button>
            <div className="flex items-center gap-2">
              <FaHeartbeat className="text-2xl text-red-600" />
              <h1 className="text-xl font-bold text-gray-800">BloodBridge</h1>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {activePanel === 'profile' && 'My Profile'}
              {activePanel === 'history' && 'Donation History'}
              {activePanel === 'requests' && 'Blood Requests'}
              {activePanel === 'availability' && 'Availability Status'}
              {activePanel === 'notifications' && 'Notifications'}
            </h2>
            <p className="text-gray-600">
              {activePanel === 'profile' && 'View and manage your donor profile information'}
              {activePanel === 'history' && 'Track your past blood donation history'}
              {activePanel === 'requests' && 'View and respond to blood donation requests'}
              {activePanel === 'availability' && 'Manage your availability for donations'}
              {activePanel === 'notifications' && 'Stay updated with donation requests and reminders'}
            </p>
          </div>

          {/* Panel Content */}
          <div className="bg-white rounded-xl shadow-md p-6">
            {activePanel === 'profile' && renderProfile()}
            {activePanel === 'history' && renderDonationHistory()}
            {activePanel === 'requests' && renderBloodRequests()}
            {activePanel === 'availability' && renderAvailabilityStatus()}
            {activePanel === 'notifications' && renderNotifications()}
          </div>
        </div>
      </main>
    </div>
  )
}

export default DonorDashboard
