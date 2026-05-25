// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// ── Pages — lazy loaded so each route's code only downloads when visited ─
const Home             = lazy(() => import('./pages/Home'));
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword    = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail      = lazy(() => import('./pages/VerifyEmail'));
const SearchDonors     = lazy(() => import('./pages/SearchDonors'));
const Contact          = lazy(() => import('./pages/Contact'));
const SubmitStory      = lazy(() => import('./pages/SubmitStory'));
const Dashboard        = lazy(() => import('./pages/dashboard'));
const HospitalDashboard= lazy(() => import('./pages/HospitalDashboard'));
const BloodRequest     = lazy(() => import('./pages/BloodRequest'));
const Profile          = lazy(() => import('./pages/Profile'));
const EditProfile      = lazy(() => import('./pages/EditProfile'));
const BloodTransfer    = lazy(() => import('./pages/BloodTransfer'));
const EmergencyRespond = lazy(() => import('./pages/EmergencyRespond'));

// ── Components (small, always needed — keep eager) ───────────────────────
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';

// ── Spinner shown while a page chunk is downloading ──────────────────────
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div style={{ width: 36, height: 36, border: '3px solid #dc2626', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public Routes ─────────────────────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/blood-transfer" element={<BloodTransfer />} />
          <Route path="/emergency-respond" element={<EmergencyRespond />} />
          <Route path="/search-donors" element={<SearchDonors />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/submit-story" element={<SubmitStory />} />

          {/* ── Protected Routes ──────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/blood-request" element={<BloodRequest />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
          </Route>

          {/* ── 404 ───────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
