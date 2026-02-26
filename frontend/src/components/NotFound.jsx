// src/components/NotFound.jsx
import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white px-6">
      <FaExclamationTriangle className="text-8xl md:text-9xl text-red-500 mb-8 animate-pulse" />
      <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6 text-center">
        Page Not Found
      </h2>
      <p className="text-lg text-gray-600 mb-10 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="px-8 py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 hover:shadow-xl transition-all duration-300"
      >
        Return to Home
      </Link>
    </div>
  );
}