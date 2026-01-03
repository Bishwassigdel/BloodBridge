// // src/pages/HospitalDashboard.jsx
// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Navbar from '../components/Navbar'
// import Footer from '../components/Footer'
// import { useAuth } from '../context/AuthContext'

// const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// function HospitalDashboard() {
//   const { user, logout, loading } = useAuth()
//   const navigate = useNavigate()

//   /* ---------------- INVENTORY ---------------- */
//   const [inventory, setInventory] = useState({
//     'A+': 10, 'A-': 4, 'B+': 8, 'B-': 3,
//     'AB+': 5, 'AB-': 2, 'O+': 12, 'O-': 6
//   })
//   const [inputUnits, setInputUnits] = useState({})

//   /* ---------------- DONORS (SUMMARY) ---------------- */
//   const [donors] = useState([
//     { id: 1, name: 'Ram Shrestha', blood: 'O+', lastDonation: '2025-01-10' },
//     { id: 2, name: 'Sita Rai', blood: 'A+', lastDonation: '2024-12-28' },
//     { id: 3, name: 'Aman Thapa', blood: 'B+', lastDonation: '2025-01-03' }
//   ])

//   /* ---------------- REQUESTS ---------------- */
//   const [requests, setRequests] = useState([
//     {
//       id: 101,
//       patient: 'Hari KC',
//       blood: 'O+',
//       units: 2,
//       urgency: 'High',
//       status: 'Pending'
//     },
//     {
//       id: 102,
//       patient: 'Nisha Lama',
//       blood: 'A-',
//       units: 1,
//       urgency: 'Medium',
//       status: 'Pending'
//     }
//   ])

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         Loading dashboard...
//       </div>
//     )
//   }

//   if (!user) {
//     navigate('/login')
//     return null
//   }

//   const handleLogout = () => {
//     logout()
//     navigate('/')
//   }

//   /* ---------------- INVENTORY ACTIONS ---------------- */
//   const updateStock = (group, type) => {
//     const units = Number(inputUnits[group] || 0)
//     if (units <= 0) return

//     setInventory(prev => ({
//       ...prev,
//       [group]:
//         type === 'add'
//           ? prev[group] + units
//           : Math.max(prev[group] - units, 0)
//     }))

//     setInputUnits({ ...inputUnits, [group]: '' })
//   }

//   /* ---------------- REQUEST ACTIONS ---------------- */
//   const handleApprove = (id, blood, units) => {
//     if (inventory[blood] < units) {
//       alert('Not enough stock!')
//       return
//     }

//     setInventory(prev => ({
//       ...prev,
//       [blood]: prev[blood] - units
//     }))

//     setRequests(prev =>
//       prev.map(r =>
//         r.id === id ? { ...r, status: 'Approved' } : r
//       )
//     )
//   }

//   const handleReject = (id) => {
//     setRequests(prev =>
//       prev.map(r =>
//         r.id === id ? { ...r, status: 'Rejected' } : r
//       )
//     )
//   }

//   const totalStock = Object.values(inventory).reduce((a, b) => a + b, 0)

//   return (
//     <div className="min-h-screen flex flex-col">
//       <Navbar user={user} onLogout={handleLogout} />

//       <main className="flex-grow bg-gray-50 py-8">
//         <div className="max-w-7xl mx-auto px-4">

//           {/* HEADER */}
//           <h1 className="text-3xl font-bold text-red-600 mb-6">
//             Hospital Dashboard
//           </h1>

//           {/* SUMMARY */}
//           <div className="grid md:grid-cols-3 gap-6 mb-8">
//             <div className="bg-white p-6 rounded shadow text-center">
//               <h2 className="text-4xl font-bold text-red-600">{totalStock}</h2>
//               <p>Total Blood Units</p>
//             </div>

//             <div className="bg-white p-6 rounded shadow text-center">
//               <h2 className="text-4xl font-bold">{donors.length}</h2>
//               <p>Active Donors</p>
//             </div>

//             <div className="bg-white p-6 rounded shadow text-center">
//               <h2 className="text-4xl font-bold text-orange-600">
//                 {requests.filter(r => r.status === 'Pending').length}
//               </h2>
//               <p>Pending Requests</p>
//             </div>
//           </div>

//           {/* INVENTORY */}
//           <div className="bg-white rounded shadow mb-10">
//             <h2 className="text-xl font-semibold p-4 border-b">
//               Blood Inventory
//             </h2>

