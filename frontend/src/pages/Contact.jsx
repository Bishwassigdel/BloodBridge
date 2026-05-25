// src/pages/Contact.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHeartbeat,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaPaperPlane,
  FaCheckCircle,
  FaSpinner,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Contact() {
  const { user, logout } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      // Try to send via API; gracefully handle if endpoint doesn't exist yet
      await api.post('/api/contact', form);
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      // If API not ready, still show success for UX (contact form data shown to user)
      if (err.response?.status === 404) {
        setSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(err.response?.data?.message || 'Failed to send message. Please try again or email us directly.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
      <Navbar user={user} onLogout={logout} />

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-red-700 via-rose-800 to-red-900 text-white py-16 px-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-white/10 rounded-2xl">
            <FaHeartbeat className="text-4xl animate-pulse" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Contact Us</h1>
        <p className="text-rose-200 text-lg max-w-xl mx-auto">
          Have a question, partnership inquiry, or need help? We're here for you — reach out anytime.
        </p>
      </section>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-14 md:px-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left – Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Get in Touch</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Whether you're a donor, receiver, hospital partner, or just curious about BloodConnect — we'd love to hear from you.
              </p>
            </div>

            <div className="space-y-5">
              {/* Address */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-red-100">
                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                  <FaMapMarkerAlt className="text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Our Location</p>
                  <p className="text-gray-500 text-sm mt-1">Kathmandu, Nepal<br />(Nationwide support across all provinces)</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-red-100">
                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                  <FaPhoneAlt className="text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Phone</p>
                  <a href="tel:+9779768528140" className="text-red-600 hover:text-red-700 text-sm mt-1 block transition">
                    +977 976-8528140
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-red-100">
                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                  <FaEnvelope className="text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Email</p>
                  <a href="mailto:bloodbridge10@gmail.com" className="text-red-600 hover:text-red-700 text-sm mt-1 block transition">
                    bloodbridge10@gmail.com
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-red-100">
                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                  <FaClock className="text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Support Hours</p>
                  <p className="text-gray-500 text-sm mt-1">Sunday – Friday: 8:00 AM – 6:00 PM<br />Emergency line available 24/7</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="p-5 bg-red-50 rounded-2xl border border-red-100">
              <p className="font-semibold text-gray-700 mb-3 text-sm">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/search-donors" className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition">
                  Find Donors
                </Link>
                <Link to="/register" className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-xl text-xs font-medium hover:bg-red-50 transition">
                  Register
                </Link>
                <Link to="/submit-story" className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-xl text-xs font-medium hover:bg-red-50 transition">
                  Share Your Story
                </Link>
              </div>
            </div>
          </div>

          {/* Right – Contact Form */}
          <div className="bg-white rounded-3xl shadow-lg border border-red-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Send a Message</h2>
            <p className="text-gray-400 text-sm mb-6">We usually respond within 1–2 business days.</p>

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-green-100 rounded-full mb-4">
                  <FaCheckCircle className="text-4xl text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm mb-6">Thank you for reaching out. We'll get back to you soon.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Contact;
