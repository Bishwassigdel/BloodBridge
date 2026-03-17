// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
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

  // Token interceptor – clean & log
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          const cleanToken = token.replace(/^["']+|["']+$/g, '').trim();
          config.headers.Authorization = `Bearer ${cleanToken}`;
          console.log(`[Axios Request] → ${config.url} | Token (first 20): ${cleanToken.substring(0, 20)}...`);
        } else {
          console.log(`[Axios Request] → ${config.url} | No token`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn(`[401 Unauthorized] → ${error.config?.url} | Logging out`);
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

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[Auth Init] Starting...');

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      // Fast load from localStorage
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('[Auth Init] Loaded from storage → role:', parsedUser.role || 'missing');
          setUser(parsedUser);
        } catch (err) {
          console.error('[Auth Init] Invalid stored data:', err.message);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      // Verify token with /me if present
      if (storedToken) {
        try {
          const res = await axios.get('/api/auth/me');
          if (res.data.success) {
            console.log('[Auth Init] /me success → role:', res.data.user.role);
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            console.warn('[Auth Init] /me failed');
            logout();
          }
        } catch (err) {
          console.error('[Auth Init] /me failed:', err.response?.data?.message || err.message);
          logout();
        }
      }

      setLoading(false);
      console.log('[Auth Init] Done');
    };

    initializeAuth();
  }, []);

  // Login – safe & flexible
  const login = async (identifier, password) => {
    console.log('[Login] Attempting:', { identifier });

    try {
      const payload = identifier.includes('@')
        ? { email: identifier.trim() }
        : { phone: identifier.trim() };

      const res = await axios.post('/api/auth/login', {
        ...payload,
        password: password.trim(),
      });

      console.log('[Login] Full response:', JSON.stringify(res.data, null, 2));

      if (res.data.success) {
        let token = res.data.token || res.data.user?.token || res.data.accessToken;

        if (!token || typeof token !== 'string') {
          console.warn('[Login] No valid token in response');
          throw new Error('No token received from server');
        }

        const cleanToken = token.replace(/^["']+|["']+$/g, '').trim();
        const userData = res.data.user || res.data;

        console.log('[Login] Token saved (first 30 chars):', cleanToken.substring(0, 30) + '...');
        console.log('[Login] Role:', userData.role || 'missing');

        localStorage.setItem('token', cleanToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return userData;
      }

      throw new Error(res.data.message || 'Login failed');
    } catch (err) {
      console.error('[Login] Failed:', err.response?.data?.message || err.message);
      throw err;
    }
  };

  // Google Login / Register
  const googleLogin = async (credential, role = 'receiver') => {
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
      console.error('[Google Login] Failed:', err.response?.data?.message || err.message);
      throw err;
    }
  };

  // Signup – no auto-login; user must verify email first
  const signup = async (data) => {
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
  };

  // Verify email OTP – logs user in on success
  const verifyEmail = async (email, code) => {
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
  };

  const logout = () => {
    console.log('[Logout] Clearing auth');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const setPassword = async (password, currentPassword = null) => {
    try {
      const payload = { password };
      if (currentPassword) {
        payload.currentPassword = currentPassword;
      }

      const res = await axios.post('/api/auth/set-password', payload);

      if (res.data.success) {
        console.log('[SetPassword] Success:', res.data.message);
        return res.data;
      }
      throw new Error(res.data.message || 'Failed to set password');
    } catch (err) {
      console.error('[SetPassword] Failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout, googleLogin, verifyEmail, setPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