//             <table className="w-full">
//               <thead className="bg-red-600 text-white">
//                 <tr>
//                   <th className="p-3 text-left">Group</th>
//                   <th className="p-3 text-left">Units</th>
//                   <th className="p-3 text-left">Manage</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {BLOOD_GROUPS.map(group => {
//                   const low = inventory[group] < 5
//                   return (
//                     <tr key={group} className="border-b">
//                       <td className="p-3 font-semibold">{group}</td>
//                       <td className={`p-3 ${low && 'text-red-600 font-bold'}`}>
//                         {inventory[group]} {low && '⚠'}
//                       </td>
//                       <td className="p-3 flex gap-2">
//                         <input
//                           type="number"
//                           className="w-20 border px-2 py-1 rounded"
//                           value={inputUnits[group] || ''}
//                           onChange={e =>
//                             setInputUnits({
//                               ...inputUnits,
//                               [group]: e.target.value
//                             })
//                           }
//                         />
//                         <button
//                           onClick={() => updateStock(group, 'add')}
//                           className="bg-green-600 text-white px-3 py-1 rounded"
//                         >
//                           + Add
//                         </button>
//                         <button
//                           onClick={() => updateStock(group, 'deduct')}
//                           className="bg-yellow-500 text-white px-3 py-1 rounded"
//                         >
//                           − Use
//                         </button>
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {/* REQUESTS */}
//           <div className="bg-white rounded shadow">
//             <h2 className="text-xl font-semibold p-4 border-b">
//               Blood Requests
//             </h2>

//             <table className="w-full">
//               <thead className="bg-gray-200">
//                 <tr>
//                   <th className="p-3">Patient</th>
//                   <th className="p-3">Blood</th>
//                   <th className="p-3">Units</th>
//                   <th className="p-3">Urgency</th>
//                   <th className="p-3">Status</th>
//                   <th className="p-3">Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {requests.map(r => (
//                   <tr key={r.id} className="border-b text-center">
//                     <td className="p-3">{r.patient}</td>
//                     <td className="p-3">{r.blood}</td>
//                     <td className="p-3">{r.units}</td>
//                     <td className={`p-3 font-semibold ${
//                       r.urgency === 'High' && 'text-red-600'
//                     }`}>
//                       {r.urgency}
//                     </td>
//                     <td className="p-3">{r.status}</td>
//                     <td className="p-3 space-x-2">
//                       {r.status === 'Pending' && (
//                         <>
//                           <button
//                             onClick={() =>
//                               handleApprove(r.id, r.blood, r.units)
//                             }
//                             className="bg-green-600 text-white px-3 py-1 rounded"
//                           >
//                             Approve
//                           </button>
//                           <button
//                             onClick={() => handleReject(r.id)}
//                             className="bg-red-600 text-white px-3 py-1 rounded"
//                           >
//                             Reject
//                           </button>
//                         </>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//         </div>
//       </main>

//       <Footer />
//     </div>
//   )
// }

// export default HospitalDashboard




import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  FaTint,
  FaUsers,
  FaClipboardList,
  FaHistory,
  FaUser,
  FaSignOutAlt,
  FaHospitalAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaCalendarAlt,
  FaArrowRight,
  FaSearch,
  FaBars,
  FaTimes
} from 'react-icons/fa'
import {
  dummyInventory,
  dummyBloodRequests,
  dummyDonors,
  dummyHistory
} from '../data/dummyData'

function HospitalDashboard({ user }) {
  const navigate = useNavigate()

  const [activePanel, setActivePanel] = useState('inventory')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inventory] = useState(dummyInventory)
  const [requests] = useState(dummyBloodRequests)
  const [donors] = useState(dummyDonors)
  const [history] = useState(dummyHistory)
  const [searchTerm, setSearchTerm] = useState('')

  // ✅ LOGOUT HANDLER (USED BY SIDEBAR + NAVBAR)
  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true }) // Home.jsx
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredDonors = donors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredRequests = requests.filter(r =>
    r.requesterName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ✅ TOP NAVBAR */}
      <Navbar user={user} />

      <div className="flex pt-20">

        {/* ===== SIDEBAR (UNCHANGED) ===== */}
        <aside
          className={`w-64 bg-white border-r fixed h-screen z-40 transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
        >
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaHospitalAlt className="text-red-600 text-xl" />
              <div>
                <h1 className="font-bold">BloodBridge</h1>
                <p className="text-xs text-gray-500">Hospital Portal</p>
              </div>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <FaTimes />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {[
              ['inventory', FaTint, 'Inventory'],
              ['donors', FaUsers, 'Donors'],
              ['requests', FaClipboardList, 'Blood Requests'],
              ['history', FaHistory, 'History']
            ].map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => {
                  setActivePanel(key)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activePanel === key
                    ? 'bg-red-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t space-y-2">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg"
            >
              <FaUser /> Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 lg:ml-64 p-6">
          <div className="lg:hidden mb-4">
            <button onClick={() => setSidebarOpen(true)}>
              <FaBars className="text-2xl" />
            </button>
          </div>

          <h2 className="text-3xl font-bold mb-4 capitalize">
            {activePanel}
          </h2>

          <div className="bg-white rounded-xl shadow-md p-6">
            {activePanel === 'inventory' && <p>Inventory Panel</p>}
            {activePanel === 'donors' && <p>Donors Panel</p>}
            {activePanel === 'requests' && <p>Blood Requests Panel</p>}
            {activePanel === 'history' && <p>History Panel</p>}
          </div>
        </main>
      </div>
    </div>
  )
}

export default HospitalDashboard
