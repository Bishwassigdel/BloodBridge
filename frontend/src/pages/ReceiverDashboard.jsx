// src/pages/ReceiverDashboard.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dummyBloodRequests } from '../data/dummyData';
import { useAuth } from '../context/AuthContext';

function ReceiverDashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [myRequests] = useState(dummyBloodRequests);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-red-600 mb-8">Receiver Dashboard</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-2">Welcome back, {user.username}!</h2>
            <p className="text-gray-600">Role: Receiver</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Need Blood?</h2>
            <p className="text-gray-600 mb-4">
              Create a blood request to find available donors in your area.
            </p>
            <Link
              to="/blood-request"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Create Blood Request
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">My Blood Requests</h2>
            
            {myRequests.length > 0 ? (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Request #{request.id}
                          </h3>
                          <span className={`px-3 py-1 rounded text-sm font-medium ${
                            request.status === 'Fulfilled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-gray-600">
                          <p><span className="font-medium">Blood Group:</span> {request.bloodGroup}</p>
                          <p><span className="font-medium">Units:</span> {request.units}</p>
                          <p><span className="font-medium">Location:</span> {request.location}</p>
                          <p><span className="font-medium">Hospital:</span> {request.hospital}</p>
                          <p><span className="font-medium">Urgency:</span>{' '}
                            <span className={`px-2 py-1 rounded ${request.urgency === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {request.urgency}
                            </span>
                          </p>
                          <p><span className="font-medium">Date:</span> {request.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You haven't created any blood requests yet.</p>
                <Link to="/blood-request" className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                  Create Your First Request
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ReceiverDashboard;