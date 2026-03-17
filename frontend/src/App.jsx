// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ── Public Pages ────────────────────────────────────────────────────────
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// ── Protected Pages ─────────────────────────────────────────────────────
import Dashboard from './pages/dashboard';     
import HospitalDashboard from './pages/HospitalDashboard';
import BloodRequest from './pages/BloodRequest';     // optional standalone request page
import Profile from './pages/Profile';               // view profile
import EditProfile from './pages/EditProfile';       // universal edit profile form (works for all user types)
import BloodTransfer from './pages/BloodTransfer';    // blood transfer acceptance

// ── Components ──────────────────────────────────────────────────────────
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';        // clean 404 page

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* ── Public Routes (no authentication required) ───────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/blood-transfer" element={<BloodTransfer />} />

        {/* ── Protected Routes (require login) ─────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          {/* Main user dashboard (shared for donors & receivers) */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Hospital admin dashboard */}
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />

          {/* Blood request form (if you want it as a separate full page) */}
          <Route path="/blood-request" element={<BloodRequest />} />

          {/* Profile routes - Universal for all user types */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
        </Route>

        {/* ── 404 - Catch-all route (must be last) ─────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;