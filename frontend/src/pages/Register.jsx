import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bloodGroup: '',
    location: '',
    role: 'donor' // default role
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!formData.username || !formData.email || !formData.location) {
      setError('Name, email, and location are required');
      setLoading(false);
      return;
    }

    if ((formData.role === 'donor' || formData.role === 'receiver') && !formData.bloodGroup) {
      setError('Blood group is required for donor or receiver');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || '',
        location: formData.location,
        role: formData.role,
        // Only send bloodGroup for donor/receiver
        ...(formData.role !== 'hospital' && { bloodGroup: formData.bloodGroup })
      };

      const newUser = await register(submitData);

      // Role-based redirect after successful registration
      if (newUser.role === 'donor') {
        navigate('/donor/dashboard');
      } else if (newUser.role === 'receiver') {
        navigate('/receiver/dashboard');
      } else if (newUser.role === 'hospital') {
        navigate('/hospital/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg">
        <h2 className="text-4xl font-bold text-center text-red-600 mb-8">Join BloodBridge</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection Buttons */}
          <div>
            <label className="block text-lg font-semibold mb-3 text-gray-700">I am registering as:</label>
            <div className="grid grid-cols-3 gap-4">
              {['donor', 'receiver', 'hospital'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: r })}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    formData.role === r
                      ? 'bg-red-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Name / Hospital Name */}
          <input
            type="text"
            name="username"
            placeholder={formData.role === 'hospital' ? 'Hospital Name *' : 'Full Name *'}
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address *"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition"
          />

          {/* Blood Group & Location for Donor/Receiver */}
          {(formData.role === 'donor' || formData.role === 'receiver') && (
            <>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition"
              >
                <option value="">Select Blood Group *</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="location"
                placeholder="City / District *"
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition"
              />
            </>
          )}

          {/* Address for Hospital */}
          {formData.role === 'hospital' && (
            <input
              type="text"
              name="location"
              placeholder="Hospital Address *"
              required
              value={formData.location}
              onChange={handleChange}
              className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition"
            />
          )}

          {/* Phone (Optional) */}
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number (optional)"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 characters) *"
            required
            minLength="6"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition"
          />

          {/* Confirm Password */}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password *"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-70"
          >
            {loading ? 'Creating Account...' : 'Register Now'}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-red-600 font-bold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;