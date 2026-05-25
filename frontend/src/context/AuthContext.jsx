// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

// Axios defaults – set once at module level
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true;

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

  // Token interceptor – attach JWT to every request
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          const cleanToken = token.replace(/^["']+|["']+$/g, '').trim();
          config.headers.Authorization = `Bearer ${cleanToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url || '';
        // Skip auto-logout for the /me endpoint — initializeAuth handles that itself.
        // Also skip login/signup/verify routes to avoid redirect loops.
        const isAuthRoute = url.includes('/api/auth/me') ||
          url.includes('/api/auth/login') ||
          url.includes('/api/auth/signup') ||
          url.includes('/api/auth/google') ||
          url.includes('/api/auth/verify-email');

        if (error.response?.status === 401 && !isAuthRoute) {
          console.warn(`[401 Unauthorized] → ${url} | Session expired, redirecting to login`);
          logout();
          // Hard redirect so no more queued requests fire without a token
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Initialize auth on mount — fast-load from localStorage then verify with /me
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser  = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      if (storedToken) {
        try {
          const res = await axios.get('/api/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login – safe & flexible
  const login = useCallback(async (identifier, password) => {
    try {
      const payload = identifier.includes('@')
        ? { email: identifier.trim() }
        : { phone: identifier.trim() };

      const res = await axios.post('/api/auth/login', {
        ...payload,
        password: password.trim(),
      });

      if (res.data.success) {
        const token = res.data.token || res.data.user?.token || res.data.accessToken;
        if (!token || typeof token !== 'string') throw new Error('No token received from server');

        const cleanToken = token.replace(/^["']+|["']+$/g, '').trim();
        const userData = res.data.user || res.data;

        localStorage.setItem('token', cleanToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }

      throw new Error(res.data.message || 'Login failed');
    } catch (err) {
      throw err;
    }
  }, []);

  // Google Login / Register
  const googleLogin = useCallback(async (credential, role = 'receiver') => {
    try {
      const res = await axios.post('/api/auth/google', { credential, role });
      if (res.data.success) {
        const token = res.data.user?.token;
        if (!token || typeof token !== 'string') throw new Error('No token received');

        const cleanToken = token.replace(/^["']+|["']+$/g, '').trim();
        const userData = res.data.user;

        localStorage.setItem('token', cleanToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { userData, isNewUser: res.data.isNewUser };
      }
      throw new Error(res.data.message || 'Google login failed');
    } catch (err) {
      throw err;
    }
  }, []);

  // Signup – no auto-login; user must verify email first
  const signup = useCallback(async (data) => {
    try {
      const res = await axios.post('/api/auth/signup', data);
      if (res.data.success) {
        // Return email + role so Register page can redirect to verification
        return { email: res.data.email, role: res.data.role };
      }
      throw new Error(res.data.message || 'Signup failed');
    } catch (err) {
      console.error('[Signup] Failed:', err);
      throw err;
    }
  }, []);

  // Verify email OTP – logs user in on success
  const verifyEmail = useCallback(async (email, code) => {
    try {
      const res = await axios.post('/api/auth/verify-email', { email, code });
      if (res.data.success) {
        const token = res.data.user?.token;
        if (!token || typeof token !== 'string') throw new Error('No token received');

        const cleanToken = token.replace(/^["']+|["']+$/g, '').trim();
        const userData = res.data.user;

        localStorage.setItem('token', cleanToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
      throw new Error(res.data.message || 'Verification failed');
    } catch (err) {
      console.error('[VerifyEmail] Failed:', err);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const setPassword = useCallback(async (password, currentPassword = null) => {
    try {
      const payload = { password };
      if (currentPassword) payload.currentPassword = currentPassword;

      const res = await axios.post('/api/auth/set-password', payload);
      if (res.data.success) return res.data;
      throw new Error(res.data.message || 'Failed to set password');
    } catch (err) {
      throw err;
    }
  }, []);

  // Memoize the context value so consumers only re-render when user or loading
  // actually changes — not on every AuthProvider render.
  const value = useMemo(
    () => ({ user, setUser, loading, login, signup, logout, googleLogin, verifyEmail, setPassword }),
    [user, loading, login, signup, logout, googleLogin, verifyEmail, setPassword]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
