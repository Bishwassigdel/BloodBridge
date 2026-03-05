// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use environment variable for API base URL (important for production)
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  axios.defaults.headers.post['Content-Type'] = 'application/json';

  // Attach token to every request + handle 401 logout
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Auto login failed:', err.response?.data || err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        const token = res.data.token; // FIXED: token is at root level, not res.data.user.token
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.data.message || 'Login failed');
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const signup = async (data) => {
    try {
      const res = await axios.post('/api/auth/signup', data);
      if (res.data.success) {
        const token = res.data.token; // FIXED: token is at root level
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.data.message || 'Signup failed');
    } catch (err) {
      console.error('Signup frontend error:', err);
      throw new Error(
        err.response?.data?.message || 
        err.message || 
        'Signup failed - please try again'
      );
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};