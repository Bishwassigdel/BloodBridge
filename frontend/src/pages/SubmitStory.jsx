// src/pages/SubmitStory.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHeartbeat,
  FaPen,
  FaCheckCircle,
  FaSpinner,
  FaArrowLeft,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function SubmitStory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.message.trim()) {
      setError('Please fill in both the title and your story.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/stories', form);
      setSuccess(true);
      setForm({ title: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share story. Please try again.');
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
            <FaPen className="text-4xl" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Share Your Story</h1>
        <p className="text-rose-200 text-lg max-w-xl mx-auto">
          Your experience can inspire others. Share how blood donation made a difference in your life or someone you love.
        </p>
      </section>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-14 md:px-12 max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium mb-8 transition"
        >
          <FaArrowLeft />
          Back to Home
        </Link>

        {success ? (
          <div className="bg-white rounded-3xl shadow-lg border border-green-100 p-12 text-center">
            <div className="flex justify-center mb-5">
              <div className="p-5 bg-green-100 rounded-full">
                <FaCheckCircle className="text-5xl text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Story Shared!</h2>
            <p className="text-gray-500 mb-2">
              Thank you for sharing your story. It will inspire others to donate blood and save lives.
            </p>
            <p className="text-gray-400 text-sm mb-8">Your story will appear on our community stories section after review.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition text-sm"
              >
                Share Another Story
              </button>
              <Link
                to="/"
                className="px-6 py-3 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition text-sm"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-red-100 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-2">
              <FaHeartbeat className="text-red-500 text-2xl animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-800">Your Story</h2>
            </div>
            <p className="text-gray-400 text-sm mb-8">
              Stories of hope, recovery, and generosity help build our community.
              {!user && (
                <> You can submit anonymously, or <Link to="/login" className="text-red-600 hover:underline">log in</Link> to have your name shown.</>
              )}
            </p>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Story Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. How a stranger saved my father's life"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Story <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Tell us what happened, how blood donation helped, and what it means to you..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition resize-none"
                />
                <p className="text-gray-400 text-xs mt-1 text-right">{form.message.length} characters</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaPen />
                      Share My Story
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setForm({ title: '', message: '' }); setError(''); }}
                  className="px-6 py-3 border border-gray-200 text-gray-500 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inspiration card */}
        <div className="mt-8 p-6 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl text-white text-center">
          <FaHeartbeat className="text-3xl mx-auto mb-3 animate-pulse" />
          <p className="font-semibold mb-1">Every story matters</p>
          <p className="text-rose-200 text-sm">
            One blood donation can save up to 3 lives. Your story could inspire the next donor.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default SubmitStory;
