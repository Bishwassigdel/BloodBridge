// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaHeartbeat,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from 'react-icons/fa';

function Footer() {
  return (
    <footer className="bg-gradient-to-br from-red-800 via-rose-900 to-red-950 text-white">
      {/* Main Content – Smaller */}
      <div className="container mx-auto px-6 py-10 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & About – Compact */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                <FaHeartbeat className="text-2xl text-white animate-pulse" />
              </div>
              <h3 className="text-xl font-bold">BloodConnect</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Connecting donors, receivers & hospitals in real-time to save lives across Nepal.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-300 hover:text-rose-300 text-xl transition hover:scale-110">
                <FaFacebookF />
              </a>
              <a href="#" className="text-gray-300 hover:text-rose-300 text-xl transition hover:scale-110">
                <FaTwitter />
              </a>
              <a href="#" className="text-gray-300 hover:text-rose-300 text-xl transition hover:scale-110">
                <FaInstagram />
              </a>
              <a href="#" className="text-gray-300 hover:text-rose-300 text-xl transition hover:scale-110">
                <FaLinkedinIn />
              </a>
            </div>
          </div>

          {/* Quick Links – Smaller */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-rose-200">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><Link to="/search-donors" className="hover:text-white transition">Find Donors</Link></li>
              <li><Link to="/blood-request" className="hover:text-white transition">Request Blood</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Register</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Login</Link></li>
            </ul>
          </div>

          {/* For Everyone – Smaller */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-rose-200">For Everyone</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard" className="hover:text-white transition">Donor Dashboard</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition">Receiver Dashboard</Link></li>
              <li><Link to="/hospital/dashboard" className="hover:text-white transition">Hospital Dashboard</Link></li>
              <li><Link to="/submit-story" className="hover:text-white transition">Share Your Story</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact – Compact */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-rose-200">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-rose-300 text-lg mt-1" />
                <span>Kathmandu, Nepal<br />(Nationwide support)</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhoneAlt className="text-rose-300 text-lg" />
                <span>+977 976-8528140</span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-rose-300 text-lg" />
                <a href="mailto:bloodbridge10@gmail.com" className="hover:text-white transition">
                  bloodbridge10@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar – Slim */}
      <div className="bg-black/40 border-t border-rose-800/30">
        <div className="container mx-auto px-6 py-4 text-center text-gray-400 text-xs">
          <p>© {new Date().getFullYear()} BloodConnect. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-6 flex-wrap">
            <Link to="/privacy" className="hover:text-rose-300 transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-rose-300 transition">Terms of Service</Link>
            <Link to="/contact" className="hover:text-rose-300 transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;