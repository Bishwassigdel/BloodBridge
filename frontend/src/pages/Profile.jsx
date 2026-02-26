// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUser, FaHeartbeat, FaPhone, FaMapMarkerAlt, FaSave } from 'react-icons/fa';

function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bloodGroup: user?.bloodGroup || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        '/api/auth/profile', 
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setUser(res.data.user); // Update context
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setSuccess('Profile updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-red-100 p-8 lg:p-10">
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <FaUser className="text-5xl text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600 mt-2">Update your details to help us match you better</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-xl">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username (read-only or editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-gray-50"
              disabled // Optional: make username read-only
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="98XXXXXXXX"
                className="w-full pl-12 px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (City/District)
            </label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Kathmandu, Lalitpur"
                className="w-full pl-12 px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
              />
            </div>
          </div>

          {/* Blood Group – Most Important Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blood Group <span className="text-red-600">*</span>
            </label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white"
            >
              <option value="">Select your blood group</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-8 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-60 ${
              loading ? 'cursor-not-allowed' : 'hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="text-xl" />
                Save Profile
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center text-sm text-gray-500">
          Updating your blood group helps donors find you faster in emergencies.
        </div>
      </div>
    </div>
  );
}

export default Profile;