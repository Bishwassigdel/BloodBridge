// src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const location = useLocation();

  // Check if user is authenticated (token exists)
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  // If not logged in → redirect to login and save the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optional: You can add role check later if needed
  // For now we allow all authenticated users to access protected routes
  // (You can tighten this by checking user.role from context or localStorage)

  return <Outlet />;
};

export default ProtectedRoute;