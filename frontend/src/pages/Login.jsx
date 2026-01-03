// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);

      // Role-based redirect after login
      if (loggedUser.role === 'donor') {
        navigate('/donor/dashboard');
      } else if (loggedUser.role === 'receiver') {
        navigate('/receiver/dashboard');
      } else if (loggedUser.role === 'hospital') {
        navigate('/hospital/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-4xl font-bold text-center text-red-600 mb-8">Welcome Back</h2>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          New to BloodBridge? <Link to="/register" className="text-red-600 font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;