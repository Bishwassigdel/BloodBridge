// src/pages/BloodRequest.jsx
import { useLocation, useNavigate } from 'react-router-dom'; // ← add useNavigate
import { useState, useEffect } from 'react'; // ← add useEffect for fallback
import axios from 'axios';

function BloodRequest() {
  const location = useLocation();
  const navigate = useNavigate(); // ← new
  const searchParams = new URLSearchParams(location.search);
  const isEmergency = searchParams.get('mode') === 'emergency';

  const [formData, setFormData] = useState({
    bloodGroup: '',
    units: '1',
    hospital: '',
    contactPhone: '',
    note: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fallback check: if no token, redirect to login (ProtectedRoute should handle this, but extra safety)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [navigate, location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        hospital: formData.hospital,
        bloodGroup: formData.bloodGroup,
        units: Number(formData.units),
        urgency: isEmergency ? 'emergency' : 'normal',
        location: formData.hospital,
        contactPhone: formData.contactPhone,
        note: formData.note
      };

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login first');

      const res = await axios.post('/api/blood/request', payload);

      if (res.data.success) {
        setSubmitted(true);

        if (isEmergency) {
          setTimeout(() => {
            window.open(
              `https://wa.me/9779801230045?text=Emergency%20blood%20request%3A%20${formData.bloodGroup}%20(${formData.units}%20units)%20needed%20at%20${formData.hospital}%2C%20Contact%3A%20${formData.contactPhone}%20Note%3A%20${formData.note}`,
              '_blank'
            );
          }, 1500);
        }
      } else {
        setError(res.data.message || 'Failed to submit request');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border border-red-100 p-8 lg:p-10">
        {isEmergency && (
          <div className="bg-red-100 border-l-4 border-red-600 p-5 mb-8 rounded-r-xl">
            <h2 className="text-2xl font-bold text-red-800">🚑 EMERGENCY BLOOD NEEDED</h2>
            <p className="text-red-700 mt-2">
              Please fill only essential details — we prioritize these requests!
            </p>
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
          {isEmergency ? 'Emergency Blood Request' : 'Request Blood'}
        </h1>

        {submitted ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🩸</div>
            <h2 className="text-3xl font-bold text-red-700 mb-4">
              {isEmergency ? 'Emergency Request Sent!' : 'Request Submitted!'}
            </h2>
            <p className="text-xl mb-8 text-gray-700">
              {isEmergency 
                ? 'We notified matching donors near you. Connecting to helpline...' 
                : 'We will match donors and notify you soon.'}
            </p>
            {isEmergency && (
              <p className="text-red-600 font-semibold">
                If no response in 5 minutes, call: 9801230045
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Blood Group Needed <span className="text-red-600">*</span>
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 rounded-2xl border border-red-100 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none bg-white transition-all"
              >
                <option value="">Select blood group</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Units Needed <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="units"
                min="1"
                max="10"
                value={formData.units}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 rounded-2xl border border-red-100 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hospital Name & District <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="hospital"
                placeholder="e.g. Teaching Hospital, Kathmandu"
                value={formData.hospital}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 rounded-2xl border border-red-100 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Phone Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                name="contactPhone"
                placeholder="98XXXXXXXX"
                value={formData.contactPhone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                className="w-full px-5 py-4 rounded-2xl border border-red-100 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Note {isEmergency ? '(optional, max 100 chars)' : '(optional)'}
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                maxLength={isEmergency ? 100 : 500}
                rows={isEmergency ? 2 : 4}
                className="w-full px-5 py-4 rounded-2xl border border-red-100 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none bg-white transition-all"
                placeholder={isEmergency 
                  ? "e.g. Thalassemia patient, urgent within 2 hours" 
                  : "Patient details, when needed, etc."}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all ${
                loading ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isEmergency 
                  ? 'bg-red-700 hover:bg-red-800 shadow-2xl hover:shadow-3xl' 
                  : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-2xl'
              }`}
            >
              {loading 
                ? 'Submitting...' 
                : isEmergency 
                  ? 'SEND EMERGENCY REQUEST' 
                  : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default BloodRequest;